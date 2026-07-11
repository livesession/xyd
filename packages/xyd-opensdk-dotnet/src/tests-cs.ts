import type { Method, NamedType, OpensdkSpecJson, Param, Resource, TypeRef } from '@xyd-js/opensdk-core';
import type { NeutralTypeField, RenderedTypeField, RenderedTypeReference } from '@xyd-js/opensdk-framework';
import { planExample, planMethodExample, planOperation, planTypeReference, realisticLiteral, refSchemaName } from '@xyd-js/opensdk-framework';

import { CS_HEADER, CSPROJ_HEADER, csFile, indent } from './cswriter';
import { csType, nullable } from './cstype';
import { type CsExampleCtx, renderRefValue } from './example-cs';
import { camelCase, methodName, pascalCase, screamingSnakeCase } from './naming';
import { dotnetPageName } from './pagination';

// The SDK's OWN test suite (dotnetEmitter.generateTests) — one `<Resource>Tests`
// class per top-level resource with a [Fact] method per SDK method (required-only
// and, when the method has optionals, a WithAllParams variant), plus an empty
// path-param guard test. Example VALUES come from the shared, language-neutral
// planner (planMethodExample / planExample) so the Go/Python/.NET suites exercise
// identical shapes; this file only RENDERS them as compilable C#.
//
// DEPENDENCY-FREE by design: rather than pull xUnit, the test project vendors its
// own `[Fact]` attribute + a reflection `TestRunner` + a tiny `Assert`, so it
// compiles (and, in phase 4, runs) with only `dotnet build`/`dotnet run` — no
// package restore. The classes still read xUnit-style (`[Fact] async Task`).

export interface DotnetTestsCtx {
  sdk: string;
  namespace: string;
  targetFramework: string;
  types: Map<string, NamedType>;
}

/** All generated test-project files: the csproj, the vendored framework, one class per resource. */
export function renderTestFiles(resources: Resource[], ctx: DotnetTestsCtx): { path: string; content: string }[] {
  const dir = `${ctx.sdk}.Tests`;
  const testNamespace = `${ctx.namespace}.Tests`;
  const files: { path: string; content: string }[] = [
    { path: `${dir}/${ctx.sdk}.Tests.csproj`, content: testCsproj(ctx) },
    { path: `${dir}/Program.cs`, content: programCs(testNamespace) },
    { path: `${dir}/TestFramework.cs`, content: frameworkCs(testNamespace) },
    { path: `${dir}/TestServer.cs`, content: testServerCs(testNamespace) },
  ];
  for (const resource of resources) {
    files.push({ path: `${dir}/${pascalCase(resource.name)}Tests.cs`, content: resourceTest(resource, ctx, testNamespace) });
  }
  return files;
}

/** The test project: an Exe that project-references the SDK; no external PackageReference. */
function testCsproj(ctx: DotnetTestsCtx): string {
  return `${CSPROJ_HEADER}
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>${ctx.targetFramework}</TargetFramework>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>disable</ImplicitUsings>
    <OutputType>Exe</OutputType>
    <RootNamespace>${ctx.namespace}.Tests</RootNamespace>
    <AssemblyName>${ctx.sdk}.Tests</AssemblyName>
    <GenerateDocumentationFile>false</GenerateDocumentationFile>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="../${ctx.sdk}.csproj" />
  </ItemGroup>

</Project>
`;
}

/** The test-runner entry point. */
function programCs(testNamespace: string): string {
  return `${CS_HEADER}

using System.Threading.Tasks;

namespace ${testNamespace};

public static class Program
{
    public static async Task<int> Main()
    {
        return await TestRunner.RunAllAsync().ConfigureAwait(false);
    }
}
`;
}

