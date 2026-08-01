import { execSync, spawn } from 'node:child_process';
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

import { goEmitter } from '../index';

/**
 * A usage snippet is a "with all optionals + realistic values" doc example, while
 * `expectedRequest` is the minimal REQUIRED-ONLY request. They agree on
 * method/path/auth and on the required body fields (diffRequest checks the fixture's
 * body fields as a SUBSET). The one legitimate divergence is OPTIONAL query params,
 * which diffRequest compares by exact equality — so treat the snippet's query as
 * correct when it is a superset of the fixture's required query keys.
 */
function diffSnippetRequest(actual: RecordedRequest, fixture: RecordedRequest): string[] {
  const queryOk = fixture.query.every((q) => actual.query.includes(q));
  return diffRequest(actual, fixture).filter((e) => !(queryOk && e.startsWith('query ')));
}

// Ask C for Go: the per-operation USAGE snippet is (1) COMPILEABLE (compileUsageSnippet,
// gated O2S_GO_SMOKE — the snippet drops in as example/main.go and `go build`s) and
// (2) RUNNABLE — when RUN against a recording server it produces the request
// `expectedRequest(ir, method)` describes (runUsageSnippet + diffRequest, gated E2E_SDK).
// generateGoUsage honors emitterOptions.baseUrlEnv so the run points the client at
// the server. One representative op per request shape, discovered per corpus.
//
// NOTE: generated Go binaries may fail to EXECUTE on macOS (`dyld: missing LC_UUID`;
// `go build` still passes) — the run tier then captures no request and skips per op,
// exactly like the go e2e real-run. It runs for real on Linux CI.

const SMOKE = process.env.O2S_GO_SMOKE === '1';
const E2E = process.env.E2E_SDK === '1';

/**
 * Go SnippetRunner: build the whole SDK + the placed example/main.go, then run the
 * example binary against the recording server. `go build` is synchronous (it never
 * contacts the in-process server, so it can't deadlock it); the binary is spawned
 * async so the event loop stays free to serve the request it makes.
 */
const goSnippetRunner: SnippetRunner = {
  lang: 'go',
  toolchainProbe: 'go version',
  async run(dir, env) {
    try {
      execSync('go mod tidy', { cwd: dir, stdio: 'pipe', env: { ...process.env, CGO_ENABLED: '0', GOFLAGS: '-mod=mod' } });
      execSync('go build -o example_bin ./example', { cwd: dir, stdio: 'pipe', env: { ...process.env, CGO_ENABLED: '0' } });
    } catch {
      return; // build failed → no request captured → the run tier skips this op
    }
    await new Promise<void>((resolve) => {
      const p = spawn(path.join(dir, 'example_bin'), [], { cwd: dir, stdio: ['ignore', 'ignore', 'ignore'], env });
      const t = setTimeout(() => {
        p.kill('SIGKILL');
        resolve();
      }, 8000);
      p.on('exit', () => {
        clearTimeout(t);
        resolve();
      });
      // Binary that can't exec (macOS dyld) — no request; still resolve so the op skips.
      p.on('error', () => {
        clearTimeout(t);
        resolve();
      });
    });
  },
};

for (const corpus of listComplexCorpora(path.join(__dirname, '../__fixtures__'))) {
  const ir = fullIR(corpus.dir, corpus.name);
  const reps = representativeMethods(ir);

  // ---- ask C.1: the snippet COMPILES (gated O2S_GO_SMOKE, toolchain-skipped) ----
  describe.runIf(SMOKE)(`opensdk-go usage snippet compiles [${corpus.name}]`, () => {
    for (const { label, chain, method } of reps) {
      it(`${label}: ${chain.join('.')}.${method.action} snippet builds`, () => {
        // false = toolchain absent (skipped); THROWS if it fails to build.
        const compiled = compileUsageSnippet('go', ir, method, chain, goEmitter);
        expect(typeof compiled).toBe('boolean');
      }, 300000);
    }
  });

  // ---- ask C.2: the snippet RUN reproduces expectedRequest (gated E2E_SDK) --------
  describe.runIf(E2E)(`opensdk-go usage snippet runs → request matches expectedRequest [${corpus.name}]`, () => {
    for (const { label, chain, method } of reps) {
      it(`${label}: ${chain.join('.')}.${method.action}`, async () => {
        const { runUsageSnippet } = await import('@xyd-js/opensdk-ci');
        const actual = await runUsageSnippet({
          ir,
          method,
          chain,
          emitter: goEmitter,
          runner: goSnippetRunner,
          sdkName: corpus.name,
        });
        // null = toolchain absent / binary didn't exec (macOS) / no request → skip.
        if (actual === null) return;
        expect(diffSnippetRequest(actual, expectedRequest(ir, method))).toEqual([]);
      }, 300000);
    }
  });
}
