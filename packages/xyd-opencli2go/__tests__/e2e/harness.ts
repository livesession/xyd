import { execSync, spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Command, OpencliSpecJson } from '@xyd-js/opencli';

import { opencli2go, writeProject } from '../../index';
import { buildLeafModel, type GoType } from '../../src/model';

// Reusable, self-contained end-to-end harness for opencli2go. An API's whole
// e2e is two calls (see e2e/openai.test.ts):
//   recordE2E({ name, cliName, fixturesDir })  // (gated) write per-command recorded.json
//   defineE2E({ name, cliName, fixturesDir })  // offline binding guard + real-CLI check
// The only inputs are the committed per-method fixtures (input.json = OpenCLI);
// the full CLI is assembled by merging them — no OpenAPI/upstream dependency.

export interface RecordedRequest {
  method: string;
  path: string;
  query: string[];
  contentType?: string;
  bodyFields: string[];
  auth: string;
}

export interface RecordedFixture {
  args: string[]; // full CLI invocation (command path + positionals + required flags)
  request: RecordedRequest; // the request a correct CLI should send
}

export interface ApiConfig {
  name: string;
  cliName: string;
  /** Per-method fixtures dir: <slug>/input.json (OpenCLI) [+ output.go, recorded.json]. */
  fixturesDir: string;
}

const PLACEHOLDER = 'EXAMPLE';

export function hasGo(): boolean {
  try {
    execSync('go version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const fromOption = (from: string | undefined): string | undefined =>
  from?.startsWith('option:') ? from.slice('option:'.length) : undefined;

/** Walk an OpenCLI spec down its first branch to the single leaf command. */
export function leafCommand(spec: OpencliSpecJson): { command: Command; path: string[] } | null {
  let node = spec.commands?.[0];
  const cp: string[] = [];
  while (node) {
    cp.push(node.name);
    if (node.commands?.length) node = node.commands[0];
    else return { command: node, path: cp };
  }
  return null;
}

/** The CLI invocation + request a correct CLI should record, using required flags. */
// A typed flag (int/float) rejects a non-numeric placeholder at urfave's parse
// stage — so the value must match the emitted flag type. Reuse the generator's
// own type model so the placeholder never drifts from the generated flag.
function examplePlaceholder(goType: GoType | undefined): string {
  return goType === 'int' || goType === 'float' ? '1' : PLACEHOLDER;
}

function exampleInvocation(leaf: { command: Command; path: string[] }): { args: string[]; setFlags: Set<string> } {
  const goTypeByName = new Map(buildLeafModel(leaf.command).flags.map((f) => [f.flagName, f.goType]));
  const positionals = (leaf.command.arguments || []).map(() => PLACEHOLDER);
  const flagArgs: string[] = [];
  const setFlags = new Set<string>();
  for (const o of leaf.command.options || []) {
    if (!o.required) continue;
    setFlags.add(o.name);
    flagArgs.push(`--${o.name}`);
    if (o.arguments?.length) flagArgs.push(examplePlaceholder(goTypeByName.get(o.name)));
  }
  return { args: [...leaf.path, ...positionals, ...flagArgs], setFlags };
}

export function expectedRequest(spec: OpencliSpecJson, command: Command, setFlags: Set<string>): RecordedRequest {
  const x = (command['x-openapi'] || {}) as any;
  const query: string[] = [];
  const bodyFields: string[] = [];
  for (const p of x.params || []) {
    if (p.in === 'query') {
      const opt = fromOption(p.from);
      if (opt && setFlags.has(opt)) query.push(p.name);
    }
  }
  for (const bp of x.body?.properties || []) {
    const opt = fromOption(bp.from);
    if (opt && setFlags.has(opt)) bodyFields.push(bp.name);
  }
  const kind = spec['x-openapi']?.security?.[0]?.kind || x.security?.[0]?.kind || '';
  const req: RecordedRequest = {
    method: String(x.method || 'get').toLowerCase(),
    path: x.path || '',
    query: query.sort(),
    bodyFields: bodyFields.sort(),
    auth: kind.startsWith('apiKey') ? 'apikey' : kind || 'bearer',
  };
  // The generated runtime always assembles a JSON body (multipart is a known gap).
  if (x.body) req.contentType = 'application/json';
  return req;
}

/** Merge per-method OpenCLI docs (single branches) into one full OpenCLI doc. */
function mergeCommands(target: Command[], source: Command[]) {
  for (const s of source) {
    const existing = target.find((t) => t.name === s.name);
    if (!existing) {
      target.push(JSON.parse(JSON.stringify(s)));
    } else if (existing.commands?.length && s.commands?.length) {
      mergeCommands(existing.commands, s.commands);
    } // leaf collision → keep the first (distinct operations shouldn't collide)
  }
}

function loadPerMethod(fixturesDir: string): { slug: string; opencli: OpencliSpecJson; leaf: { command: Command; path: string[] } }[] {
  if (!fs.existsSync(fixturesDir)) return [];
  const out: { slug: string; opencli: OpencliSpecJson; leaf: { command: Command; path: string[] } }[] = [];
  for (const slug of fs.readdirSync(fixturesDir).sort()) {
    const inPath = path.join(fixturesDir, slug, 'input.json');
    if (!fs.existsSync(inPath)) continue;
    const opencli = JSON.parse(fs.readFileSync(inPath, 'utf8')) as OpencliSpecJson;
    const leaf = leafCommand(opencli);
    if (leaf?.command['x-openapi']) out.push({ slug, opencli, leaf });
  }
  return out;
}

/** Assemble the full OpenCLI doc by merging the committed per-method docs. */
export function fullOpencli(fixturesDir: string, cliName: string): OpencliSpecJson {
  const methods = loadPerMethod(fixturesDir);
  const root: OpencliSpecJson = {
    opencli: methods[0]?.opencli.opencli || '1.0.0',
    info: methods[0]?.opencli.info || { title: cliName, version: '1.0.0' },
    commands: [],
  };
  if (methods[0]?.opencli['x-openapi']) root['x-openapi'] = methods[0].opencli['x-openapi'];
  for (const m of methods) mergeCommands(root.commands!, m.opencli.commands || []);
  return root;
}

export class RecordingServer {
  private server: http.Server;
  port = 0;
  last: { method: string; url: string; headers: http.IncomingHttpHeaders; body: string } | null = null;

  constructor() {
    this.server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        this.last = { method: req.method || '', url: req.url || '', headers: req.headers, body };
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end('{"ok":true}');
      });
    });
  }

  start(): Promise<void> {
    return new Promise((r) => this.server.listen(0, '127.0.0.1', () => { this.port = (this.server.address() as any).port; r(); }));
  }

  stop() {
    this.server.close();
  }
}

