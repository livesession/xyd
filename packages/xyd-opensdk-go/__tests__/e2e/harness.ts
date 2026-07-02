import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Method, OpensdkSpecJson, Resource } from '@xyd-js/opensdk-core';
import {
  type RecordedFixture,
  type RecordedRequest,
  RecordingServer,
  diffRequest,
  expectedRequest,
  fullIR,
  hasCommand,
  loadPerMethod,
  normalizeRecorded,
} from '@xyd-js/opensdk-ci';

import { opensdkGo, writeProject } from '../../index';
import { goMethodName, pascalCase } from '../../src/naming';
import { resourceQualifier } from '../../src/service';

// The GO-SPECIFIC half of the e2e (the language-agnostic primitives — IR merge,
// expected request, recording server, request diff — live in @xyd-js/opensdk-ci).
// An API's whole e2e is two calls (see e2e/openai.test.ts):
//   recordE2E({ name, sdkName, fixturesDir })  // (gated) write per-method recorded.json
//   defineE2E({ name, sdkName, fixturesDir })  // offline binding guard + real-SDK check

export interface ApiConfig {
  name: string;
  sdkName: string;
  /** Per-method fixtures dir: <slug>/input.json (OpenSDK IR) [+ output.go, recorded.json]. */
  fixturesDir: string;
}

const EXAMPLE = 'EXAMPLE';

const callKey = (segments: string[], method: Method): string =>
  `${segments.map(pascalCase).join('.')}.${goMethodName(method.action)}`;

// ---- generated driver: call each method against the recording server -----

function generateDriver(spec: OpensdkSpecJson, pkg: string, modulePath: string): string {
  const cases: string[] = [];
  const walk = (resources: Resource[] | undefined, segments: string[]) => {
    for (const r of resources || []) {
      const seg = [...segments, r.name];
      for (const m of r.methods || []) {
        const recv = seg.map(pascalCase).join('.');
        const mname = goMethodName(m.action);
        const args = ['ctx', ...(m.pathParams || []).map(() => JSON.stringify(EXAMPLE))];
        if (m.requestBody || (m.queryParams || []).length > 0) {
          args.push(`${pkg}.${resourceQualifier(seg)}${mname}Params{}`);
        }
        cases.push(`\tcase ${JSON.stringify(`${recv}.${mname}`)}:\n\t\tclient.${recv}.${mname}(${args.join(', ')})`);
      }
      walk(r.resources, seg);
    }
  };
  walk(spec.resources, []);
  return `package main

import (
	"context"
	"os"

	${pkg} ${JSON.stringify(modulePath)}
	"${modulePath}/option"
)

func main() {
	client := ${pkg}.NewClient(option.WithBaseURL(os.Getenv("E2E_BASE_URL")))
	ctx := context.Background()
	_ = ctx
	_ = client
	switch os.Args[1] {
${cases.join('\n')}
	}
}
`;
}

const MODULE = (pkg: string) => `github.com/example/${pkg}`;

async function buildSdk(spec: OpensdkSpecJson, pkg: string): Promise<{ binPath: string; tmpDir: string }> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-e2e-'));
  const files = opensdkGo(spec);
  files['cmd/driver/main.go'] = generateDriver(spec, pkg, MODULE(pkg));
  await writeProject(files, tmpDir);
  execSync('go mod tidy', { cwd: tmpDir, stdio: 'pipe' });
  execSync('go build -o driver ./cmd/driver', { cwd: tmpDir, stdio: 'pipe' });
  return { binPath: path.join(tmpDir, 'driver'), tmpDir };
}

function runAndRecord(
  binPath: string,
  key: string,
  server: RecordingServer,
  env: NodeJS.ProcessEnv,
): Promise<RecordedRequest | null> {
  return new Promise((resolve) => {
    server.last = null;
    const p = spawn(binPath, [key], { stdio: ['ignore', 'ignore', 'ignore'], env });
    const done = () => resolve(server.last ? normalizeRecorded(server.last) : null);
    const t = setTimeout(() => {
      p.kill('SIGKILL');
      done();
    }, 8000);
    p.on('exit', () => {
      clearTimeout(t);
      done();
    });
    p.on('error', () => {
      clearTimeout(t);
      done();
    });
  });
}

