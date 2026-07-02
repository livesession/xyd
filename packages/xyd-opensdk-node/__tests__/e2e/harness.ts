import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { MockServer, fullIR } from '@xyd-js/opensdk-ci';

import { opensdkNode, writeProject } from '../../index';

// The NODE-specific half of the e2e. The language-agnostic primitive — merging
// the committed per-method IRs into one full SDK IR and standing up a spec-shaped
// mock — lives in @xyd-js/opensdk-ci. An API's whole e2e is one call (see
// e2e/openai.test.ts): runGeneratedTests({ name, sdkName, fixturesDir }).

export interface ApiConfig {
  name: string;
  sdkName: string;
  /** Per-method fixtures dir: <slug>/input.json (OpenSDK IR). */
  fixturesDir: string;
}

/**
 * (Gated E2E_SDK_TESTS=1) RUN the SDK's OWN generated test suite against a
 * spec-shaped mock — the analog of pointing openai-node's *.test.ts at a Prism
 * mock of the OpenAPI spec. Generates the whole SDK (with its tests/*.test.ts),
 * compiles it (src + tests) to runnable CommonJS, stands up a MockServer that
 * answers every method with a decodable example response, and runs `node --test`
 * with TEST_API_BASE_URL pointed at it, so the emitted tests EXECUTE and PASS
 * (not just compile).
 */
export function runGeneratedTests(cfg: ApiConfig) {
  const RUN = process.env.E2E_SDK_TESTS === '1';
  describe.runIf(RUN)(`${cfg.name} e2e: the SDK's own generated tests pass against a mock`, () => {
    it('node --test is green against the spec-shaped mock', async () => {
      const spec = fullIR(cfg.fixturesDir, cfg.sdkName);
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-node-selftest-'));
      const mock = new MockServer(spec);
      await mock.start();
      try {
        // Whole SDK WITH its generated tests (tests default ON).
        await writeProject(opensdkNode(spec), tmpDir);

        // Compile src + the generated tests to CommonJS so `node --test` resolves
        // the SDK's extensionless relative imports (the generated tsconfig targets
        // ESNext/bundler, which Node's loader can't resolve without extensions).
        const runConfig = {
          extends: './tsconfig.json',
          compilerOptions: {
            noEmit: false,
            declaration: false,
            module: 'commonjs',
            moduleResolution: 'node',
            outDir: './out',
            types: [],
          },
          include: ['src', 'tests'],
        };
        fs.writeFileSync(path.join(tmpDir, 'tsconfig.e2e.json'), `${JSON.stringify(runConfig, null, 2)}\n`);
        const require = createRequire(__filename);
        const tsc = require.resolve('typescript/bin/tsc');
        // Compile is a plain child (no mock traffic yet), so execSync is safe here.
        execSync(`node ${JSON.stringify(tsc)} -p tsconfig.e2e.json`, { cwd: tmpDir, stdio: 'pipe' });

        // The emitted JS is CommonJS; the SDK's own package.json is `type: module`,
        // so mark the build-output subtree as commonjs for the Node loader.
        const outDir = path.join(tmpDir, 'out');
        fs.writeFileSync(path.join(outDir, 'package.json'), '{"type":"commonjs"}\n');

        const testFiles = fs
          .readdirSync(path.join(outDir, 'tests'))
          .filter((f) => f.endsWith('.test.js'))
          .map((f) => path.join('tests', f))
          .sort();
        expect(testFiles.length).toBeGreaterThan(0);

        // `node --test` via async spawn (NOT execSync): the mock runs in THIS Node
        // process, so a synchronous child would block the event loop and the SDK's
        // fetch to the mock would deadlock. spawn keeps the loop free to serve it.
        await new Promise<void>((resolve, reject) => {
          const p = spawn('node', ['--test', ...testFiles], {
            cwd: outDir,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, TEST_API_BASE_URL: `http://127.0.0.1:${mock.port}` },
          });
          let out = '';
          p.stdout?.on('data', (d) => {
            out += d;
          });
          p.stderr?.on('data', (d) => {
            out += d;
          });
          p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`node --test failed:\n${out}`))));
          p.on('error', reject);
        });
      } finally {
        mock.stop();
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }, 600000);
  });
}
