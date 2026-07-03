import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it } from 'vitest';

import { MockServer, fullIR, hasCommand } from '@xyd-js/opensdk-ci';
import { writeProject } from '@xyd-js/opensdk-framework';

import { opensdkPython } from '../../index';

// The PYTHON half of the generated-SDK e2e — the analog of the opensdk-go
// harness's `runGeneratedTests`. The language-agnostic primitives (IR merge,
// spec-shaped MockServer, command probe) live in @xyd-js/opensdk-ci; this file
// only stands the Python SDK up in a venv and runs its OWN pytest suite. An
// API's whole Python e2e is one call (see e2e/openai.test.ts):
//   runGeneratedTests({ name, sdkName, fixturesDir })

export interface ApiConfig {
  name: string;
  sdkName: string;
  /** Per-method fixtures dir merged into one OpenSDK IR by `fullIR`. */
  fixturesDir: string;
}

/**
 * (Gated E2E_SDK_TESTS=1) RUN the generated Python SDK's OWN pytest suite
 * against a spec-shaped mock — the analog of pointing openai-python's
 * test_*.py at a Prism mock of the OpenAPI spec. Generates the whole SDK (with
 * its tests/test_<resource>.py), creates a venv, pip-installs pytest, stands up
 * a MockServer that answers every method with a decodable example response, and
 * runs `pytest tests` with TEST_API_BASE_URL pointed at it, so the emitted
 * tests EXECUTE and PASS (not just py_compile). Gated on python3 availability.
 */
export function runGeneratedTests(cfg: ApiConfig) {
  const RUN = process.env.E2E_SDK_TESTS === '1';
  describe.runIf(RUN)(`${cfg.name} e2e: the SDK's own generated tests pass against a mock`, () => {
    it('pytest tests is green against the spec-shaped mock', async () => {
      if (!hasCommand('python3 --version')) return;
      const spec = fullIR(cfg.fixturesDir, cfg.sdkName);
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-py-selftest-'));
      const mock = new MockServer(spec);
      await mock.start();
      try {
        await writeProject(opensdkPython(spec), tmpDir);
        execSync('python3 -m venv .venv', { cwd: tmpDir, stdio: 'pipe' });
        execSync('.venv/bin/pip install -q pytest', { cwd: tmpDir, stdio: 'pipe' });
        // pytest via async spawn (NOT execSync): the MockServer runs in THIS
        // Node process, so a synchronous child would block the event loop and
        // the generated conftest's HTTP calls would deadlock. spawn keeps the
        // loop free to serve the mock.
        await new Promise<void>((resolve, reject) => {
          const p = spawn('.venv/bin/python', ['-m', 'pytest', 'tests', '-q', '--no-header'], {
            cwd: tmpDir,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              PYTHONPATH: tmpDir,
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
          p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`pytest failed:\n${out}`))));
          p.on('error', reject);
        });
      } finally {
        mock.stop();
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }, 600000);
  });
}
