import fs from 'node:fs';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Method, OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { hasCommand } from './golden';
import {
  type RecordedFixture,
  RecordingServer,
  diffRequest,
  expectedRequest,
  fullIR,
  loadPerMethod,
  normalizeRecorded,
} from './e2e';

// The LANGUAGE-AGNOSTIC half of the SDK request-recording e2e. Every language
// emitter drives the SAME flow — assemble the whole-SDK IR from the committed
// per-method fixtures, build a driver that calls every generated client method
// against an in-process RecordingServer, and diff the produced HTTP request
// against a per-method recorded.json — differing only in three spots captured by
// a `DriverAdapter`: how a call is NAMED (the generated method chain), and how the
// whole SDK is BUILT and RUN. This lifts the reusable structure out of
// xyd-opensdk-go/__tests__/e2e/harness.ts so node/python/ruby/java/dotnet get the
// per-operation request assertion (ask B/D) for free.
//
// An API's whole e2e is two calls per language (see each emitter's e2e/openai.test.ts):
//   recordSdkE2E(cfg, adapter)  // (gated E2E_RECORD=1) write per-method recorded.json
//   defineSdkE2E(cfg, adapter)  // offline binding guard (always) + real-SDK run (gated E2E_SDK=1)

export interface ApiConfig {
  name: string;
  sdkName: string;
  /** Per-method fixtures dir: <slug>/input.json (OpenSDK IR) [+ recorded.json]. */
  fixturesDir: string;
}

/** A built, runnable SDK+driver — spawns the generated client for one call key. */
export interface BuiltDriver {
  /**
   * Run the generated driver for one call key, then resolve. `env` carries the
   * api-key var + `E2E_BASE_URL` pointing at the shared RecordingServer; the
   * request the SDK made is read from that server by the caller (not returned
   * here), mirroring `runUsageSnippet`.
   */
  run(callKey: string, env: NodeJS.ProcessEnv): Promise<void>;
  /** Remove the temp build dir. */
  dispose(): void;
}

/**
 * The per-language seam. Each emitter supplies one of these; everything else
 * (the vitest structure, the offline binding guard, the RecordingServer wiring,
 * the request diff) is shared.
 */
export interface DriverAdapter {
  /** Canonical language id for the toolchain probe / skip (e.g. 'go', 'node'). */
  lang: string;
  /** Command that proves the toolchain is installed (e.g. 'go version'). */
  toolchainProbe: string;
  /** The driver dispatch key for a leaf method, in this language's naming. */
  callKey(segments: string[], method: Method): string;
  /**
   * Generate the whole SDK for `spec`, add a driver that switch-dispatches every
   * operation (constructing the client with base URL from `E2E_BASE_URL`), and
   * build it. Reject if the toolchain build fails.
   */
  build(spec: OpensdkSpecJson, sdkName: string): Promise<BuiltDriver>;
}

/** The api-key env var a generated SDK reads, from the IR security (falls back to <SDK>_API_KEY). */
export function apiKeyEnvFor(ir: OpensdkSpecJson | undefined, sdkName: string): string {
  return ir?.security?.find((s) => s.envVar)?.envVar || `${sdkName.toUpperCase()}_API_KEY`;
}

/** (Gated E2E_RECORD=1) Write per-method recorded.json (call key + assumed-correct request). */
export function recordSdkE2E(cfg: ApiConfig, adapter: DriverAdapter): void {
  if (process.env.E2E_RECORD !== '1') return;
  describe(`${cfg.name} ${adapter.lang} e2e: record fixtures`, () => {
    it('write <method>/recorded.json', () => {
      const methods = loadPerMethod(cfg.fixturesDir);
      for (const m of methods) {
        const fixture: RecordedFixture = {
          call: adapter.callKey(m.leaf.segments, m.leaf.method),
          request: expectedRequest(m.ir, m.leaf.method),
        };
        fs.writeFileSync(path.join(cfg.fixturesDir, m.slug, 'recorded.json'), `${JSON.stringify(fixture, null, 2)}\n`);
      }
      expect(methods.length).toBeGreaterThan(100);
    });
  });
}

interface E2EItem {
  slug: string;
  ir: OpensdkSpecJson;
  leaf: { segments: string[]; method: Method };
  fixture: RecordedFixture;
}