export function normalizeRecorded(raw: NonNullable<RecordingServer['last']>): RecordedRequest {
  const [p, qs] = (raw.url || '').split('?');
  const query = qs ? [...new URLSearchParams(qs).keys()].sort() : [];
  let bodyFields: string[] = [];
  try {
    const parsed = raw.body ? JSON.parse(raw.body) : {};
    if (parsed && typeof parsed === 'object') bodyFields = Object.keys(parsed).sort();
  } catch {
    /* non-JSON body */
  }
  const authHeader = (raw.headers.authorization as string) || '';
  const auth = authHeader.startsWith('Bearer ') ? 'bearer' : authHeader ? 'apikey' : '';
  return { method: (raw.method || '').toLowerCase(), path: p, query, bodyFields, auth, contentType: ((raw.headers['content-type'] as string) || '').split(';')[0] || undefined };
}

export function diffRequest(actual: RecordedRequest, fixture: RecordedRequest): string[] {
  const errs: string[] = [];
  if (actual.method !== fixture.method) errs.push(`method ${actual.method} != ${fixture.method}`);
  const re = new RegExp(`^${fixture.path.replace(/[.]/g, '\\.').replace(/\{[^}]+\}/g, '[^/]+')}$`);
  if (!re.test(actual.path)) errs.push(`path ${actual.path} !~ ${fixture.path}`);
  if (actual.query.join(',') !== fixture.query.join(',')) errs.push(`query [${actual.query}] != [${fixture.query}]`);
  for (const f of fixture.bodyFields) if (!actual.bodyFields.includes(f)) errs.push(`body missing ${f}`);
  if (actual.auth !== fixture.auth) errs.push(`auth ${actual.auth} != ${fixture.auth}`);
  return errs;
}

async function buildCli(spec: OpencliSpecJson): Promise<{ binPath: string; tmpDir: string }> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2g-e2e-'));
  await writeProject(opencli2go(spec), tmpDir);
  execSync('go mod tidy', { cwd: tmpDir, stdio: 'pipe' });
  execSync(`go build -o cli ./cmd/${spec.info?.title || 'cli'}`, { cwd: tmpDir, stdio: 'pipe' });
  return { binPath: path.join(tmpDir, 'cli'), tmpDir };
}