/** The vendored `[Fact]` attribute, `Assert` helpers and reflection runner. */
function frameworkCs(testNamespace: string): string {
  return `${CS_HEADER}

using System;
using System.Reflection;
using System.Threading.Tasks;

namespace ${testNamespace};

/// <summary>Marks a parameterless test method for the vendored runner (xUnit-style).</summary>
[AttributeUsage(AttributeTargets.Method)]
public sealed class FactAttribute : Attribute
{
}

/// <summary>Minimal, dependency-free assertions for the generated test suite.</summary>
public static class Assert
{
    public static void NotNull(object? value)
    {
        if (value == null)
        {
            throw new Exception("Expected a non-null value.");
        }
    }

    public static void True(bool condition, string message = "Expected condition to be true.")
    {
        if (!condition)
        {
            throw new Exception(message);
        }
    }

    public static async Task ThrowsAsync<TException>(Func<Task> action)
        where TException : Exception
    {
        try
        {
            await action().ConfigureAwait(false);
        }
        catch (TException)
        {
            return;
        }
        throw new Exception("Expected " + typeof(TException).Name + " to be thrown.");
    }
}

/// <summary>Discovers [Fact] methods by reflection, runs them, and reports pass/fail.</summary>
public static class TestRunner
{
    public static async Task<int> RunAllAsync()
    {
        int failures = 0;
        Assembly assembly = typeof(TestRunner).Assembly;
        foreach (Type type in assembly.GetTypes())
        {
            if (type.IsAbstract || type.GetConstructor(Type.EmptyTypes) == null)
            {
                continue;
            }
            object? instance = null;
            foreach (MethodInfo method in type.GetMethods(BindingFlags.Public | BindingFlags.Instance))
            {
                if (method.GetCustomAttribute<FactAttribute>() == null)
                {
                    continue;
                }
                instance ??= Activator.CreateInstance(type);
                try
                {
                    object? result = method.Invoke(instance, null);
                    if (result is Task task)
                    {
                        await task.ConfigureAwait(false);
                    }
                    Console.WriteLine("PASS " + type.Name + "." + method.Name);
                }
                catch (Exception ex)
                {
                    failures++;
                    Console.WriteLine("FAIL " + type.Name + "." + method.Name + ": " + (ex.InnerException ?? ex).Message);
                }
            }
        }
        return failures == 0 ? 0 : 1;
    }
}
`;
}

/** The mock-server probe: tests skip cleanly when no server answers (running is phase 4). */
function testServerCs(testNamespace: string): string {
  return `${CS_HEADER}

using System;
using System.Net.Http;

namespace ${testNamespace};

internal static class TestServer
{
    public static string BaseUrl()
    {
        return Environment.GetEnvironmentVariable("TEST_API_BASE_URL") ?? "http://localhost:4010";
    }

    public static bool Check(string baseUrl)
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
            client.GetAsync(baseUrl).GetAwaiter().GetResult();
            return true;
        }
        catch
        {
            return false;
        }
    }
}
`;
}

interface FlatMethod {
  method: Method;
  /** PascalCase accessor chain from `client`, e.g. ["Videos", "Characters"]. */
  chain: string[];
  /** Test-name qualifier for nested resources (empty for a top-level method). */
  namePrefix: string;
}

function collectMethods(resource: Resource, chain: string[], namePrefix: string, out: FlatMethod[]): void {
  for (const method of resource.methods || []) out.push({ method, chain, namePrefix });
  for (const sub of resource.resources || []) {
    const seg = pascalCase(sub.name);
    collectMethods(sub, [...chain, seg], `${namePrefix}${seg}`, out);
  }
}

/** The first required string path param of a method (drives the guard test), or null. */
function firstStringPathParam(method: Method): Param | null {
  for (const p of method.pathParams || []) {
    if (p.type?.kind === 'scalar' && p.type.scalar === 'string' && p.required !== false) return p;
  }
  return null;
}

