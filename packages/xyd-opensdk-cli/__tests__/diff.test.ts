import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { beforeAll, describe, expect, it, vi } from 'vitest';

import { openapi2opensdkFromSource } from '@xyd-js/openapi2opensdk';
import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { converterOptions, diffCommand, parseCommand } from '../src';

// The petstore OpenAPI doc vendored as the converter's 1.basic fixture.
const SPEC = path.join(__dirname, '../../xyd-openapi2opensdk/__fixtures__/1.basic/input.json');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-diff-'));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function writeIR(dir: string, name: string, ir: OpensdkSpecJson): string {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${JSON.stringify(ir, null, 2)}\n`);
  return file;
}

/** Run diffCommand capturing the human report (console.log) and returning both. */
async function runDiff(opts: Parameters<typeof diffCommand>[0]): Promise<{ code: number; report: string }> {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    const code = await diffCommand(opts);
    return { code, report: log.mock.calls.map((call) => call.join(' ')).join('\n') };
  } finally {
    log.mockRestore();
  }
}

let baseIR: OpensdkSpecJson;

beforeAll(async () => {
  baseIR = await openapi2opensdkFromSource(SPEC, {});
});

describe('diff command', () => {
  it('exits 0 with "No changes." when both sides are the same spec', async () => {
    const { code, report } = await runDiff({ base: SPEC, head: SPEC });
    expect(code).toBe(0);
    expect(report).toContain('No changes.');
  });

  it('exits 2 when a method is removed (breaking), grouped report + counts line', async () => {
    const dir = tmp();
    try {
      const head = clone(baseIR);
      const removed = head.resources?.[0]?.methods?.pop();
      expect(removed).toBeDefined();
      const { code, report } = await runDiff({
        base: writeIR(dir, 'base.json', baseIR),
        head: writeIR(dir, 'head.json', head),
      });
      expect(code).toBe(2);
      expect(report).toContain('BREAKING (1)');
      expect(report).toContain('method-removed');
      expect(report).toContain(`pets.${removed?.action}`);
      expect(report).toContain('1 breaking, 0 risky, 0 safe (1 change)');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 0 when an optional parameter is added (safe)', async () => {
    const dir = tmp();
    try {
      const head = clone(baseIR);
      const method = head.resources?.[0]?.methods?.[0];
      method?.queryParams?.push({ name: 'verbose', type: { kind: 'scalar', scalar: 'boolean' }, required: false });
      const base = writeIR(dir, 'base.json', baseIR);
      const headPath = writeIR(dir, 'head.json', head);

      const { code, report } = await runDiff({ base, head: headPath });
      expect(code).toBe(0);
      expect(report).toContain('SAFE (1)');
      expect(report).toContain('param-added');

      // The same safe-only diff still exits 0 at --fail-on risky, but 1 at any.
      expect((await runDiff({ base, head: headPath, failOn: 'risky' })).code).toBe(0);
      expect((await runDiff({ base, head: headPath, failOn: 'any' })).code).toBe(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 1 when only risky changes exist (method deprecated)', async () => {
    const dir = tmp();
    try {
      const head = clone(baseIR);
      const method = head.resources?.[0]?.methods?.[0];
      if (method) method.deprecated = true;
      const { code, report } = await runDiff({
        base: writeIR(dir, 'base.json', baseIR),
        head: writeIR(dir, 'head.json', head),
      });
      expect(code).toBe(1);
      expect(report).toContain('RISKY (1)');
      expect(report).toContain('deprecated-added');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('--json prints the machine-readable IrDiff to stdout', async () => {
    const dir = tmp();
    try {
      const head = clone(baseIR);
      head.resources?.[0]?.methods?.pop();
      const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      let code: number;
      let stdout: string;
      try {
        code = await diffCommand({
          base: writeIR(dir, 'base.json', baseIR),
          head: writeIR(dir, 'head.json', head),
          json: true,
        });
        stdout = write.mock.calls.map((call) => String(call[0])).join('');
      } finally {
        write.mockRestore();
      }
      expect(code).toBe(2);
      const payload = JSON.parse(stdout);
      expect(Array.isArray(payload.changes)).toBe(true);
      expect(payload.changes).toHaveLength(1);
      expect(payload.changes[0]).toMatchObject({
        severity: 'breaking',
        kind: 'method-removed',
        path: 'pets.retrieve',
        detail: expect.any(String),
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects an invalid --fail-on value', async () => {
    await expect(
      diffCommand({ base: SPEC, head: SPEC, failOn: 'oops' as never }),
    ).rejects.toThrow(/Invalid --fail-on value/);
  });
});

describe('config sdk passthrough', () => {
  it('converterOptions maps config `sdk` onto the converter option `sdkBehavior`', () => {
    const sdk = { retry: { maxRetries: 5 }, timeout: { defaultTimeoutMs: 30000 } };
    expect(converterOptions({ sdk }).sdkBehavior).toEqual(sdk);
    expect(converterOptions({})).not.toHaveProperty('sdkBehavior');
  });

  it('parse threads `sdk` overrides into the IR merged over the canonical defaults', async () => {
    const dir = tmp();
    try {
      const out = path.join(dir, 'ir.json');
      await parseCommand({
        spec: SPEC,
        output: out,
        sdk: { retry: { maxRetries: 7 }, timeout: { defaultTimeoutMs: 1234 } },
      });
      const ir = JSON.parse(fs.readFileSync(out, 'utf8')) as OpensdkSpecJson;
      expect(ir.sdk?.retry?.maxRetries).toBe(7);
      expect(ir.sdk?.timeout?.defaultTimeoutMs).toBe(1234);
      // Untouched policies keep the canonical defaults (never re-hardcoded elsewhere).
      expect(ir.sdk?.retry?.retryableStatusCodes).toEqual([408, 429, 500, 502, 503, 504]);
      expect(ir.sdk?.idempotency?.headerName).toBe('Idempotency-Key');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