function runAndRecord(binPath: string, args: string[], server: RecordingServer, env: NodeJS.ProcessEnv): Promise<RecordedRequest | null> {
  return new Promise((resolve) => {
    server.last = null;
    const p = spawn(binPath, args, { stdio: ['ignore', 'ignore', 'ignore'], env });
    const done = () => resolve(server.last ? normalizeRecorded(server.last) : null);
    const t = setTimeout(() => { p.kill('SIGKILL'); done(); }, 8000);
    p.on('exit', () => { clearTimeout(t); done(); });
    p.on('error', () => { clearTimeout(t); done(); });
  });
}

/** (Gated E2E_RECORD=1) Write per-command recorded.json (args + assumed-correct request). */
export function recordE2E(cfg: ApiConfig) {
  if (process.env.E2E_RECORD !== '1') return;
  describe(`${cfg.name} e2e: record fixtures`, () => {
    it('write <command>/recorded.json', () => {
      const methods = loadPerMethod(cfg.fixturesDir);
      for (const m of methods) {
        const { args, setFlags } = exampleInvocation(m.leaf);
        const fixture: RecordedFixture = { args, request: expectedRequest(m.opencli, m.leaf.command, setFlags) };
        fs.writeFileSync(path.join(cfg.fixturesDir, m.slug, 'recorded.json'), `${JSON.stringify(fixture, null, 2)}\n`);
      }
      expect(methods.length).toBeGreaterThan(100);
    });
  });
}

/** Register the e2e tests for an API from its committed per-method fixtures. */
export function defineE2E(cfg: ApiConfig) {
  if (process.env.E2E_RECORD === '1') return;
  const methods = loadPerMethod(cfg.fixturesDir).filter((m) => fs.existsSync(path.join(cfg.fixturesDir, m.slug, 'recorded.json')));
  const items = methods.map((m) => ({ ...m, fixture: JSON.parse(fs.readFileSync(path.join(cfg.fixturesDir, m.slug, 'recorded.json'), 'utf8')) as RecordedFixture }));
  const E2E = process.env.E2E_CLI === '1';
  const ENV = (port: number) => ({ ...process.env, [`${cfg.cliName.toUpperCase()}_BASE_URL`]: `http://127.0.0.1:${port}`, [`${cfg.cliName.toUpperCase()}_API_KEY`]: 'sk-e2e-test' });

  // Offline guard (no Go): fixtures stay consistent with the OpenCLI binding.
  describe.skipIf(!items.length)(`${cfg.name} e2e: recorded requests match the OpenCLI binding`, () => {
    for (const m of items) {
      it(`${m.leaf.path.join(' ')} → ${m.fixture.request.method.toUpperCase()} ${m.fixture.request.path}`, () => {
        const { setFlags } = exampleInvocation(m.leaf);
        expect(expectedRequest(m.opencli, m.leaf.command, setFlags)).toEqual(m.fixture.request);
      });
    }
  });

  // Real-CLI check (gated; runs where Go binaries execute, e.g. CI).
  if (E2E && items.length) {
    describe(`${cfg.name} e2e: real CLI requests match fixtures`, () => {
      const server = new RecordingServer();
      let binPath = '';
      let tmpDir = '';
      let buildError: unknown = null;
      let binaryRuns = false;

      beforeAll(async () => {
        await server.start();
        if (!hasGo()) {
          buildError = new Error('go toolchain not available');
          return;
        }
        try {
          ({ binPath, tmpDir } = await buildCli(fullOpencli(cfg.fixturesDir, cfg.cliName)));
        } catch (e) {
          buildError = e;
          return;
        }
        binaryRuns = (await runAndRecord(binPath, items[0].fixture.args, server, ENV(server.port))) !== null;
      }, 600000);

      afterAll(() => {
        server.stop();
        if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
      });

      it('the whole CLI compiled', () => {
        expect(buildError, `${buildError}`).toBeNull();
        expect(fs.existsSync(binPath)).toBe(true);
      });

      for (const m of items) {
        it(`${m.leaf.path.join(' ')} → ${m.fixture.request.method.toUpperCase()} ${m.fixture.request.path}`, async (ctx) => {
          if (!binaryRuns) return ctx.skip();
          const actual = await runAndRecord(binPath, m.fixture.args, server, ENV(server.port));
          expect(actual, `${m.slug} made no request`).not.toBeNull();
          expect(diffRequest(actual!, m.fixture.request), m.slug).toEqual([]);
        }, 15000);
      }
    });
  }
}
