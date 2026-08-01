import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it } from 'vitest';

import type { Field, Method, NamedType, OpensdkSpecJson, Resource, TypeRef } from '@xyd-js/opensdk-core';
import { type MethodExample, planMethodExample, planOperation } from '@xyd-js/opensdk-framework';
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

import { opensdkJava, writeProject } from '../../index';
import { renderJavaExample } from '../../src/example-java';
import { isConstField } from '../../src/javatype';
import { camelCase, javaMethodName, pascalCase, resourceQualifier, serviceTypeName } from '../../src/naming';
import { type JavaCtx, resolveJavaOptions } from '../../src/project';
import { planParams } from '../../src/service';

// The JAVA half of the e2e. Two flavors share this file:
//
//  1. A thin `DriverAdapter` over the shared, language-agnostic harness in
//     @xyd-js/opensdk-ci (IR merge, expected request, recording server, request
//     diff, vitest structure). callKey NAMES a call in Java's client-access shape
//     (camelCase accessor chain + java method name), and build() generates the
//     whole SDK + a switch-dispatch Driver, `javac`-compiles it, and returns a
//     runner. Register via recordE2E + defineE2E (see e2e/openai.test.ts).
//
//  2. runGeneratedTests: RUN the SDK's OWN generated assertion suite against a
//     spec-shaped MockServer (kept for the mock-based self-test tier).

export interface ApiConfig {
  name: string;
  sdkName: string;
  /** Per-method fixtures dir merged into one OpenSDK IR by `fullIR`. */
  fixturesDir: string;
}

const EXAMPLE = 'EXAMPLE';

// ---- call key: Java's client-access chain (camelCase resource segs + method) ----

const callKey = (segments: string[], method: Method): string =>
  `${segments.map(camelCase).join('.')}.${javaMethodName(method.action)}`;

// ---- generated driver: call each method against the recording server -----------

function requestBodyFields(method: Method, types: Map<string, NamedType>): Field[] {
  const ref = method.requestBody?.type as TypeRef | undefined;
  if (ref?.kind === 'ref' && ref.name) {
    const named = types.get(ref.name);
    if (named?.fields) return named.fields;
  }
  return [];
}

/**
 * The `${Params}.builder().<setter>(...)....build()` expression for a method, or
 * `null` when the method takes only path args. Mirrors the emitter's own
 * `renderParamsBuilder` (service.ts / example-java.ts): REQUIRED-ONLY fields with
 * planner example values (so the builder's required-guard passes and the ACTUAL
 * request carries the same required body/query field KEYS `expectedRequest`
 * records) — const-valued body fields are auto-filled by the method, never a
 * builder input, so they're filtered out here.
 */
function paramsArg(segments: string[], method: Method, ctx: JavaCtx): string | null {
  const plan = planOperation(method, ctx.types);
  const params = planParams(segments, method, plan, ctx);
  if (!params) return null;
  const cls = `${resourceQualifier(segments)}${pascalCase(javaMethodName(method.action))}Params`;
  const constNames = new Set(requestBodyFields(method, ctx.types).filter(isConstField).map((f) => f.name));
  const example: MethodExample = planMethodExample(method, ctx.types);
  const fields = example.fields.filter((f) => f.required && !constNames.has(f.name));
  if (fields.length === 0) return `${cls}.builder().build()`;
  const setters = fields.map((f) => `.${camelCase(f.name)}(${renderJavaExample(f.value, ctx)})`).join('');
  return `${cls}.builder()${setters}.build()`;
}

/**
 * A `Driver.java` in the SDK package that constructs the client (base URL from
 * `E2E_BASE_URL`, credential from the SDK's env var) and switch-dispatches
 * `args[0]` (the call key) to the matching generated client accessor chain +
 * method. Positional path args are example strings; the single params arg is a
 * required-only builder with planner example values. Every call is wrapped in a
 * try/catch — the request is already captured by the recording server before any
 * response-decode failure.
 */
