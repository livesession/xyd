import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { deferencedOpenAPI } from '@xyd-js/openapi';

import { openapi2opencli } from '../index';
import {
  buildOpIndex,
  commandFlags,
  type DocsMethodResolved,
  extractCliCommand,
  joinDocsMethod,
  parseOverviewMethods,
  type SpecOp,
} from '../oracle/docsOracle';

const ORACLE_DIR = path.join(__dirname, '../oracle');
const FIXTURES = path.join(__dirname, '../__fixtures__/-2.complex.openai');
const METHODS = path.join(ORACLE_DIR, 'docs-methods.json');
const ALLOW = path.join(ORACLE_DIR, 'docs-allowlist.json');
const FLOOR = path.join(ORACLE_DIR, 'docs-coverage.floor.json');
const REPORT = path.join(ORACLE_DIR, 'docs-coverage.report.json');
const OPENAPI = path.join(__dirname, '../../xyd-openapi/__fixtures__/-2.complex.openai/input.yaml');
const OVERVIEW = 'https://developers.openai.com/api/reference/overview';

const REFRESH = process.env.DOCS_REFRESH === '1';
const RESEED = process.env.DOCS_RESEED === '1';

async function pool<T, R>(items: T[], concurrency: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }),
  );
  return results;
}

// ---- Docs refresh (network; opt-in) --------------------------------------
describe.skipIf(!REFRESH)('docs oracle refresh (network)', () => {
  it('fetch overview + 270+ CLI pages → fixtures + docs-methods.json', async () => {
    const overviewHtml = await fetch(OVERVIEW).then((r) => r.text());
    const methods = parseOverviewMethods(overviewHtml);
    expect(methods.length).toBeGreaterThan(250);

    const resolved = await pool(methods, 8, async (m): Promise<DocsMethodResolved | null> => {
      try {
        const html = await fetch(m.cliUrl).then((r) => r.text());
        const cli = extractCliCommand(html);
        if (!cli) return null;
        return { ...m, docCommand: cli.command, docFlags: commandFlags(cli.flags) };
      } catch {
        return null;
      }
    });

    const ok = resolved.filter((m): m is DocsMethodResolved => m !== null);
    fs.mkdirSync(ORACLE_DIR, { recursive: true });
    fs.writeFileSync(METHODS, `${JSON.stringify(ok, null, 2)}\n`);

    // Per-method, individually reviewable fixtures.
    fs.rmSync(FIXTURES, { recursive: true, force: true });
    for (const m of ok) {
      const dir = path.join(FIXTURES, m.commandPath.join('__'));
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'expected.json'),
        `${JSON.stringify(
          { commandPath: m.commandPath, httpMethod: m.httpMethod, docFlags: m.docFlags, docCommand: m.docCommand, docUrl: m.cliUrl },
          null,
          2,
        )}\n`,
      );
    }
    expect(ok.length).toBeGreaterThan(250);
  }, 600000);
});

// ---- Conformance (offline; reads docs-methods.json + the vendored spec) ----
// Input source: a current openai-openapi vendored alongside the oracle.
const SPEC = path.join(ORACLE_DIR, 'openai-openapi.yaml');
const BUILD_INPUTS = process.env.DOCS_BUILD_INPUTS === '1';

const methods: DocsMethodResolved[] = fs.existsSync(METHODS) ? JSON.parse(fs.readFileSync(METHODS, 'utf8')) : [];

interface OurCmd {
  commandPath: string[];
  flagNames: Set<string>;
}
// Our generated commands, indexed by the source operation `${method} ${path}`.
const oursByOp = new Map<string, OurCmd>();
const rawOps = new Map<string, any>();
let specIndex = new Map<string, SpecOp>();

async function build() {
  const doc = await deferencedOpenAPI(SPEC);
  if (!doc) throw new Error(`vendored openai-openapi not found at ${SPEC}`);

  const opcli = openapi2opencli(doc, { cliName: 'openai' });
  const walk = (cmds: any[], prefix: string[]) => {
    for (const c of cmds) {
      const p = [...prefix, c.name];
      if (c.commands?.length) {
        walk(c.commands, p);
      } else if (c['x-openapi']) {
        const x = c['x-openapi'];
        const names = [...(c.arguments || []).map((a: any) => a.name), ...(c.options || []).map((o: any) => o.name)];
        oursByOp.set(`${x.method} ${x.path}`, { commandPath: p, flagNames: new Set<string>(names) });
      }
    }
  };
  walk(opcli.commands || [], []);

  specIndex = buildOpIndex(doc);
  for (const [p, item] of Object.entries(doc.paths || {})) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const op = (item as any)?.[method];
      if (op) rawOps.set(`${method} ${p}`, op);
    }
  }
}