/** Whether the method returns a value (drives `var result = await` vs bare `await`). */
function methodHasResult(method: Method, types: Map<string, NamedType>): boolean {
  const op = planOperation(method, types);
  return op.binaryContentType != null || dotnetPageName(op) != null || (method.primaryResponse != null && op.primaryResponse !== 'none');
}

/**
 * The ordered call arguments (positional, signature order): path args, then the
 * request body as an object literal, then query ∪ header values — required only,
 * or required+optional when `withOptional`. A `targetPath` param renders as `""`
 * (the empty-path guard). Mirrors the service emitter's signature ordering.
 */
function callArgs(method: Method, exCtx: CsExampleCtx, withOptional: boolean, targetPath?: Param, realistic = false): string {
  const required: string[] = [];
  const optional: string[] = [];
  for (const p of method.pathParams || []) {
    if (targetPath && p === targetPath) required.push('""');
    else {
      const value =
        (realistic ? realisticLiteral(p.type as TypeRef, p.example, p.default) : undefined) ??
        planExample(p.type as TypeRef, exCtx.types, { stringHint: p.name, realistic });
      required.push(renderRefValue(p.type as TypeRef, value, exCtx));
    }
  }
  const bodyRef = method.requestBody?.type as TypeRef | undefined;
  if (bodyRef) {
    // A body is a struct ref — its fields get realism via exampleFields (field.default).
    const expr = renderRefValue(bodyRef, planExample(bodyRef, exCtx.types, { withOptional, realistic }), exCtx);
    if (method.requestBody?.required === true) required.push(expr);
    else optional.push(expr);
  }
  for (const p of [...(method.queryParams || []), ...(method.headerParams || [])]) {
    const value =
      (realistic ? realisticLiteral(p.type as TypeRef, p.example, p.default) : undefined) ??
      planExample(p.type as TypeRef, exCtx.types, { withOptional, stringHint: p.name, realistic });
    const expr = renderRefValue(p.type as TypeRef, value, exCtx);
    if (p.required) required.push(expr);
    else optional.push(expr);
  }
  const slots = withOptional ? [...required, ...optional] : required;
  return slots.join(', ');
}

function methodTest(testName: string, callExpr: string, hasResult: boolean, sdk: string): string {
  const lines = [
    '[Fact]',
    `public async Task ${testName}()`,
    '{',
    '    string baseUrl = TestServer.BaseUrl();',
    '    if (!TestServer.Check(baseUrl))',
    '    {',
    '        return;',
    '    }',
    `    var client = new ${sdk}Client(apiKey: "My API Key", baseUrl: baseUrl);`,
  ];
  if (hasResult) {
    lines.push(`    var result = await ${callExpr};`);
    lines.push('    Assert.NotNull(result);');
  } else {
    lines.push(`    await ${callExpr};`);
  }
  lines.push('}');
  return lines.join('\n');
}

function guardTest(testName: string, callExpr: string, sdk: string): string {
  return [
    '[Fact]',
    `public async Task ${testName}()`,
    '{',
    `    var client = new ${sdk}Client(apiKey: "My API Key", baseUrl: "http://localhost:4010");`,
    `    await Assert.ThrowsAsync<ArgumentException>(async () => await ${callExpr});`,
    '}',
  ].join('\n');
}

