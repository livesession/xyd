import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import * as yaml from 'js-yaml';
import { describe, expect, it, vi } from 'vitest';

import { xsdkCommand } from '../src';

const PETSTORE = path.resolve(__dirname, '../../xyd-openapi2opensdk/__fixtures__/1.basic/input.json');

function tmpdir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-xsdk-'));
}

describe('xsdk command', () => {
  it('writes an enriched spec: root x-sdk languages + per-operation artifacts', async () => {
    const dir = tmpdir();
    try {
      const out = path.join(dir, 'enriched.json');
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      await xsdkCommand({ spec: PETSTORE, output: out });
      log.mockRestore();

      const doc = JSON.parse(fs.readFileSync(out, 'utf-8'));
      expect(doc['x-sdk'].languages).toEqual(['go', 'python', 'typescript', 'ruby', 'java', 'csharp']);

      const ops = Object.values(doc.paths).flatMap((p: any) =>
        Object.values(p).filter((op: any) => op && typeof op === 'object' && op['x-sdk']));
      expect(ops.length).toBeGreaterThan(0);
      const first: any = (ops[0] as any)['x-sdk'];
      expect(first.python.signature).toBeTruthy();
      expect(first.python.usage).toBeTruthy();
      expect(first.python.types.request).toBeDefined();
      expect(first.python.types.response).toBeDefined();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('honors --langs and picks yaml output from the extension', async () => {
    const dir = tmpdir();
    try {
      const out = path.join(dir, 'enriched.yaml');
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      await xsdkCommand({ spec: PETSTORE, output: out, langs: ['go', 'python'] });
      log.mockRestore();

      const doc = yaml.load(fs.readFileSync(out, 'utf-8')) as any;
      expect(doc['x-sdk'].languages).toEqual(['go', 'python']);
      const op = Object.values(doc.paths).flatMap((p: any) =>
        Object.values(p).filter((o: any) => o && typeof o === 'object' && o['x-sdk']))[0] as any;
      expect(Object.keys(op['x-sdk'])).toEqual(['go', 'python']);
      // the enriched spec must remain a VALID spec: $refs survive as maps, not anchors
      expect(fs.readFileSync(out, 'utf-8')).not.toContain('&ref');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('defaults to stdout, matching the input format', async () => {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      await xsdkCommand({ spec: PETSTORE });
      const out = (write.mock.calls[0]?.[0] ?? '') as string;
      expect(out.trimStart().startsWith('{')).toBe(true); // json in → json out
      expect(JSON.parse(out)['x-sdk']).toBeDefined();
    } finally {
      write.mockRestore();
    }
  });

  it('fails loudly on unknown-only languages', async () => {
    await expect(xsdkCommand({ spec: PETSTORE, langs: ['cobol'] })).rejects.toThrow(/no known SDK languages/);
  });
});
