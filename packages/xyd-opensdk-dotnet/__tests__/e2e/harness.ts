import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Field, Method, NamedType, OpensdkSpecJson, Param, Resource, TypeRef } from '@xyd-js/opensdk-core';
import { planExample, planOperation } from '@xyd-js/opensdk-framework';
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

import { opensdkDotnet, writeProject } from '../../index';
import { type CsExampleCtx, renderRefValue } from '../../src/example-cs';
import { camelCase, methodName, pascalCase } from '../../src/naming';

// The DOTNET-specific half of the e2e. Two flavors share this file:
//
//  1. A thin `DriverAdapter` over the shared, language-agnostic harness in
//     @xyd-js/opensdk-ci (IR merge, expected request, recording server, request
//     diff, vitest structure). callKey NAMES a call in .NET's client-access shape
//     (PascalCase resource chain + PascalCase method, e.g. `Batches.Create`), and
//     build() generates the whole SDK + a switch-dispatch driver Program, `dotnet
//     build`s it, and returns a runner. Register via recordE2E + defineE2E (see
//     e2e/openai.test.ts).
//
//  2. runGeneratedTests: RUN the SDK's OWN generated [Fact] suite against a
//     spec-shaped MockServer (kept for the mock-based self-test tier).

export interface ApiConfig {
  name: string;
  sdkName: string;
  /** Per-method fixtures dir: <slug>/input.json (OpenSDK IR). */
  fixturesDir: string;
}

const EXAMPLE = 'EXAMPLE';

// ---- call key: .NET's client-access chain (PascalCase resource segs + method) ----
//
// Mirrors the generated `client.Batches.Create(...)` and the test suite's
// `client.<chain>.<Method>` chain (tests-cs.ts). PascalCase because .NET resource
// accessors and methods are Pascal-cased.

const callKey = (segments: string[], method: Method): string =>
  `${segments.map(pascalCase).join('.')}.${methodName(method.action)}`;

// ---- generated driver: call each method against the recording server ----------

/** Resolve a request body's fields by following its TypeRef into the symbol table. */
function bodyFields(method: Method, types: Map<string, NamedType>): Field[] {
  const ref = method.requestBody?.type as TypeRef | undefined;
  if (ref?.kind === 'ref' && ref.name) {
    const named = types.get(ref.name);
    if (named?.fields) return named.fields;
  }
  return [];
}

/**
 * A single positional call argument list for a method, in the SERVICE emitter's
 * signature order (service.ts / emitMethod): path args (example strings), then the
 * request body as a `new <Model> { ... }` object literal (REQUIRED-ONLY fields with
 * planner example values, so the generated body carries the same field KEYS
 * `expectedRequest` records), then the REQUIRED query ∪ header params (positional,
 * planner example values). Optionals are omitted — the recording server diffs by
 * field/query KEY, not value, and the offline fixture is required-only, so this
 * reproduces the fixture's request shape.
 */
function callArgs(method: Method, exCtx: CsExampleCtx): string {
  const op = planOperation(method, exCtx.types);
  const args: string[] = [];

  for (const p of op.paramGroups.path) args.push(JSON.stringify(EXAMPLE));

  const bodyRef = method.requestBody?.type as TypeRef | undefined;
  if (bodyRef && op.bodyRequired) {
    // Required-only body model literal (withOptional: false) with realistic values.
    const value = planExample(bodyRef, exCtx.types, { withOptional: false, realistic: true });
    args.push(renderRefValue(bodyRef, value, exCtx));
  }

  for (const p of [...op.paramGroups.query, ...op.paramGroups.header] as Param[]) {
    if (!p.required) continue;
    const value = planExample(p.type as TypeRef, exCtx.types, { stringHint: p.name, realistic: true });
    args.push(renderRefValue(p.type as TypeRef, value, exCtx));
  }

  return args.join(', ');
}

/**
 * A `Program.cs` (top-level entry class) that constructs the client (base URL from
 * `E2E_BASE_URL`, credential from the SDK's env var via the client's own fallback)
 * and switch-dispatches `args[0]` (the call key) to the matching generated client
 * accessor chain + method. Each call is wrapped in try/catch — the request is
 * already captured by the recording server before any response-decode failure.
 */
function generateDriver(spec: OpensdkSpecJson, sdk: string, namespaceName: string): string {
  const types = new Map<string, NamedType>((spec.types || []).map((t) => [t.name, t]));
  const exCtx: CsExampleCtx = { types };
  const cases: string[] = [];
  const walk = (resources: Resource[] | undefined, segments: string[]) => {
    for (const r of resources || []) {
      const seg = [...segments, r.name];
      const chain = seg.map(pascalCase).join('.');
      for (const m of r.methods || []) {
        const mname = methodName(m.action);
        cases.push(
          `        case ${JSON.stringify(`${chain}.${mname}`)}:\n` +
            `            try { await client.${chain}.${mname}(${callArgs(m, exCtx)}); } catch (Exception) { }\n` +
            `            break;`,
        );
      }
      walk(r.resources, seg);
    }
  };
  walk(spec.resources, []);

  return `// Code generated by opensdk. DO NOT EDIT.

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ${namespaceName};

namespace ${namespaceName}.Driver;

public static class Program
{
    public static async Task Main(string[] args)
    {
        var client = new ${sdk}Client(baseUrl: Environment.GetEnvironmentVariable("E2E_BASE_URL"));
        switch (args[0])
        {
${cases.join('\n')}
            default:
                break;
        }
    }
}
`;
}