function generateDriver(spec: OpensdkSpecJson, ctx: JavaCtx): string {
  const cases: string[] = [];
  const walk = (resources: Resource[] | undefined, segments: string[]) => {
    for (const r of resources || []) {
      const seg = [...segments, r.name];
      const chain = `client.${seg.map((s) => `${camelCase(s)}()`).join('.')}`;
      for (const m of r.methods || []) {
        const mname = javaMethodName(m.action);
        const key = `${seg.map(camelCase).join('.')}.${mname}`;
        const args = (m.pathParams || []).map(() => JSON.stringify(EXAMPLE));
        const params = paramsArg(seg, m, ctx);
        if (params) args.push(params);
        cases.push(
          `      case ${JSON.stringify(key)}:\n` +
            `        try { ${chain}.${mname}(${args.join(', ')}); } catch (RuntimeException ignored) {}\n` +
            `        break;`,
        );
      }
      walk(r.resources, seg);
    }
  };
  walk(spec.resources, []);
  const keyExpr = ctx.envVar ? `System.getenv(${JSON.stringify(ctx.envVar)})` : '"sk-e2e-test"';
  const body =
    `public final class Driver {\n` +
    `  public static void main(String[] args) {\n` +
    `    Client client = Client.builder().apiKey(${keyExpr}).baseUrl(System.getenv("E2E_BASE_URL")).build();\n` +
    `    switch (args[0]) {\n` +
    `${cases.join('\n')}\n` +
    `      default:\n        break;\n` +
    `    }\n` +
    `  }\n}`;
  return `// Code generated by opensdk. DO NOT EDIT.\n\npackage ${ctx.fullPackage};\n\n${body}\n`;
}

/**
 * The Java DriverAdapter: generate the whole SDK (tests off — the driver alone
 * exercises the request surface) + a Driver entry, `javac`-compile every source
 * together, and return a BuiltDriver whose run() spawns the compiled Driver for
 * one call key.
 */
