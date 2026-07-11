import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it } from 'vitest';

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

import { opensdkRuby, writeProject } from '../../index';
import { pascalCase, rubyGemName, snakeCase } from '../../src/naming';

// The RUBY-specific half of the e2e. Two flavors share this file:
//
//  1. A thin `DriverAdapter` over the shared, language-agnostic harness in
//     @xyd-js/opensdk-ci (IR merge, expected request, recording server, request
//     diff, vitest structure). callKey NAMES a call in Ruby's client-access
//     shape (snake_case resource chain + snake_case method), and build()
//     generates the whole SDK + a switch-dispatch `_driver.rb`, and returns a
//     runner (Ruby is interpreted → no compile step). Register via
//     recordE2E + defineE2E (see e2e/openai.test.ts).
//
//  2. runGeneratedTests: RUN the SDK's OWN generated minitest suite against a
//     spec-shaped MockServer (kept for the mock-based self-test tier).

export interface ApiConfig {
  name: string;
  sdkName: string;
  /** Per-method fixtures dir: <slug>/input.json (OpenSDK IR). */
  fixturesDir: string;
}

const EXAMPLE = 'EXAMPLE';

// ---- call key: Ruby's client-access chain (snake_case segs + snake method) ----
// Mirrors the generated `client.<attr>.<attr>.<action>` accessor chain
// (attr_reader names are snake_case; the action is the native method name).

const callKey = (segments: string[], method: Method): string =>
  `${segments.map(snakeCase).join('.')}.${snakeCase(method.action)}`;

/** The gem name (lib/<pkg>.rb → `require "<pkg>"`), matching the emitter default. */
function pkgName(spec: OpensdkSpecJson): string {
  return rubyGemName(spec.info.title);
}

// ---- generated driver: call each method against the recording server ----------

/**
 * A root `_driver.rb` that requires the gem, constructs the client (base URL from
 * `E2E_BASE_URL`) and switch-dispatches `ARGV[0]` (the call key) to the matching
 * generated client method. Positional path args are example strings; required
 * body fields and required query/header params are passed as keyword args (by
 * their Ruby snake_case name — the emitter remaps each to its wire name when
 * building the request) each set to a placeholder `1`. The placeholders make the
 * ACTUAL request carry the same body-field/query KEYS the `expectedRequest`
 * fixture records (the recording server diffs by key, not value), so the real run
 * reproduces the offline binding guard's request shape. No api_key is passed —
 * the client falls back to its env credential (the harness sets it), so the auth
 * header is present. Errors are swallowed: the request is already captured by the
 * recording server before any response-decode failure.
 */
function generateDriver(spec: OpensdkSpecJson, moduleName: string, types: Map<string, NamedType>): string {
  // Required body fields + required query/header params, each as `snake_name: 1`.
  // Body fields carry the WIRE name in the emitted body hash, so the Ruby kwarg
  // (snake) is what the caller sets; query/header params likewise.
  const kwargs = (m: Method): string[] => {
    const op = planOperation(m, types);
    const names: string[] = [];
    const bodyRef = m.requestBody?.type;
    if (bodyRef?.kind === 'ref' && bodyRef.name) {
      for (const f of types.get(bodyRef.name)?.fields || []) if (f.required) names.push(f.name);
    }
    for (const p of [...op.paramGroups.query, ...op.paramGroups.header]) if (p.required) names.push(p.name);
    return names.map((n) => `${snakeCase(n)}: 1`);
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
        const call = args.length ? `client.${chain}.${mname}(${args.join(', ')})` : `client.${chain}.${mname}`;
        cases.push(`  when ${JSON.stringify(`${chain}.${mname}`)}\n    ${call}`);
      }
      walk(r.resources, seg);
    }
  };
  walk(spec.resources, []);

  // A `case ... when` dispatch; a bare `rescue` swallows the response-decode
  // error that follows the (already-captured) request.
  return `require ${JSON.stringify(pkgName(spec))}

client = ${moduleName}::Client.new(base_url: ENV["E2E_BASE_URL"])
key = ARGV[0]

begin
  case key
${cases.join('\n')}
  end
rescue StandardError
end
`;
}

/**
 * The Ruby DriverAdapter: generate the whole SDK + a root `_driver.rb`, write it
 * to a temp dir (Ruby is interpreted — no build step), and return a BuiltDriver
 * whose run() spawns the driver for one call key. `-Ilib` puts the gem's lib dir
 * on the load path so `require "<pkg>"` resolves.
 */
export const rubyDriverAdapter: DriverAdapter = {
  lang: 'ruby',
  toolchainProbe: 'ruby --version',
  callKey,
  async build(spec: OpensdkSpecJson): Promise<BuiltDriver> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-rb-e2e-'));
    const types = new Map<string, NamedType>((spec.types || []).map((t) => [t.name, t]));
    // The module name mirrors the emitter default (PascalCase of info.title).
    const moduleName = pascalCase(spec.info.title);
    // No generated minitest suite needed for the driver run (fewer files to write).
    const files = opensdkRuby(spec, { tests: false });
    files['_driver.rb'] = generateDriver(spec, moduleName, types);
    await writeProject(files, tmpDir);

    return {
      run(key, env) {
        return new Promise<void>((resolve) => {
          // Async spawn (NOT execSync): the RecordingServer runs in THIS Node
          // process, so a synchronous child would block the loop and the driver's
          // Net::HTTP call would deadlock. spawn keeps the loop free to serve it.
          const p = spawn('ruby', ['-Ilib', '_driver.rb', key], {
            cwd: tmpDir,
            stdio: ['ignore', 'ignore', 'ignore'],
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
      dispose() {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      },
    };
  },
};

/** (Gated E2E_RECORD=1) Write per-method recorded.json (call key + assumed-correct request). */
export function recordE2E(cfg: CiApiConfig): void {
  recordSdkE2E(cfg, rubyDriverAdapter);
}

/** Offline binding guard (always) + real-SDK request diff (gated E2E_SDK=1). */
export function defineE2E(cfg: CiApiConfig): void {
  defineSdkE2E(cfg, rubyDriverAdapter);
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