const opOf = (m: DocsMethodResolved): SpecOp | null => joinDocsMethod(m.commandPath, m.httpMethod, specIndex);
const ourOf = (m: DocsMethodResolved): OurCmd | undefined => {
  const op = opOf(m);
  return op ? oursByOp.get(`${op.method} ${op.path}`) : undefined;
};
const key = (m: DocsMethodResolved) => m.commandPath.join(' ');
const evalM = (m: DocsMethodResolved) => {
  const c = ourOf(m);
  const matched = !!c && c.commandPath.join(' ') === key(m);
  const flagsOk = matched && m.docFlags.every((f) => c!.flagNames.has(f));
  return { hasInput: !!opOf(m), matched, flagsOk };
};

function inputView(op: SpecOp): Record<string, unknown> {
  const raw = rawOps.get(`${op.method} ${op.path}`) || {};
  const parameters = (raw.parameters || []).map((p: any) => ({ name: p.name, in: p.in, required: !!p.required }));
  const body = raw.requestBody?.content || {};
  const contentType = Object.keys(body)[0];
  const schema = contentType ? body[contentType].schema : undefined;
  const requestBody = contentType
    ? { contentType, required: !!raw.requestBody?.required, properties: Object.keys(schema?.properties || {}) }
    : undefined;
  return { httpMethod: op.method, path: op.path, operationId: op.operationId, title: op.title, summary: raw.summary, parameters, requestBody };
}

describe.skipIf(!methods.length)('docs conformance: openapi → opencli vs OpenAI CLI docs', () => {
  beforeAll(build, 300000);

  const allow = new Set<string>(
    fs.existsSync(ALLOW) ? JSON.parse(fs.readFileSync(ALLOW, 'utf8')).knownDivergent || [] : [],
  );

  // Opt-in: write a per-method input.json (the OpenAPI operation it maps to).
  it.runIf(BUILD_INPUTS)('write per-method input.json', () => {
    for (const m of methods) {
      const dir = path.join(FIXTURES, m.commandPath.join('__'));
      if (!fs.existsSync(dir)) continue;
      const op = opOf(m);
      const input = op
        ? inputView(op)
        : { note: 'No matching operation in the vendored openai-openapi (newer/renamed resource).' };
      fs.writeFileSync(path.join(dir, 'input.json'), `${JSON.stringify(input, null, 2)}\n`);
    }
  });

  // Opt-in: regenerate the backlog from whatever currently fails.
  it.runIf(RESEED)('reseed allowlist (backlog)', () => {
    const failing = methods.filter((m) => {
      const { matched, flagsOk } = evalM(m);
      return !(matched && flagsOk);
    });
    fs.writeFileSync(
      ALLOW,
      `${JSON.stringify(
        { note: 'Methods whose generated command/flags do not yet match the OpenAI CLI docs (burn-down backlog). Remove entries as openapi2opencli improves.', knownDivergent: failing.map(key).sort() },
        null,
        2,
      )}\n`,
    );
  });

  // One test per documented method (the "hundreds of tests"). Skipped while (re)building.
  for (const m of methods) {
    it.skipIf(RESEED || BUILD_INPUTS)(key(m), () => {
      if (allow.has(key(m))) return; // known divergence — tracked in docs-allowlist.json
      const { matched, flagsOk } = evalM(m);
      expect(matched, `command "${key(m)}" not produced from its operation`).toBe(true);
      expect(flagsOk, `flags missing for "${key(m)}": want ⊇ [${m.docFlags.join(', ')}]`).toBe(true);
    });
  }

  // Aggregate coverage + ratchet.
  it('overall coverage stays above the floor', () => {
    let withInput = 0;
    let matched = 0;
    let flagOk = 0;
    for (const m of methods) {
      const r = evalM(m);
      if (r.hasInput) withInput++;
      if (r.matched) matched++;
      if (r.matched && r.flagsOk) flagOk++;
    }
    const cmdCov = matched / methods.length;
    fs.writeFileSync(
      REPORT,
      `${JSON.stringify(
        {
          methods: methods.length,
          withInput,
          commandMatched: matched,
          fullyMatched: flagOk,
          commandCoverage: Number(cmdCov.toFixed(4)),
          fullCoverage: Number((flagOk / methods.length).toFixed(4)),
          allowlisted: allow.size,
          missingInput: methods.filter((m) => !evalM(m).hasInput).map(key).slice(0, 30),
        },
        null,
        2,
      )}\n`,
    );
    // eslint-disable-next-line no-console
    console.log(
      `[docs] command ${(cmdCov * 100).toFixed(1)}%  full ${((flagOk / methods.length) * 100).toFixed(1)}%  ` +
        `matched ${matched}/${methods.length}  withInput ${withInput}  allowlisted ${allow.size}`,
    );
    const floor = fs.existsSync(FLOOR) ? JSON.parse(fs.readFileSync(FLOOR, 'utf8')).command : 0;
    expect(cmdCov).toBeGreaterThanOrEqual(floor);
  });
});
