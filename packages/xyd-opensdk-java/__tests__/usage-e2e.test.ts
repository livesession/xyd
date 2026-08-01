import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  type RecordedRequest,
  type SnippetRunner,
  compileUsageSnippet,
  diffRequest,
  expectedRequest,
  fullIR,
  listComplexCorpora,
  representativeMethods,
} from '@xyd-js/opensdk-ci';

import { javaEmitter } from '../index';

/**
 * A usage snippet is a "with all optionals + realistic values" doc example, while
 * `expectedRequest` is the minimal REQUIRED-ONLY request. They agree on
 * method/path/auth and on the required body fields (diffRequest already checks the
 * fixture's body fields as a SUBSET). The one place a required-only fixture and a
 * realistic snippet legitimately diverge is OPTIONAL query params, which
 * `diffRequest` compares by exact equality. This wrapper keeps every diffRequest
 * check EXCEPT it treats the snippet's query as correct when it is a superset of
 * the fixture's required query keys.
 */
function diffSnippetRequest(actual: RecordedRequest, fixture: RecordedRequest): string[] {
  const queryOk = fixture.query.every((q) => actual.query.includes(q));
  return diffRequest(actual, fixture).filter((e) => !(queryOk && e.startsWith('query ')));
}

// Ask C: the per-operation USAGE snippet is (1) COMPILEABLE (compileUsageSnippet,
// gated O2S_JAVA_SMOKE) and (2) RUNNABLE — when RUN against a recording server it
// produces the request `expectedRequest(ir, method)` describes (runUsageSnippet +
// diffRequest, gated E2E_SDK). The emitter's generateUsage honors
// `emitterOptions.baseUrlEnv` so the run can point the client at the server.
//
// One representative op per request shape (body-post, query-list, path-get,
// pagination) is picked GENERICALLY from each corpus's IR — no hardcoded op slugs.
// The default (ungated) run only registers these describes; the heavy tiers are
// gated + toolchain-probe-skipped so it stays green offline. Every complex corpus
// under __fixtures__ is discovered and looped.

const FIXTURES = path.join(__dirname, '../__fixtures__');

const SMOKE = process.env.O2S_JAVA_SMOKE === '1';
const E2E = process.env.E2E_SDK === '1';

/**
 * Java SnippetRunner: Java is compiled. `placeSnippet` wrote the whole SDK plus
 * the snippet at `Example.java` (declaring the SDK package, so `javac` compiles
 * them together). Compile every `.java` under `dir` to a classes dir, then run
 * the `Example` main via async spawn (NOT execSync — the RecordingServer runs in
 * THIS Node process; a synchronous child would block the loop and the snippet's
 * HTTP call would deadlock). The request it makes is read from the shared
 * RecordingServer by the caller; a run failure still resolves (the request may
 * already be captured before the response-decode error).
 */
function filesByExt(dir: string, ext: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesByExt(p, ext));
    else if (entry.name.endsWith(ext)) out.push(p);
  }
  return out;
}

const javaSnippetRunner: SnippetRunner = {
  lang: 'java',
  toolchainProbe: 'javac -version',
  async run(dir, env) {
    const classesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-java-snip-classes-'));
    const sources = filesByExt(dir, '.java');
    const argfile = path.join(dir, '__sources__.txt');
    fs.writeFileSync(argfile, sources.map((f) => JSON.stringify(f)).join('\n'));
    // Compile is a plain child (no server traffic yet), so execSync is safe here.
    execSync(`javac -d ${JSON.stringify(classesDir)} @${JSON.stringify(argfile)}`, { cwd: dir, stdio: 'pipe' });

    // The snippet declares the SDK's own package (see generateJavaUsage), so the
    // runnable main class is `<fullPackage>.Example`. Derive it from the emitted
    // Client.java path so this stays independent of the concrete package name.
    const clientRel = sources
      .map((s) => path.relative(dir, s))
      .find((r) => r.endsWith(`${path.sep}Client.java`));
    if (!clientRel) throw new Error('no Client.java in the placed snippet project');
    const fullPackage = clientRel
      .replace(new RegExp(`^src\\${path.sep}main\\${path.sep}java\\${path.sep}`), '')
      .replace(new RegExp(`\\${path.sep}Client\\.java$`), '')
      .split(path.sep)
      .join('.');

    try {
      await new Promise<void>((resolve) => {
        const p = spawn('java', ['-cp', classesDir, `${fullPackage}.Example`], {
          cwd: dir,
          stdio: ['ignore', 'ignore', 'pipe'],
          env,
        });
        const t = setTimeout(() => {
          p.kill('SIGKILL');
          resolve();
        }, 8000);
        p.on('exit', () => {
          clearTimeout(t);
          resolve();
        });
        p.on('error', () => {
          clearTimeout(t);
          resolve();
        });
      });
    } finally {
      fs.rmSync(classesDir, { recursive: true, force: true });
    }
  },
};

for (const corpus of listComplexCorpora(FIXTURES)) {
  const ir = fullIR(corpus.dir, corpus.name);
  const reps = representativeMethods(ir);

  // ---- ask C.1: the snippet COMPILES (gated O2S_JAVA_SMOKE, toolchain-skipped) ----
  describe.runIf(SMOKE)(`opensdk-java usage snippet compiles [${corpus.name}]`, () => {
    for (const { label, chain, method } of reps) {
      it(`${label}: ${chain.join('.')}.${method.action} snippet compiles`, () => {
        // false = toolchain absent (skipped); THROWS if it fails to compile.
        const compiled = compileUsageSnippet('java', ir, method, chain, javaEmitter);
        expect(typeof compiled).toBe('boolean');
      }, 300000);
    }
  });

  // ---- ask C.2: the snippet RUN reproduces expectedRequest (gated E2E_SDK) --------
  describe.runIf(E2E)(`opensdk-java usage snippet runs → request matches expectedRequest [${corpus.name}]`, () => {
    for (const { label, chain, method } of reps) {
      it(`${label}: ${chain.join('.')}.${method.action}`, async () => {
        // Lazily imported so the default (ungated) collect never loads the runner heavy path.
        const { runUsageSnippet } = await import('@xyd-js/opensdk-ci');
        const actual = await runUsageSnippet({
          ir,
          method,
          chain,
          emitter: javaEmitter,
          runner: javaSnippetRunner,
          sdkName: corpus.name,
        });
        // null = toolchain absent / no snippet / snippet made no request → skip.
        if (actual === null) return;
        // Superset-tolerant on optional query params (the snippet is a realistic
        // all-params example; expectedRequest is required-only). Every other
        // dimension (method/path/auth/required body fields) must match exactly.
        expect(diffSnippetRequest(actual, expectedRequest(ir, method))).toEqual([]);
      }, 300000);
    }
  });
}
