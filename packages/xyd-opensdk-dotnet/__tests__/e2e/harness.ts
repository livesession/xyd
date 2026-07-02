import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { MockServer, fullIR, hasCommand } from '@xyd-js/opensdk-ci';

import { opensdkDotnet, writeProject } from '../../index';

// The DOTNET-SPECIFIC half of the mock-run e2e (the language-agnostic primitives
// — IR merge + the spec-shaped MockServer — live in @xyd-js/opensdk-ci). An API's
// whole mock-run is one call (see e2e/openai.test.ts):
//   runGeneratedTests({ name, sdkName, fixturesDir })  // (gated) run the SDK's own tests vs a mock

export interface ApiConfig {
  name: string;
  sdkName: string;
  /** Per-method fixtures dir: <slug>/input.json (OpenSDK IR). */
  fixturesDir: string;
}

/**
 * (Gated E2E_SDK_TESTS=1) RUN the SDK's OWN generated test suite against a
 * spec-shaped mock — the .NET analog of pointing openai-dotnet's tests at a Prism
 * mock of the OpenAPI spec. Generates the whole SDK (with its <Resource>Tests.cs +
 * vendored [Fact] runner), stands up a MockServer that answers every method with a
 * decodable example response, and runs the generated test EXE (`dotnet run`) with
 * TEST_API_BASE_URL pointed at it, so the emitted tests EXECUTE and PASS (not just
 * compile). The runner's Program.Main returns 0 when every [Fact] passes.
 *
 * dotnet is not installed in THIS environment, so the whole run is gated on a .NET
 * SDK on PATH and skips cleanly locally; it runs unconditionally in CI.
 */
export function runGeneratedTests(cfg: ApiConfig) {
  const RUN = process.env.E2E_SDK_TESTS === '1';
  describe.runIf(RUN)(`${cfg.name} e2e: the SDK's own generated tests pass against a mock`, () => {
    it('dotnet run over the generated tests is green against the spec-shaped mock', async () => {
      if (!hasCommand('dotnet --version')) return; // dotnet not installed → skip cleanly (runs in CI)
      const spec = fullIR(cfg.fixturesDir, cfg.sdkName);
      const files = opensdkDotnet(spec);
      // The generated test project (an Exe) — <Sdk>.Tests/<Sdk>.Tests.csproj.
      const testProject = Object.keys(files).find((p) => p.endsWith('.Tests.csproj'));
      expect(testProject, 'no generated test project (.Tests.csproj)').toBeTruthy();

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-selftest-dotnet-'));
      const mock = new MockServer(spec);
      await mock.start();
      try {
        await writeProject(files, tmpDir);
        // Run the test EXE via ASYNC spawn (NOT execSync): the mock runs in THIS
        // Node process, so a synchronous child would block the event loop and the
        // SDK's TestServer.Check http.Get would deadlock. `dotnet run` builds then
        // runs in the child; only the run hits the mock, and spawn keeps the loop
        // free to serve it. Program.Main exits 0 iff every [Fact] passed.
        await new Promise<void>((resolve, reject) => {
          const p = spawn('dotnet', ['run', '--project', testProject as string, '-c', 'Release'], {
            cwd: tmpDir,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              TEST_API_BASE_URL: `http://127.0.0.1:${mock.port}`,
              DOTNET_CLI_TELEMETRY_OPTOUT: '1',
              DOTNET_NOLOGO: '1',
            },
          });
          let out = '';
          p.stdout?.on('data', (d) => {
            out += d;
          });
          p.stderr?.on('data', (d) => {
            out += d;
          });
          p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`dotnet run failed (exit ${code}):\n${out}`))));
          p.on('error', reject);
        });
      } finally {
        mock.stop();
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }, 600000);
  });
}
