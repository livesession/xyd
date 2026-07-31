import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it } from 'vitest';

import { MockServer, fullIR, hasCommand } from '@xyd-js/opensdk-ci';

import { opensdkRust, writeProject } from '../../index';

// The RUST half of the generated-SDK e2e — the analog of the opensdk-go/python/
// ruby harnesses' `runGeneratedTests`. The language-agnostic primitives (IR
// merge, spec-shaped MockServer, command probe) live in @xyd-js/opensdk-ci; this
// file only stands the Rust SDK up and runs its OWN #[tokio::test] suite against
// the mock. An API's whole Rust e2e is one call (see e2e/openai.test.ts):
//   runGeneratedTests({ name, sdkName, fixturesDir })

export interface ApiConfig {
  name: string;
  sdkName: string;
  /** Per-method fixtures dir merged into one OpenSDK IR by `fullIR`. */
  fixturesDir: string;
}

/**
 * (Gated E2E_SDK_TESTS=1) RUN the generated Rust SDK's OWN #[tokio::test] suite
 * against a spec-shaped mock — the analog of pointing openai-*'s tests at a Prism
 * mock of the OpenAPI spec. Generates the whole SDK (with its tests/<resource>.rs),
 * writes it to a temp dir, stands up a MockServer that answers every method with a
 * decodable example response, and runs `cargo test` with TEST_API_BASE_URL pointed
 * at it, so the emitted tests EXECUTE and PASS (not just compile). Gated on cargo.
 */
export function runGeneratedTests(cfg: ApiConfig) {
  const RUN = process.env.E2E_SDK_TESTS === '1';
  describe.runIf(RUN)(`${cfg.name} e2e: the SDK's own generated tests pass against a mock`, () => {
    it('cargo test is green against the spec-shaped mock', async () => {
      if (!hasCommand('cargo --version')) return;
      const spec = fullIR(cfg.fixturesDir, cfg.sdkName);
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-rs-selftest-'));
      const mock = new MockServer(spec);
      await mock.start();
      try {
        // tests default ON — the whole SDK ships its tests/<resource>.rs.
        await writeProject(opensdkRust(spec), tmpDir);
        // cargo test via async spawn (NOT execSync): the MockServer runs in THIS
        // Node process, so a synchronous child would block the event loop and the
        // SDK's HTTP calls to the mock would deadlock. spawn keeps the loop free.
        await new Promise<void>((resolve, reject) => {
          const p = spawn('cargo', ['test'], {
            cwd: tmpDir,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              TEST_API_BASE_URL: `http://127.0.0.1:${mock.port}`,
            },
          });
          let out = '';
          p.stdout?.on('data', (d) => {
            out += d;
          });
          p.stderr?.on('data', (d) => {
            out += d;
          });
          p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`cargo test failed:\n${out}`))));
          p.on('error', reject);
        });
      } finally {
        mock.stop();
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }, 600000);
  });
}