export const javaDriverAdapter: DriverAdapter = {
  lang: 'java',
  toolchainProbe: 'javac -version',
  callKey,
  async build(spec: OpensdkSpecJson, _sdkName: string): Promise<BuiltDriver> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-java-e2e-'));
    const classesDir = path.join(tmpDir, '__classes__');
    // A minimal EmitterContext to reach the same JavaCtx the emitter resolves.
    const types = new Map<string, NamedType>((spec.types || []).map((t) => [t.name, t]));
    const ctx = resolveJavaOptions(spec, { spec, types, emitterOptions: {} });

    const files = opensdkJava(spec, { tests: false });
    const driverKey = `src/main/java/${ctx.fullPackage.split('.').join('/')}/Driver.java`;
    files[driverKey] = generateDriver(spec, ctx);
    await writeProject(files, tmpDir);
    fs.mkdirSync(classesDir, { recursive: true });

    // Compile EVERY source together with `javac` (execSync is fine — the compiler
    // makes no network call). An @argfile sidesteps ARG_MAX for the merged
    // 242-method SDK's hundreds of sources.
    const sources = Object.keys(files).filter((f) => f.endsWith('.java'));
    const argfile = path.join(tmpDir, '__sources__.txt');
    fs.writeFileSync(argfile, sources.map((f) => JSON.stringify(path.join(tmpDir, f))).join('\n'));
    execSync(`javac -d ${JSON.stringify(classesDir)} @${JSON.stringify(argfile)}`, { cwd: tmpDir, stdio: 'pipe' });

    const mainClass = `${ctx.fullPackage}.Driver`;
    return {
      run(key, env) {
        return new Promise<void>((resolve) => {
          // Async spawn (NOT execSync): the RecordingServer runs in THIS Node
          // process, so a synchronous child would block the loop and the driver's
          // HTTP call would deadlock. spawn keeps the loop free to serve the request.
          const p = spawn('java', ['-cp', classesDir, mainClass, key], {
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
  recordSdkE2E(cfg, javaDriverAdapter);
}

/** Offline binding guard (always) + real-SDK request diff (gated E2E_SDK=1). */
export function defineE2E(cfg: CiApiConfig): void {
  defineSdkE2E(cfg, javaDriverAdapter);
}

// ---- self-test tier (gated E2E_SDK_TESTS): the SDK's OWN suite vs a mock -------

/**
 * The full package (e.g. "com.example.openai") the generated tree declares —
 * read off the emitted Client.java path (`src/main/java/<pkg-path>/Client.java`).
 */
function fullPackageOf(files: Record<string, string>): string {
  const key = Object.keys(files).find((k) => k.endsWith('/Client.java'));
  if (!key) throw new Error('no Client.java in the generated SDK');
  const rel = key.replace(/^src\/main\/java\//, '').replace(/\/Client\.java$/, '');
  return rel.split('/').join('.');
}

/** The generated per-resource test classes (simple names) — the `<Qualifier>ServiceTest.java` files. */
function testClassNames(files: Record<string, string>): string[] {
  return Object.keys(files)
    .filter((k) => k.endsWith('ServiceTest.java'))
    .map((k) => path.basename(k, '.java'))
    .sort();
}

/**
 * An aggregate `main` that invokes every per-resource test class's `main` in one
 * JVM — the Java analog of `go test ./...` / `pytest tests`. Added to the temp
 * project only; never committed to the golden.
 */
function aggregateRunner(fullPackage: string, classes: string[]): string {
  const body = classes.map((c) => `    ${c}.main(args);`).join('\n');
  return (
    '// Code generated by opensdk. DO NOT EDIT.\n\n' +
    `package ${fullPackage};\n\n` +
    'public final class AllTests {\n' +
    '  public static void main(String[] args) {\n' +
    `${body}\n` +
    '    System.out.println("AllTests OK");\n' +
    '  }\n' +
    '}\n'
  );
}

/**
 * (Gated E2E_SDK_TESTS=1) RUN the generated Java SDK's OWN assertion suite
 * against a spec-shaped mock — the analog of pointing openai-java's tests at a
 * Prism mock of the OpenAPI spec. Generates the whole SDK (with its
 * <Resource>ServiceTest.java), `javac`-compiles every source, stands up a
 * MockServer that answers every method with a decodable example response, and
 * runs the aggregate `AllTests` main with TEST_API_BASE_URL pointed at it, so
 * the emitted tests EXECUTE and PASS (not just compile). Gated on javac.
 */
export function runGeneratedTests(cfg: ApiConfig) {
  const RUN = process.env.E2E_SDK_TESTS === '1';
  describe.runIf(RUN)(`${cfg.name} e2e: the SDK's own generated tests pass against a mock`, () => {
    it('the generated java assertion suite is green against the spec-shaped mock', async () => {
      if (!hasCommand('javac -version') || !hasCommand('java -version')) return;
      const spec = fullIR(cfg.fixturesDir, cfg.sdkName);
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-java-selftest-'));
      const classesDir = path.join(tmpDir, '__classes__');
      const mock = new MockServer(spec);
      await mock.start();
      try {
        const files = opensdkJava(spec); // tests default ON
        const fullPackage = fullPackageOf(files);
        const runnerKey = `src/main/java/${fullPackage.split('.').join('/')}/AllTests.java`;
        files[runnerKey] = aggregateRunner(fullPackage, testClassNames(files));

        await writeProject(files, tmpDir);
        fs.mkdirSync(classesDir, { recursive: true });

        const sources = Object.keys(files).filter((f) => f.endsWith('.java'));
        const argfile = path.join(tmpDir, '__sources__.txt');
        fs.writeFileSync(argfile, sources.map((f) => JSON.stringify(path.join(tmpDir, f))).join('\n'));
        execSync(`javac -d ${JSON.stringify(classesDir)} @${JSON.stringify(argfile)}`, { cwd: tmpDir, stdio: 'pipe' });

        await new Promise<void>((resolve, reject) => {
          const p = spawn('java', ['-cp', classesDir, `${fullPackage}.AllTests`], {
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
          p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`java AllTests failed:\n${out}`))));
          p.on('error', reject);
        });
      } finally {
        mock.stop();
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }, 600000);
  });
}
