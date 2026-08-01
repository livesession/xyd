import { spawn } from 'node:child_process';
import fs from 'node:fs';
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

import { dotnetEmitter } from '../index';

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
// gated O2S_DOTNET_SMOKE) and (2) RUNNABLE — when RUN against a recording server it
// produces the request `expectedRequest(ir, method)` describes (runUsageSnippet +
// diffRequest, gated E2E_SDK). The emitter's generateUsage honors
// `emitterOptions.baseUrlEnv` so the run can point the client at the server.
//
// One representative op per request shape (body-post, query-list, path-get,
// pagination) is picked generically from each corpus's IR — no hardcoded op slugs.
// The default (ungated) run only registers these describes; the heavy tiers are
// gated + toolchain-probe-skipped so it stays green offline (dotnet is not installed
// here).
//
// `tests: false` for both tiers: the SDK-style `<Sdk>.csproj` globs `**/*.cs`
// recursively, so the emitted `<Sdk>.Tests` subtree (which has its own `Program`/
// `TestRunner`) would collide with the placed `Usage.cs`'s `Program`. Dropping the
// generated test suite leaves exactly one entry point (Usage.cs) — the snippet.

const SMOKE = process.env.O2S_DOTNET_SMOKE === '1';
const E2E = process.env.E2E_SDK === '1';

/** Drop the generated self-test suite so it can't collide with the placed snippet. */
const SNIPPET_OPTS = { tests: false } as const;

/**
 * .NET SnippetRunner: `placeSnippet` wrote the whole SDK (tests off) plus the
 * snippet at root `Usage.cs`, which the SDK-style `<Sdk>.csproj` globs in. Usage.cs
 * carries the only `Main`, so we flip the SDK project to an Exe via a
 * `Directory.Build.props` (leaving the generated `.csproj` untouched) and `dotnet
 * run` it. Async spawn (NOT execSync — the RecordingServer runs in THIS Node
 * process; a synchronous child would block the loop and the snippet's HTTP call
 * would deadlock). The request it makes is read from the shared RecordingServer by
 * the caller; a run failure still resolves (the request may already be captured
 * before the response-decode error).
 */
const dotnetSnippetRunner: SnippetRunner = {
  lang: 'dotnet',
  toolchainProbe: 'dotnet --version',
  async run(dir, env) {
    // The root SDK library project (there is exactly one root-level .csproj with
    // tests off) — make it an Exe so `dotnet run` picks up Usage.cs's Main.
    const csproj = fs.readdirSync(dir).find((f) => f.endsWith('.csproj'));
    if (!csproj) throw new Error('no root .csproj in the placed snippet project');
    fs.writeFileSync(
      path.join(dir, 'Directory.Build.props'),
      '<Project>\n  <PropertyGroup>\n    <OutputType>Exe</OutputType>\n  </PropertyGroup>\n</Project>\n',
    );

    const runEnv = { ...env, DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1' };
    await new Promise<void>((resolve) => {
      const p = spawn('dotnet', ['run', '-c', 'Release', '--project', path.join(dir, csproj)], {
        cwd: dir,
        stdio: ['ignore', 'ignore', 'pipe'],
        env: runEnv,
      });
      const t = setTimeout(() => {
        p.kill('SIGKILL');
        resolve();
      }, 60000);
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

for (const corpus of listComplexCorpora(path.join(__dirname, '../__fixtures__'))) {
  const ir = fullIR(corpus.dir, corpus.name);
  const reps = representativeMethods(ir);

  // ---- ask C.1: the snippet COMPILES (gated O2S_DOTNET_SMOKE, toolchain-skipped) ----
  describe.runIf(SMOKE)(`opensdk-dotnet usage snippet compiles [${corpus.name}]`, () => {
    for (const { label, chain, method } of reps) {
      it(`${label}: ${chain.join('.')}.${method.action} snippet compiles`, () => {
        // false = toolchain absent (skipped); THROWS if it fails to compile.
        const compiled = compileUsageSnippet('dotnet', ir, method, chain, dotnetEmitter, SNIPPET_OPTS);
        expect(typeof compiled).toBe('boolean');
      }, 300000);
    }
  });

  // ---- ask C.2: the snippet RUN reproduces expectedRequest (gated E2E_SDK) --------
  describe.runIf(E2E)(`opensdk-dotnet usage snippet runs → request matches expectedRequest [${corpus.name}]`, () => {
    for (const { label, chain, method } of reps) {
      it(`${label}: ${chain.join('.')}.${method.action}`, async () => {
        // Lazily imported so the default (ungated) collect never loads the runner heavy path.
        const { runUsageSnippet } = await import('@xyd-js/opensdk-ci');
        const actual = await runUsageSnippet({
          ir,
          method,
          chain,
          emitter: dotnetEmitter,
          runner: dotnetSnippetRunner,
          sdkName: corpus.name,
          opts: SNIPPET_OPTS,
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