/** (Gated E2E_RECORD=1) Write per-method recorded.json (call key + assumed-correct request). */
export function recordE2E(cfg: ApiConfig) {
  if (process.env.E2E_RECORD !== '1') return;
  describe(`${cfg.name} e2e: record fixtures`, () => {
    it('write <method>/recorded.json', () => {
      const methods = loadPerMethod(cfg.fixturesDir);
      for (const m of methods) {
        const fixture: RecordedFixture = {
          call: callKey(m.leaf.segments, m.leaf.method),
          request: expectedRequest(m.ir, m.leaf.method),
        };
        fs.writeFileSync(path.join(cfg.fixturesDir, m.slug, 'recorded.json'), `${JSON.stringify(fixture, null, 2)}\n`);
      }
      expect(methods.length).toBeGreaterThan(100);
    });
  });
}

/** Register the e2e tests for an API from its committed per-method fixtures. */
export function defineE2E(cfg: ApiConfig) {
  if (process.env.E2E_RECORD === '1') return;
  const methods = loadPerMethod(cfg.fixturesDir).filter((m) =>
    fs.existsSync(path.join(cfg.fixturesDir, m.slug, 'recorded.json')),
  );
  const items = methods.map((m) => ({
    ...m,
    fixture: JSON.parse(fs.readFileSync(path.join(cfg.fixturesDir, m.slug, 'recorded.json'), 'utf8')) as RecordedFixture,
  }));
  const E2E = process.env.E2E_SDK === '1';
  const apiKeyEnv = items[0]?.ir.security?.find((s) => s.envVar)?.envVar || `${cfg.sdkName.toUpperCase()}_API_KEY`;
  const ENV = (port: number) => ({
    ...process.env,
    [apiKeyEnv]: 'sk-e2e-test',
    E2E_BASE_URL: `http://127.0.0.1:${port}`,
  });

  // Offline guard (no Go): fixtures stay consistent with the IR request binding.
  describe.skipIf(!items.length)(`${cfg.name} e2e: recorded requests match the IR binding`, () => {
    for (const m of items) {
      it(`${m.fixture.call} → ${m.fixture.request.method.toUpperCase()} ${m.fixture.request.path}`, () => {
        expect(expectedRequest(m.ir, m.leaf.method)).toEqual(m.fixture.request);
        expect(callKey(m.leaf.segments, m.leaf.method)).toEqual(m.fixture.call);
      });
    }
  });

  // Real-SDK check (gated E2E_SDK; runs where generated Go binaries EXECUTE, e.g. Linux
  // CI). On macOS, generated binaries may fail to run (`dyld: missing LC_UUID` — a Go
  // toolchain issue; `go build`/`go vet` still pass), so `binaryRuns` stays false and the
  // per-method assertions skip — the same documented gap as opencli2go's e2e.
  if (E2E && items.length) {
    describe(`${cfg.name} e2e: real SDK requests match fixtures`, () => {
      const server = new RecordingServer();
      let binPath = '';
      let tmpDir = '';
      let buildError: unknown = null;
      let binaryRuns = false;

      beforeAll(async () => {
        await server.start();
        if (!hasCommand('go version')) {
          buildError = new Error('go toolchain not available');
          return;
        }
        try {
          ({ binPath, tmpDir } = await buildSdk(fullIR(cfg.fixturesDir, cfg.sdkName), cfg.sdkName));
        } catch (e) {
          buildError = e;
          return;
        }
        // Probe a handful of methods so one panicking/no-request method can't skip the whole suite.
        for (const m of items.slice(0, 10)) {
          if ((await runAndRecord(binPath, m.fixture.call, server, ENV(server.port))) !== null) {
            binaryRuns = true;
            break;
          }
        }
      }, 600000);

      afterAll(() => {
        server.stop();
        if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
      });

      it('the whole SDK compiled', () => {
        expect(buildError, `${buildError}`).toBeNull();
        expect(fs.existsSync(binPath)).toBe(true);
      });

      for (const m of items) {
        it(`${m.fixture.call} → ${m.fixture.request.method.toUpperCase()} ${m.fixture.request.path}`, async (ctx) => {
          if (!binaryRuns) return ctx.skip();
          const actual = await runAndRecord(binPath, m.fixture.call, server, ENV(server.port));
          expect(actual, `${m.slug} made no request`).not.toBeNull();
          expect(diffRequest(actual!, m.fixture.request), m.slug).toEqual([]);
        }, 15000);
      }
    });
  }
}