/** One `<Resource>Tests.cs` covering the resource's whole subtree. */
function resourceTest(resource: Resource, ctx: DotnetTestsCtx, testNamespace: string): string {
  const exCtx: CsExampleCtx = { types: ctx.types };
  const collected: FlatMethod[] = [];
  collectMethods(resource, [pascalCase(resource.name)], '', collected);

  const blocks: string[] = [];
  for (const { method, chain, namePrefix } of collected) {
    const base = `${namePrefix}${methodName(method.action)}`;
    const chainExpr = `client.${chain.join('.')}.${methodName(method.action)}`;
    const hasResult = methodHasResult(method, ctx.types);

    blocks.push(methodTest(`Method${base}`, `${chainExpr}(${callArgs(method, exCtx, false)})`, hasResult, ctx.sdk));

    if (planMethodExample(method, ctx.types).hasOptional) {
      blocks.push(
        methodTest(`Method${base}WithAllParams`, `${chainExpr}(${callArgs(method, exCtx, true)})`, hasResult, ctx.sdk),
      );
    }

    const target = firstStringPathParam(method);
    if (target) {
      blocks.push(guardTest(`PathParams${base}`, `${chainExpr}(${callArgs(method, exCtx, false, target)})`, ctx.sdk));
    }
  }

  const body = blocks.length ? blocks.join('\n\n') : '// no methods';
  const cls = `public class ${pascalCase(resource.name)}Tests\n{\n${indent(body)}\n}`;
  // System.Collections.Generic is needed whenever an example value is an array
  // (List<T>) or map (Dictionary<string,T>); harmless when unused.
  return `${CS_HEADER}

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ${testNamespace};

${cls}
`;
}

/** The render context threaded through the .NET usage-snippet emitter. */
export interface DotnetUsageCtx {
  sdk: string;
  namespace: string;
  types: Map<string, NamedType>;
  /** The env var the client reads the credential from; falls back to `<SDK>_API_KEY`. */
  envVar?: string;
  /**
   * Snippet-run only (ask C.2): when set, the snippet also constructs the client
   * reading its base URL from this env var so it can be pointed at a recording
   * server. Unset (default) → the snippet's client construction — and every
   * committed usage golden — stays byte-identical.
   */
  baseUrlEnv?: string;
}

/**
 * A single per-operation USAGE SNIPPET (docs): a self-contained, runnable-looking
 * C# example — a top-level `Example` program that constructs the client and makes
 * ONE required-only method call (à la Fern/Speakeasy/Stainless), mirroring the
 * Go/Python/Java emitters' usage snippets. Reuses the SAME client attribute chain
 * builder (PascalCase) and call-assembly (`callArgs`, required-only) the test suite
 * uses, minus the mock/assert/guard scaffolding. `chain` is the resource-name path
 * (root→owner) the method hangs off. Async — the SDK's methods are `...Async`.
 */
export function generateDotnetUsage(method: Method, chain: string[], ctx: DotnetUsageCtx): string {
  const exCtx: CsExampleCtx = { types: ctx.types };
  const name = methodName(method.action);
  const chainExpr = `client.${chain.map(pascalCase).join('.')}.${name}`;
  // A doc usage snippet: ALL fields with realistic (spec example/default) values.
  const call = `${chainExpr}(${callArgs(method, exCtx, true, undefined, true)})`;
  const hasResult = methodHasResult(method, ctx.types);

  const envVar = ctx.envVar ?? `${screamingSnakeCase(ctx.sdk)}_API_KEY`;
  const keyExpr = `Environment.GetEnvironmentVariable(${JSON.stringify(envVar)})`;

  // Client construction: normally apiKey-only (default base URL). When `baseUrlEnv`
  // is set (the snippet-run tier, ask C.2), ALSO read the base URL from that env var
  // so the snippet can target a recording server. Only alters output when set —
  // default snippet output stays BYTE-IDENTICAL.
  const clientArgs = [`apiKey: ${keyExpr}`];
  if (ctx.baseUrlEnv) {
    clientArgs.push(`baseUrl: Environment.GetEnvironmentVariable(${JSON.stringify(ctx.baseUrlEnv)})`);
  }

  const lines: string[] = [`var client = new ${ctx.sdk}Client(${clientArgs.join(', ')});`];
  if (hasResult) {
    lines.push(`var result = await ${call};`);
    lines.push('Console.WriteLine(result);');
  } else {
    lines.push(`await ${call};`);
  }

  // A top-level async-Main `Program` (the conventional entry class name; avoids
  // clashing with an `Example`-rooted namespace): `using`s sorted by csFile, the
  // SDK namespace imported so the client + models resolve. System.Collections.Generic
  // is needed whenever a required example value is a List<T>/Dictionary<string,T>.
  const usings = ['System', 'System.Collections.Generic', 'System.Threading.Tasks', ctx.namespace];
  const cls = `public static class Program\n{\n${indent(
    `public static async Task Main()\n{\n${indent(lines.join('\n'))}\n}`,
  )}\n}`;
  return csFile(usings, `${ctx.namespace}.Usage`, [cls]);
}

