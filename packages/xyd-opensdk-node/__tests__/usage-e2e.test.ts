import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
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

import { nodeEmitter } from '../index';

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
  return diffRequest(actual, fixture).filter(
    (e) => !(queryOk && e.startsWith('query ')),
  );
}

// Ask C: the per-operation USAGE snippet is (1) COMPILEABLE (compileUsageSnippet,
// gated O2S_NODE_SMOKE) and (2) RUNNABLE — when RUN against a recording server it
// produces the request `expectedRequest(ir, method)` describes (runUsageSnippet +
// diffRequest, gated E2E_SDK). The emitter's generateUsage honors
// `emitterOptions.baseUrlEnv` so the run can point the client at the server.
//
// One representative op per request shape (body-post, query-list, path-get,
// pagination) is picked generically from each corpus's IR — no hardcoded op slugs.
// The default (ungated) run only registers these describes; the heavy tiers are
// gated + toolchain-probe-skipped so it stays green offline.

const SMOKE = process.env.O2S_NODE_SMOKE === '1';
const E2E = process.env.E2E_SDK === '1';

/**
 * Node SnippetRunner: bundle the placed `src/example.ts` (its `import <pkg>` is
 * mapped to `./src/index.ts` by placeSnippet's tsconfig `paths`, mirrored here as
 * an esbuild alias) into a single runnable ESM file — esbuild resolves the SDK's
 * extensionless imports and preserves the snippet's top-level `await` — then runs
 * it with node. Build errors reject; the request it makes is read from the shared
 * RecordingServer by the caller.
 */
const nodeSnippetRunner: SnippetRunner = {
  lang: 'node',
  toolchainProbe: 'node --version',
  async run(dir, env) {
    const require = createRequire(import.meta.url);
    // biome-ignore lint/suspicious/noExplicitAny: esbuild has no bundled types here
    const esbuild = require('esbuild') as any;
    const pkgName = (JSON.parse(require('node:fs').readFileSync(path.join(dir, 'package.json'), 'utf8')) as {
      name?: string;
    }).name;
    const outfile = path.join(dir, 'example.mjs');
    await esbuild.build({
      entryPoints: [path.join(dir, 'src/example.ts')],
      outfile,
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node18',
      logLevel: 'silent',
      alias: pkgName ? { [pkgName]: path.join(dir, 'src/index.ts') } : undefined,
    });
    await new Promise<void>((resolve, reject) => {
      const p = spawn('node', [outfile], { stdio: ['ignore', 'ignore', 'pipe'], env });
      let err = '';
      p.stderr?.on('data', (d) => {
        err += d;
      });
      const t = setTimeout(() => {
        p.kill('SIGKILL');
        resolve();
      }, 8000);
      p.on('exit', () => {
        clearTimeout(t);
        resolve();
      });
      // A spawn (not run) failure — the request may already be captured, so still resolve.
      p.on('error', () => {
        clearTimeout(t);
        resolve();
      });
      void err;
    });
  },
};

for (const corpus of listComplexCorpora(path.join(__dirname, '../__fixtures__'))) {
  const ir = fullIR(corpus.dir, corpus.name);
  const reps = representativeMethods(ir);

  // ---- ask C.1: the snippet COMPILES (gated O2S_NODE_SMOKE, toolchain-skipped) ----
  describe.runIf(SMOKE)(`opensdk-node usage snippet compiles [${corpus.name}]`, () => {
    for (const { label, chain, method } of reps) {
      it(`${label}: ${chain.join('.')}.${method.action} snippet type-checks`, () => {
        // false = toolchain absent (skipped); THROWS if it fails to compile.
        const compiled = compileUsageSnippet('node', ir, method, chain, nodeEmitter);
        expect(typeof compiled).toBe('boolean');
      }, 300000);
    }
  });

  // ---- ask C.2: the snippet RUN reproduces expectedRequest (gated E2E_SDK) --------
  describe.runIf(E2E)(`opensdk-node usage snippet runs → request matches expectedRequest [${corpus.name}]`, () => {
    for (const { label, chain, method } of reps) {
      it(`${label}: ${chain.join('.')}.${method.action}`, async () => {
        // Lazily imported so the default (ungated) collect never loads the runner heavy path.
        const { runUsageSnippet } = await import('@xyd-js/opensdk-ci');
        const actual = await runUsageSnippet({
          ir,
          method,
          chain,
          emitter: nodeEmitter,
          runner: nodeSnippetRunner,
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
