import { spawn } from 'node:child_process';
import fs from 'node:fs';
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
  hasCommand,
  recordSdkE2E,
} from '@xyd-js/opensdk-ci';

import { opensdkPython, writeProject } from '../../index';
import { resolvePythonOptions } from '../../src/project';
import { snakeCase } from '../../src/naming';

// The PYTHON-specific half of the e2e. Two flavors share this file:
//
//  1. A thin `DriverAdapter` over the shared, language-agnostic harness in
//     @xyd-js/opensdk-ci (IR merge, expected request, recording server, request
//     diff, vitest structure). callKey NAMES a call in Python's client-access
//     shape (snake_case resource chain + snake_case method), and build()
//     generates the whole SDK + a switch-dispatch `_driver.py`, and returns a
//     runner (Python is interpreted → no compile step). Register via
//     recordE2E + defineE2E (see e2e/openai.test.ts).
//
//  2. runGeneratedTests: RUN the SDK's OWN generated pytest suite against a
//     spec-shaped MockServer (kept for the mock-based self-test tier).

export interface ApiConfig {
  name: string;
  sdkName: string;
  /** Per-method fixtures dir: <slug>/input.json (OpenSDK IR). */
  fixturesDir: string;
}

const EXAMPLE = 'EXAMPLE';

// ---- call key: Python's client-access chain (snake_case segs + snake method) ----

const callKey = (segments: string[], method: Method): string =>
  `${segments.map(snakeCase).join('.')}.${snakeCase(method.action)}`;

// ---- generated driver: call each method against the recording server ----------

/**
 * A root `_driver.py` that constructs the client (base URL from `E2E_BASE_URL`)
 * and switch-dispatches `sys.argv[1]` (the call key) to the matching generated
 * client method. Positional path args are example strings; required body fields
 * and required query/header params are passed as keyword args (by their Python
 * snake_case name — the emitter remaps each to its wire name when building the
 * request) each set to a placeholder `1`. The placeholders make the ACTUAL
 * request carry the same body-field/query KEYS the `expectedRequest` fixture
 * records (the recording server diffs by key, not value), so the real run
 * reproduces the offline binding guard's request shape. No api_key is passed —
 * the client falls back to its env credential (the harness sets it), so the auth
 * header is present. Errors are swallowed: the request is already captured by the
 * recording server before any response-decode failure.
 */
function generateDriver(spec: OpensdkSpecJson, pkg: string, types: Map<string, NamedType>): string {
  // Required body fields + required query/header params, each as `snake_name=1`.
  // Body fields carry the WIRE name in the emitted body dict, so the Python
  // kwarg (snake) is what the caller sets; query/header params likewise.
  const kwargs = (m: Method): string[] => {
    const op = planOperation(m, types);
    const names: string[] = [];
    const bodyRef = m.requestBody?.type;
    if (bodyRef?.kind === 'ref' && bodyRef.name) {
      for (const f of types.get(bodyRef.name)?.fields || []) if (f.required) names.push(f.name);
    }
    for (const p of [...op.paramGroups.query, ...op.paramGroups.header]) if (p.required) names.push(p.name);
    return names.map((n) => `${snakeCase(n)}=1`);
  };

  const cases: string[] = [];
  const walk = (resources: Resource[] | undefined, segments: string[]) => {
    for (const r of resources || []) {
      const seg = [...segments, r.name];
      const chain = seg.map(snakeCase).join('.');
      for (const m of r.methods || []) {
        const mname = snakeCase(m.action);
        const args = (m.pathParams || []).map(() => JSON.stringify(EXAMPLE));
        args.push(...kwargs(m));
        cases.push(
          `    if key == ${JSON.stringify(`${chain}.${mname}`)}:\n` +
            `        client.${chain}.${mname}(${args.join(', ')})\n` +
            `        return`,
        );
      }
      walk(r.resources, seg);
    }
  };
  walk(spec.resources, []);

  // A flat if-return dispatch (Python has no switch); a bare `except` swallows
  // the response-decode error that follows the (already-captured) request.
  return `import os
import sys

from ${pkg} import Client


def main() -> None:
    client = Client(base_url=os.environ.get("E2E_BASE_URL"))
    key = sys.argv[1]
${cases.join('\n')}


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
`;
}

/**
 * The Python DriverAdapter: generate the whole SDK + a root `_driver.py`, write
 * it to a temp dir (Python is interpreted — no build step), and return a
 * BuiltDriver whose run() spawns the driver for one call key. `PYTHONPATH` points
 * at the project root so `from <pkg> import Client` resolves.
 */
export const pythonDriverAdapter: DriverAdapter = {
  lang: 'python',
  toolchainProbe: 'python3 --version',
  callKey,
  async build(spec: OpensdkSpecJson, _sdkName: string): Promise<BuiltDriver> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-py-e2e-'));
    const types = new Map<string, NamedType>((spec.types || []).map((t) => [t.name, t]));
    const { pkg } = resolvePythonOptions(spec, {});
    // No generated pytest suite needed for the driver run (fewer files to write).
    const files = opensdkPython(spec, { tests: false });
    files['_driver.py'] = generateDriver(spec, pkg, types);
    await writeProject(files, tmpDir);

    return {
      run(key, env) {
        return new Promise<void>((resolve) => {
          // Async spawn (NOT execSync): the RecordingServer runs in THIS Node
          // process, so a synchronous child would block the loop and the driver's
          // urlopen would deadlock. spawn keeps the loop free to serve the request.
          const p = spawn('python3', ['_driver.py', key], {
            cwd: tmpDir,
            stdio: ['ignore', 'ignore', 'ignore'],
            env: { ...env, PYTHONPATH: tmpDir },
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
      dispose() {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      },
    };
  },
};

/** (Gated E2E_RECORD=1) Write per-method recorded.json (call key + assumed-correct request). */
export function recordE2E(cfg: CiApiConfig): void {
  recordSdkE2E(cfg, pythonDriverAdapter);
}

/** Offline binding guard (always) + real-SDK request diff (gated E2E_SDK=1). */
export function defineE2E(cfg: CiApiConfig): void {
  defineSdkE2E(cfg, pythonDriverAdapter);
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
        const { execSync } = await import('node:child_process');
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