/** Register the request-recording e2e tests for an API from its committed per-method fixtures. */
export function defineSdkE2E(cfg: ApiConfig, adapter: DriverAdapter): void {
  if (process.env.E2E_RECORD === '1') return;
  const methods = loadPerMethod(cfg.fixturesDir).filter((m) =>
    fs.existsSync(path.join(cfg.fixturesDir, m.slug, 'recorded.json')),
  );
  const items: E2EItem[] = methods.map((m) => ({
    ...m,
    fixture: JSON.parse(fs.readFileSync(path.join(cfg.fixturesDir, m.slug, 'recorded.json'), 'utf8')) as RecordedFixture,
  }));
  const E2E = process.env.E2E_SDK === '1';
  const apiKeyEnv = apiKeyEnvFor(items[0]?.ir, cfg.sdkName);
  const ENV = (port: number): NodeJS.ProcessEnv => ({
    ...process.env,
    [apiKeyEnv]: 'sk-e2e-test',
    E2E_BASE_URL: `http://127.0.0.1:${port}`,
  });

  // Offline guard (no toolchain): the committed fixtures stay consistent with the
  // IR request binding + this language's call naming. Always runs — this is the
  // "every request across the whole spec is correct" assertion for all languages.
  describe.skipIf(!items.length)(`${cfg.name} ${adapter.lang} e2e: recorded requests match the IR binding`, () => {
    for (const m of items) {
      it(`${m.fixture.call} → ${m.fixture.request.method.toUpperCase()} ${m.fixture.request.path}`, () => {
        expect(expectedRequest(m.ir, m.leaf.method)).toEqual(m.fixture.request);
        expect(adapter.callKey(m.leaf.segments, m.leaf.method)).toEqual(m.fixture.call);
      });
    }
  });

  // Real-SDK check (gated E2E_SDK; runs where the generated SDK EXECUTES). Builds
  // the whole SDK + driver, runs each generated client call, and diffs the actual
  // HTTP request against the fixture. On platforms where the built artifact can't
  // execute (documented: generated Go binaries on macOS — `dyld: missing LC_UUID`),
  // `sdkRuns` stays false and the per-method assertions skip. When the toolchain is
  // absent entirely (e.g. dotnet on a machine without the .NET SDK) the whole block
  // is skipped rather than reporting a build failure — CI has every toolchain.
  if (E2E && items.length && hasCommand(adapter.toolchainProbe)) {
    describe(`${cfg.name} ${adapter.lang} e2e: real SDK requests match fixtures`, () => {
      const server = new RecordingServer();
      let built: BuiltDriver | null = null;
      let buildError: unknown = null;
      let sdkRuns = false;

      beforeAll(async () => {
        await server.start();
        if (!hasCommand(adapter.toolchainProbe)) {
          buildError = new Error(`${adapter.lang} toolchain not available`);
          return;
        }
        try {
          built = await adapter.build(fullIR(cfg.fixturesDir, cfg.sdkName), cfg.sdkName);
        } catch (e) {
          buildError = e;
          return;
        }
        // Probe a handful so one no-request method can't skip the whole suite.
        for (const m of items.slice(0, 10)) {
          server.last = null;
          await built.run(m.fixture.call, ENV(server.port));
          if (server.last !== null) {
            sdkRuns = true;
            break;
          }
        }
      }, 600000);

      afterAll(() => {
        server.stop();
        built?.dispose();
      });

      it('the whole SDK built', () => {
        expect(buildError, `${buildError}`).toBeNull();
        expect(built).not.toBeNull();
      });

      for (const m of items) {
        it(
          `${m.fixture.call} → ${m.fixture.request.method.toUpperCase()} ${m.fixture.request.path}`,
          async (ctx) => {
            if (!sdkRuns || !built) return ctx.skip();
            server.last = null;
            await built.run(m.fixture.call, ENV(server.port));
            const actual = server.last ? normalizeRecorded(server.last) : null;
            expect(actual, `${m.slug} made no request`).not.toBeNull();
            // biome-ignore lint/style/noNonNullAssertion: guarded by the null check above
            expect(diffRequest(actual!, m.fixture.request), m.slug).toEqual([]);
          },
          15000,
        );
      }
    });
  }
}

// Re-export the recording bits the emitter drivers commonly need.
export { normalizeRecorded };