/** The driver's own `.csproj` — an Exe that project-references the SDK library. */
function driverCsproj(sdk: string, targetFramework: string): string {
  return `<!-- Code generated by opensdk. DO NOT EDIT. -->
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>${targetFramework}</TargetFramework>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>disable</ImplicitUsings>
    <OutputType>Exe</OutputType>
    <AssemblyName>${sdk}.Driver</AssemblyName>
    <GenerateDocumentationFile>false</GenerateDocumentationFile>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="../${sdk}.csproj" />
  </ItemGroup>

</Project>
`;
}

/** The SDK name + root namespace the emitter derives (mirrors emitter.resolveOptions). */
function resolveNames(spec: OpensdkSpecJson): { sdk: string; namespace: string } {
  const sdk = pascalCase(spec.info.title) || 'Client';
  return { sdk, namespace: `Example.${sdk}` };
}

/**
 * The .NET DriverAdapter: generate the whole SDK (tests off — the driver alone
 * exercises the request surface) + a Driver Exe project, `dotnet build` the driver
 * (which project-references and re-builds the SDK library), and return a
 * BuiltDriver whose run() spawns the built entry for one call key.
 */
export const dotnetDriverAdapter: DriverAdapter = {
  lang: 'dotnet',
  toolchainProbe: 'dotnet --version',
  callKey,
  async build(spec: OpensdkSpecJson, _sdkName: string): Promise<BuiltDriver> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-dotnet-e2e-'));
    const { sdk, namespace } = resolveNames(spec);
    const targetFramework = 'net8.0';

    const files = opensdkDotnet(spec, { tests: false });
    files['Driver/Driver.csproj'] = driverCsproj(sdk, targetFramework);
    files['Driver/Program.cs'] = generateDriver(spec, sdk, namespace);
    await writeProject(files, tmpDir);

    // `dotnet build` the driver (execSync is fine — the compiler makes no server
    // call). The ProjectReference re-builds the SDK library too.
    const driverProject = path.join(tmpDir, 'Driver', 'Driver.csproj');
    execSync(`dotnet build --nologo -c Release ${JSON.stringify(driverProject)}`, {
      cwd: tmpDir,
      stdio: 'pipe',
      env: { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1' },
    });

    return {
      run(key, env) {
        return new Promise<void>((resolve) => {
          // Async spawn (NOT execSync): the RecordingServer runs in THIS Node
          // process, so a synchronous child would block the loop and the driver's
          // HTTP call would deadlock. `dotnet run --no-build` runs the pre-built
          // exe; spawn keeps the loop free to serve the request.
          const p = spawn(
            'dotnet',
            ['run', '--no-build', '-c', 'Release', '--project', driverProject, '--', key],
            { cwd: tmpDir, stdio: ['ignore', 'ignore', 'ignore'], env },
          );
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
  recordSdkE2E(cfg, dotnetDriverAdapter);
}

/** Offline binding guard (always) + real-SDK request diff (gated E2E_SDK=1). */
export function defineE2E(cfg: CiApiConfig): void {
  defineSdkE2E(cfg, dotnetDriverAdapter);
}

/**
 * (Gated E2E_SDK_TESTS=1) RUN the SDK's OWN generated test suite against a
 * spec-shaped mock — the .NET analog of pointing openai-dotnet's tests at a Prism
 * mock of the OpenAPI spec. Generates the whole SDK (with its <Resource>Tests.cs +
 * vendored [Fact] runner), stands up a MockServer that answers every method with a
 * decodable example response, and runs the generated test EXE (`dotnet run`) with
 * TEST_API_BASE_URL pointed at it, so the emitted tests EXECUTE and PASS (not just
 * compile). The runner's Program.Main returns 0 when every [Fact] passes.
 *
 * dotnet is not installed in THIS environment, so the whole run is gated on a .NET
 * SDK on PATH and skips cleanly locally; it runs unconditionally in CI.
 */
export function runGeneratedTests(cfg: ApiConfig) {
  const RUN = process.env.E2E_SDK_TESTS === '1';
  describe.runIf(RUN)(`${cfg.name} e2e: the SDK's own generated tests pass against a mock`, () => {
    it('dotnet run over the generated tests is green against the spec-shaped mock', async () => {
      if (!hasCommand('dotnet --version')) return; // dotnet not installed → skip cleanly (runs in CI)
      const spec = fullIR(cfg.fixturesDir, cfg.sdkName);
      const files = opensdkDotnet(spec);
      // The generated test project (an Exe) — <Sdk>.Tests/<Sdk>.Tests.csproj.
      const testProject = Object.keys(files).find((p) => p.endsWith('.Tests.csproj'));
      expect(testProject, 'no generated test project (.Tests.csproj)').toBeTruthy();

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-selftest-dotnet-'));
      const mock = new MockServer(spec);
      await mock.start();
      try {
        await writeProject(files, tmpDir);
        // Run the test EXE via ASYNC spawn (NOT execSync): the mock runs in THIS
        // Node process, so a synchronous child would block the event loop and the
        // SDK's TestServer.Check http.Get would deadlock. `dotnet run` builds then
        // runs in the child; only the run hits the mock, and spawn keeps the loop
        // free to serve it. Program.Main exits 0 iff every [Fact] passed.
        await new Promise<void>((resolve, reject) => {
          const p = spawn('dotnet', ['run', '--project', testProject as string, '-c', 'Release'], {
            cwd: tmpDir,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              TEST_API_BASE_URL: `http://127.0.0.1:${mock.port}`,
              DOTNET_CLI_TELEMETRY_OPTOUT: '1',
              DOTNET_NOLOGO: '1',
            },
          });
          let out = '';
          p.stdout?.on('data', (d) => {
            out += d;
          });
          p.stderr?.on('data', (d) => {
            out += d;
          });
          p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`dotnet run failed (exit ${code}):\n${out}`))));
          p.on('error', reject);
        });
      } finally {
        mock.stop();
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }, 600000);
  });
}