// ---- type reference (Atlas SDK-types view) -------------------------------

function csRenderField(f: NeutralTypeField, types: Map<string, NamedType>): RenderedTypeField {
  const base = csType(f.typeRef as TypeRef, types);
  return {
    // Body maps to a model class property (PascalCase); query/header map to a
    // method argument (camelCase).
    name: f.in === 'body' ? pascalCase(f.logicalName) : camelCase(f.logicalName),
    langType: f.required ? base : nullable(base),
    required: f.required,
    description: f.description,
    deprecated: f.deprecated,
    refTypeName: refSchemaName(f.typeRef),
  };
}

/** The `Task<T>` display return — the actual type name (csType), not the runtime
 * `object?` a mapped union decodes to. Mirrors returnPlan (service.ts). */
function csReturnDisplay(method: Method, op: ReturnType<typeof planOperation>, types: Map<string, NamedType>): string {
  if (op.binaryContentType) return 'Task<byte[]>';
  const page = dotnetPageName(op);
  if (page) return `Task<${page}<${csType(method.pagination?.itemType as TypeRef | undefined, types)}>>`;
  const ref = method.primaryResponse as TypeRef | undefined;
  if (!ref || op.primaryResponse === 'none') return 'Task';
  return `Task<${csType(ref, types)}>`;
}

function csResponse(
  method: Method,
  op: ReturnType<typeof planOperation>,
  neutral: ReturnType<typeof planTypeReference>,
  types: Map<string, NamedType>,
): RenderedTypeReference['response'] {
  if (op.binaryContentType) return { langType: 'byte[]', note: `binary download (${op.binaryContentType})` };
  const ref = neutral.response.typeRef;
  if (!ref || op.primaryResponse === 'none') return { langType: 'Task', note: 'no response body' };
  const typeName = csType(ref as TypeRef, types);
  const note = op.pageName ? `paginated (${op.pageName})` : undefined;
  if (neutral.response.fields) {
    return {
      typeName,
      note,
      fields: neutral.response.fields.map((f) => ({
        name: pascalCase(f.logicalName),
        langType: csType(f.typeRef as TypeRef, types),
        required: f.required,
        description: f.description,
        deprecated: f.deprecated,
        refTypeName: refSchemaName(f.typeRef),
      })),
    };
  }
  return { typeName, langType: typeName, note };
}

/** The per-operation SDK TYPE reference for .NET: the method signature + the
 * request field rows (flattened args — no dedicated params class) + the response. */
export function generateDotnetTypeReference(method: Method, chain: string[], ctx: DotnetUsageCtx): RenderedTypeReference {
  const types = ctx.types;
  const op = planOperation(method, types);
  const neutral = planTypeReference(method, types);
  const name = methodName(method.action);
  const chainExpr = `client.${chain.map(pascalCase).join('.')}.${name}`;

  const argNames = [
    ...op.paramGroups.path.map((p) => camelCase(p.name)),
    ...(op.hasBody ? ['body'] : []),
    ...op.paramGroups.query.map((q) => camelCase(q.name)),
    ...op.paramGroups.header.map((h) => camelCase(h.name)),
  ];
  const signature = `${chainExpr}(${argNames.join(', ')}) -> ${csReturnDisplay(method, op, types)}`;

  return {
    signature,
    request: { fields: neutral.request.fields.map((f) => csRenderField(f, types)) },
    response: csResponse(method, op, neutral, types),
  };
}
