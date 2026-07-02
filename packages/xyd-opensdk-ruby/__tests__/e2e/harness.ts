import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it } from 'vitest';

import { MockServer, fullIR, hasCommand } from '@xyd-js/opensdk-ci';

import { opensdkRuby, writeProject } from '../../index';

// The RUBY half of the generated-SDK e2e — the analog of the opensdk-go/python
// harnesses' `runGeneratedTests`. The language-agnostic primitives (IR merge,
// spec-shaped MockServer, command probe) live in @xyd-js/opensdk-ci; this file
// only stands the Ruby SDK up and runs its OWN minitest suite against the mock.
// An API's whole Ruby e2e is one call (see e2e/openai.test.ts):
//   runGeneratedTests({ name, sdkName, fixturesDir })

export interface ApiConfig {
  name: string;
  sdkName: string;
  /** Per-method fixtures dir merged into one OpenSDK IR by `fullIR`. */
  fixturesDir: string;
}

// A tiny runner dropped alongside the generated test/*.rb files: it requires
// every test_<resource>.rb, whose transitive `require "minitest/autorun"`
// installs an at_exit hook that runs the WHOLE suite in one process and sets a
// non-zero exit code on any failure. Run via `ruby -Ilib -Itest test/_run.rb`.
const RUNNER = 'Dir.glob(File.expand_path("test_*.rb", __dir__)).sort.each { |f| require f }\n';

/**
 * (Gated E2E_SDK_TESTS=1) RUN the generated Ruby SDK's OWN minitest suite
 * against a spec-shaped mock — the analog of pointing openai-ruby's
 * test/**_test.rb at a Prism mock of the OpenAPI spec. Generates the whole SDK
 * (with its test/test_<resource>.rb), writes it to a temp dir, stands up a
 * MockServer that answers every method with a decodable example response, and
 * runs the minitest suite with TEST_API_BASE_URL pointed at it, so the emitted
 * tests EXECUTE and PASS (not just `ruby -c`). Gated on a local ruby.
 */
export function runGeneratedTests(cfg: ApiConfig) {
  const RUN = process.env.E2E_SDK_TESTS === '1';
  describe.runIf(RUN)(`${cfg.name} e2e: the SDK's own generated tests pass against a mock`, () => {
    it('minitest is green against the spec-shaped mock', async () => {
      if (!hasCommand('ruby --version')) return;
      const spec = fullIR(cfg.fixturesDir, cfg.sdkName);
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-rb-selftest-'));
      const mock = new MockServer(spec);
      await mock.start();
      try {
        // tests default ON — the whole SDK ships its test/test_<resource>.rb.
        await writeProject(opensdkRuby(spec), tmpDir);
        fs.writeFileSync(path.join(tmpDir, 'test', '_run.rb'), RUNNER);
        // minitest via async spawn (NOT execSync): the MockServer runs in THIS
        // Node process, so a synchronous child would block the event loop and
        // the SDK's HTTP calls to the mock would deadlock. spawn keeps the loop
        // free to serve the mock.
        await new Promise<void>((resolve, reject) => {
          const p = spawn('ruby', ['-Ilib', '-Itest', 'test/_run.rb'], {
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
          p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`minitest failed:\n${out}`))));
          p.on('error', reject);
        });
      } finally {
        mock.stop();
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }, 600000);
  });
}
