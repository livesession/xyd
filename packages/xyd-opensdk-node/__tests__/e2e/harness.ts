import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Method, NamedType, OpensdkSpecJson, Resource } from '@xyd-js/opensdk-core';
import { planOperation } from '@xyd-js/opensdk-framework';
import {
  type ApiConfig as CiApiConfig,
  type BuiltDriver,
  type DriverAdapter,
  MockServer,
  defineSdkE2E,
  fullIR,
  recordSdkE2E,
} from '@xyd-js/opensdk-ci';

import { opensdkNode, writeProject } from '../../index';
import { camelCase, nodeMethodName } from '../../src/naming';

// The NODE-specific half of the e2e. Two flavors share this file:
//
//  1. A thin `DriverAdapter` over the shared, language-agnostic harness in
//     @xyd-js/opensdk-ci (IR merge, expected request, recording server, request
//     diff, vitest structure). callKey NAMES a call in Node's client-access shape
//     (camelCase resource chain + camelCase method), and build() generates the
//     whole SDK + a switch-dispatch driver, compiles it, and returns a runner.
//     Register via recordE2E + defineE2E (see e2e/openai.test.ts).
//
//  2. runGeneratedTests: RUN the SDK's OWN generated `node:test` suite against a
//     spec-shaped MockServer (kept for the mock-based self-test tier).

export interface ApiConfig {
  name: string;
  sdkName: string;
  /** Per-method fixtures dir: <slug>/input.json (OpenSDK IR). */
  fixturesDir: string;
}

const EXAMPLE = 'EXAMPLE';

// ---- call key: Node's client-access chain (camelCase resource segs + method) ----

const callKey = (segments: string[], method: Method): string =>
  `${segments.map(camelCase).join('.')}.${nodeMethodName(method.action)}`;

// ---- generated driver: call each method against the recording server ----------

/**
 * A `src/driver.ts` that constructs the client (base URL from `E2E_BASE_URL`) and
 * switch-dispatches `process.argv[2]` (the call key) to the matching generated
 * client method. Positional path args are example strings; the single
 * params/body/query arg is a synthesized object carrying every REQUIRED body
 * field + required query/header param (each set to a placeholder `1`), cast
 * `as never` so it type-checks against the strict params interface. The
 * placeholders make the ACTUAL request carry the same field/query KEYS the
 * `expectedRequest` fixture records (the recording server diffs by key, not
 * value), so the real run reproduces the offline binding guard's request shape.
 * No apiKey is passed — the client falls back to its env credential (the harness
 * sets it), so the auth header is present. Errors are swallowed: the request is
 * already captured by the recording server before any response-decode failure.
 */
function generateDriver(spec: OpensdkSpecJson, types: Map<string, NamedType>): string {
  // The synthesized params object literal for a method: required body fields (by
  // wire name, the params-interface key) + required query/header params (by their
  // LOGICAL name, which the emitter remaps to the wire name at request time).
  const paramsArg = (m: Method): string | null => {
    const op = planOperation(m, types);
    if (!(op.hasBody || op.paramGroups.query.length > 0 || op.paramGroups.header.length > 0)) return null;
    const keys = new Set<string>();
    const bodyRef = m.requestBody?.type;
    if (bodyRef?.kind === 'ref' && bodyRef.name) {
      for (const f of types.get(bodyRef.name)?.fields || []) if (f.required) keys.add(f.name);
    }
    for (const p of [...op.paramGroups.query, ...op.paramGroups.header]) if (p.required) keys.add(p.name);
    const entries = [...keys].map((k) => `${JSON.stringify(k)}: 1`);
    return `{ ${entries.join(', ')} } as never`;
  };
  const cases: string[] = [];
  const walk = (resources: Resource[] | undefined, segments: string[]) => {
    for (const r of resources || []) {
      const seg = [...segments, r.name];
      const chain = seg.map(camelCase).join('.');
      for (const m of r.methods || []) {
        const mname = nodeMethodName(m.action);
        const args = (m.pathParams || []).map(() => JSON.stringify(EXAMPLE));
        const params = paramsArg(m);
        if (params) args.push(params);
        cases.push(
          `    case ${JSON.stringify(`${chain}.${mname}`)}:\n` +
            `      await client.${chain}.${mname}(${args.join(', ')});\n` +
            `      break;`,
        );
      }
      walk(r.resources, seg);
    }
  };
  walk(spec.resources, []);
  // The generated tsconfig has no @types/node (DOM lib only) — declare `process`
  // ambiently so the driver's argv/env access type-checks.
  return `import Client from './index';

declare const process: { argv: string[]; env: Record<string, string | undefined> };

async function main(): Promise<void> {
  const client = new Client({ baseURL: process.env.E2E_BASE_URL });
  const key = process.argv[2];
  switch (key) {
${cases.join('\n')}
  }
}

main().catch(() => {});
`;
}

/**
 * The Node DriverAdapter: generate the whole SDK + a driver entry, compile
 * `src/` (incl. the driver) to CommonJS with `tsc` (the generated tsconfig targets
 * ESNext/bundler with extensionless imports Node's loader can't resolve), and
 * return a BuiltDriver whose run() spawns the compiled driver for one call key.
 */
export const nodeDriverAdapter: DriverAdapter = {
  lang: 'node',
  toolchainProbe: 'node --version',
  callKey,
  async build(spec: OpensdkSpecJson, _sdkName: string): Promise<BuiltDriver> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-node-e2e-'));
    const types = new Map<string, NamedType>((spec.types || []).map((t) => [t.name, t]));
    // No generated tests needed for the driver build (faster + fewer files to compile).
    const files = opensdkNode(spec, { tests: false });
    files['src/driver.ts'] = generateDriver(spec, types);
    await writeProject(files, tmpDir);

    // Compile src (incl. driver.ts) to CommonJS so `node` resolves the SDK's
    // extensionless relative imports. Mark the output subtree as commonjs (the
    // SDK's own package.json is `type: module`).
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
      include: ['src'],
    };
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.e2e.json'), `${JSON.stringify(runConfig, null, 2)}\n`);
    const require = createRequire(__filename);
    const tsc = require.resolve('typescript/bin/tsc');
    execSync(`node ${JSON.stringify(tsc)} -p tsconfig.e2e.json`, { cwd: tmpDir, stdio: 'pipe' });

    const outDir = path.join(tmpDir, 'out');
    fs.writeFileSync(path.join(outDir, 'package.json'), '{"type":"commonjs"}\n');
    const driverJs = path.join(outDir, 'driver.js');

    return {
      run(key, env) {
        return new Promise<void>((resolve) => {
          // Async spawn (NOT execSync): the RecordingServer runs in THIS Node
          // process, so a synchronous child would block the loop and the driver's
          // fetch would deadlock. spawn keeps the loop free to serve the request.
          const p = spawn('node', [driverJs, key], { stdio: ['ignore', 'ignore', 'ignore'], env });
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
      dispose() {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      },
    };
  },
};

/** (Gated E2E_RECORD=1) Write per-method recorded.json (call key + assumed-correct request). */
export function recordE2E(cfg: CiApiConfig): void {
  recordSdkE2E(cfg, nodeDriverAdapter);
}

/** Offline binding guard (always) + real-SDK request diff (gated E2E_SDK=1). */
export function defineE2E(cfg: CiApiConfig): void {
  defineSdkE2E(cfg, nodeDriverAdapter);
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
