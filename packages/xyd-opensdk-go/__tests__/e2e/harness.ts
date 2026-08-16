import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it } from 'vitest';

import type { Method, NamedType, OpensdkSpecJson, Resource } from '@xyd-js/opensdk-core';
import {
  type ApiConfig,
  type BuiltDriver,
  type DriverAdapter,
  MockServer,
  defineSdkE2E,
  fullIR,
  hasCommand,
  recordSdkE2E,
} from '@xyd-js/opensdk-ci';

import { opensdkGo, writeProject } from '../../index';
import { type GoExampleCtx, renderDriverParams } from '../../src/example-go';
import { Imports, goFile } from '../../src/gowriter';
import { goMethodName, pascalCase } from '../../src/naming';

// The GO-SPECIFIC half of the e2e — a thin DriverAdapter over the shared,
// language-agnostic harness in @xyd-js/opensdk-ci (IR merge, expected request,
// recording server, request diff, and the whole vitest structure). An API's
// whole e2e is still two calls (see e2e/openai.test.ts):
//   recordE2E({ name, sdkName, fixturesDir })  // (gated) write per-method recorded.json
//   defineE2E({ name, sdkName, fixturesDir })  // offline binding guard + real-SDK check

export type { ApiConfig };

const EXAMPLE = 'EXAMPLE';

const callKey = (segments: string[], method: Method): string =>
  `${segments.map(pascalCase).join('.')}.${goMethodName(method.action)}`;

// ---- generated driver: call each method against the recording server -----

function generateDriver(spec: OpensdkSpecJson, pkg: string, modulePath: string): string {
  const types = new Map<string, NamedType>((spec.types || []).map((t) => [t.name, t]));
  const imports = new Imports();
  imports.add('context');
  imports.add('os');
  const pkgQ = imports.add(modulePath, pkg);
  const optionQ = imports.add(`${modulePath}/option`);
  // Reuse the SDK's own example param assembly so REQUIRED fields — including a
  // multipart file (io.Reader) — are populated. A bare `Params{}` drops the
  // nil-reader file part, so the real request would be missing its upload field.
  const ctx: GoExampleCtx = { types, modulePath, pkgQ, optionQ, imports };

  const cases: string[] = [];
  const walk = (resources: Resource[] | undefined, segments: string[]) => {
    for (const r of resources || []) {
      const seg = [...segments, r.name];
      for (const m of r.methods || []) {
        const recv = seg.map(pascalCase).join('.');
        const mname = goMethodName(m.action);
        const args = ['ctx', ...(m.pathParams || []).map(() => JSON.stringify(EXAMPLE))];
        const params = renderDriverParams(seg, m, ctx);
        if (params) args.push(params);
        cases.push(`\tcase ${JSON.stringify(`${recv}.${mname}`)}:\n\t\tclient.${recv}.${mname}(${args.join(', ')})`);
      }
      walk(r.resources, seg);
    }
  };
  walk(spec.resources, []);

  const mainFn = `func main() {
	client := ${pkgQ}.NewClient(${optionQ}.WithBaseURL(os.Getenv("E2E_BASE_URL")))
	ctx := context.Background()
	_ = ctx
	_ = client
	switch os.Args[1] {
${cases.join('\n')}
	}
}`;
  return goFile('main', imports, [mainFn]);
}

const MODULE = (pkg: string) => `github.com/example/${pkg}`;

/** Go DriverAdapter: build the whole SDK + a switch-dispatch driver, run each call. */
export const goDriverAdapter: DriverAdapter = {
  lang: 'go',
  toolchainProbe: 'go version',
  callKey,
  async build(spec: OpensdkSpecJson, sdkName: string): Promise<BuiltDriver> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-e2e-'));
    const files = opensdkGo(spec);
    files['cmd/driver/main.go'] = generateDriver(spec, sdkName, MODULE(sdkName));
    await writeProject(files, tmpDir);
    execSync('go mod tidy', { cwd: tmpDir, stdio: 'pipe' });
    execSync('go build -o driver ./cmd/driver', { cwd: tmpDir, stdio: 'pipe' });
    const binPath = path.join(tmpDir, 'driver');
    return {
      run(key, env) {
        return new Promise<void>((resolve) => {
          const p = spawn(binPath, [key], { stdio: ['ignore', 'ignore', 'ignore'], env });
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
export function recordE2E(cfg: ApiConfig) {
  recordSdkE2E(cfg, goDriverAdapter);
}

/** Register the e2e tests for an API from its committed per-method fixtures. */
export function defineE2E(cfg: ApiConfig) {
  defineSdkE2E(cfg, goDriverAdapter);
}

/**
 * (Gated E2E_SDK_TESTS=1) RUN the SDK's OWN generated test suite against a
 * spec-shaped mock — the analog of pointing openai-go's video_test.go at a Prism
 * mock of the OpenAPI spec. Generates the whole SDK (with its <resource>_test.go),
 * stands up a MockServer that answers every method with a decodable example
 * response, and runs `go test ./...` with TEST_API_BASE_URL pointed at it, so the
 * emitted tests EXECUTE and PASS (not just compile). CGO_ENABLED=0 avoids the
 * macOS cgo-test exec wedge; runs on Linux CI unconditionally.
 */
export function runGeneratedTests(cfg: ApiConfig) {
  const RUN = process.env.E2E_SDK_TESTS === '1';
  describe.runIf(RUN)(`${cfg.name} e2e: the SDK's own generated tests pass against a mock`, () => {
    it('go test ./... is green against the spec-shaped mock', async () => {
      if (!hasCommand('go version')) return;
      const spec = fullIR(cfg.fixturesDir, cfg.sdkName);
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-selftest-'));
      const mock = new MockServer(spec);
      await mock.start();
      try {
        await writeProject(opensdkGo(spec), tmpDir);
        execSync('go mod tidy', { cwd: tmpDir, stdio: 'pipe' });
        // `go test` via async spawn (NOT execSync): the mock runs in THIS Node
        // process, so a synchronous child would block the event loop and the
        // SDK's CheckTestServer http.Get would deadlock. spawn keeps the loop
        // free to serve the mock.
        await new Promise<void>((resolve, reject) => {
          const p = spawn('go', ['test', './...'], {
            cwd: tmpDir,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              TEST_API_BASE_URL: `http://127.0.0.1:${mock.port}`,
              CGO_ENABLED: '0',
              GODEBUG: 'netdns=go',
            },
          });
          let out = '';
          p.stdout?.on('data', (d) => {
            out += d;
          });
          p.stderr?.on('data', (d) => {
            out += d;
          });
          p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`go test failed:\n${out}`))));
          p.on('error', reject);
        });
      } finally {
        mock.stop();
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }, 600000);
  });
}
