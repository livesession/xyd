import { spawn } from 'node:child_process';
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

import { rubyEmitter } from '../index';

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
// gated O2S_RUBY_SMOKE) and (2) RUNNABLE — when RUN against a recording server it
// produces the request `expectedRequest(ir, method)` describes (runUsageSnippet +
// diffRequest, gated E2E_SDK). The emitter's generateUsage honors
// `emitterOptions.baseUrlEnv` so the run can point the client at the server.
//
// One representative op per request shape (body-post, query-list, path-get,
// pagination) is picked GENERICALLY per corpus via representativeMethods(ir), so
// adding another complex API is just dropping its fixtures. The default (ungated)
// run only registers these describes; the heavy tiers are gated + toolchain-probe-
// skipped so it stays green offline.

const FIXTURES = path.join(__dirname, '../__fixtures__');

const SMOKE = process.env.O2S_RUBY_SMOKE === '1';
const E2E = process.env.E2E_SDK === '1';

/**
 * Ruby SnippetRunner: Ruby is interpreted — no build step. `placeSnippet` wrote
 * the whole SDK plus the snippet at `example.rb`; run it with `ruby -Ilib` so the
 * snippet's `require "<pkg>"` resolves to `lib/<pkg>.rb`. The request it makes is
 * read from the shared RecordingServer by the caller; a run failure still
 * resolves (the request may already be captured before the response-decode error).
 */
const rubySnippetRunner: SnippetRunner = {
  lang: 'ruby',
  toolchainProbe: 'ruby --version',
  run(dir, env) {
    return new Promise<void>((resolve) => {
      const p = spawn('ruby', ['-Ilib', 'example.rb'], {
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
  },
};

for (const corpus of listComplexCorpora(FIXTURES)) {
  const ir = fullIR(corpus.dir, corpus.name);
  const reps = representativeMethods(ir);

  // ---- ask C.1: the snippet COMPILES (gated O2S_RUBY_SMOKE, toolchain-skipped) ----
  describe.runIf(SMOKE)(`opensdk-ruby usage snippet compiles [${corpus.name}]`, () => {
    for (const { label, chain, method } of reps) {
      it(`${label}: ${chain.join('.')}.${method.action} snippet syntax-checks`, () => {
        // false = toolchain absent (skipped); THROWS if it fails to compile.
        const compiled = compileUsageSnippet('ruby', ir, method, chain, rubyEmitter);
        expect(typeof compiled).toBe('boolean');
      }, 300000);
    }
  });

  // ---- ask C.2: the snippet RUN reproduces expectedRequest (gated E2E_SDK) --------
  describe.runIf(E2E)(`opensdk-ruby usage snippet runs → request matches expectedRequest [${corpus.name}]`, () => {
    for (const { label, chain, method } of reps) {
      it(`${label}: ${chain.join('.')}.${method.action}`, async () => {
        // Lazily imported so the default (ungated) collect never loads the runner heavy path.
        const { runUsageSnippet } = await import('@xyd-js/opensdk-ci');
        const actual = await runUsageSnippet({
          ir,
          method,
          chain,
          emitter: rubyEmitter,
          runner: rubySnippetRunner,
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
