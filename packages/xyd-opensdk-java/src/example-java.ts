// The generated SDK's OWN test suite (javaEmitter.generateTests). Java has no
// JUnit on the local classpath, so each top-level resource gets a dependency-
// free assertion test class: a `public static void main` that constructs a
// Client against a mock base URL, calls every method across the subtree with
// shared-planner example values (a "with all params" variant when the method
// has optionals), guards empty path params, and dispatches through simple
// throw-on-mismatch assert helpers. It COMPILES + RUNS with plain `java` (a
// JUnit variant is a phase-4 CI concern). Example VALUES come from the shared,
// language-neutral planner (planMethodExample / planExample) so the Java, Go
// and Python suites exercise identical shapes.
import type { Field, Method, NamedType, OpensdkSpecJson, Resource, TypeRef } from '@xyd-js/opensdk-core';
import type { ExampleValue, GeneratedFile, MethodExample } from '@xyd-js/opensdk-framework';
import { planMethodExample } from '@xyd-js/opensdk-framework';

import { constLiteral, isConstField } from './javatype';
import { javaFile } from './javawriter';
import { camelCase, javaMethodName, pascalCase, resourceQualifier, screamingSnakeCase, serviceTypeName } from './naming';
import type { JavaCtx } from './project';

const MOCK_BASE_URL = 'http://localhost:4010';

/** One rendered test: the private-method name (called from main) + its full body. */
interface TestMethod {
  name: string;
  body: string;
}

/**
 * The SDK's OWN test suite: one `<Service>Test` class per top-level resource
 * (covering the whole subtree). Pure: IR in, GeneratedFile[] out.
 */
export function generateJavaTests(spec: OpensdkSpecJson, ctx: JavaCtx): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  for (const resource of spec.resources || []) {
    const file = resourceTestFile(resource, ctx);
    if (file) files.push(file);
  }
  return files;
}

function resourceTestFile(top: Resource, ctx: JavaCtx): GeneratedFile | null {
  const className = `${serviceTypeName([top.name])}Test`;
  const calls: string[] = [];
  const methods: TestMethod[] = [];
  let needsRequireContains = false;

  const walk = (resource: Resource, segments: string[]) => {
    for (const method of resource.methods || []) {
      for (const t of renderMethodTests(segments, method, ctx)) {
        calls.push(`    ${t.name}(client);`);
        methods.push(t);
        if (t.name.endsWith('PathParams')) needsRequireContains = true;
      }
    }
    for (const sub of resource.resources || []) walk(sub, [...segments, sub.name]);
  };
  walk(top, [top.name]);
  if (methods.length === 0) return null;

  const helper = needsRequireContains
    ? `\n\n  private static void requireContains(String actual, String needle) {\n` +
      `    if (actual == null || !actual.contains(needle)) {\n` +
      `      throw new AssertionError("missing substring [" + needle + "] in: " + actual);\n    }\n  }`
    : '';

  const body =
    `/**\n * A dependency-free assertion test for ${serviceTypeName([top.name])} — run with plain \`java ${className}\`.\n */\n` +
    `public final class ${className} {\n` +
    `  private static final String BASE_URL =\n` +
    `      System.getenv().getOrDefault("TEST_API_BASE_URL", ${JSON.stringify(MOCK_BASE_URL)});\n\n` +
    `  public static void main(String[] args) {\n` +
    `    Client client = Client.builder().baseUrl(BASE_URL).apiKey("My API Key").build();\n` +
    `${calls.join('\n')}\n` +
    `    System.out.println(${JSON.stringify(`${className} OK`)});\n` +
    `  }\n\n` +
    `${methods.map((m) => m.body).join('\n\n')}${helper}\n}`;
  return { path: `${ctx.srcDir}${className}.java`, content: javaFile(ctx.fullPackage, [], body) };
}

/** The main test (with-all-params when the method has optionals) plus an optional empty-path-param guard. */
function renderMethodTests(segments: string[], method: Method, ctx: JavaCtx): TestMethod[] {
  const qualifier = resourceQualifier(segments);
  const methodName = javaMethodName(method.action);
  const pascalMethod = pascalCase(methodName);
  const chain = clientChain(segments);
  const constNames = new Set(constBodyFieldNames(method, ctx));

  const required = planMethodExample(method, ctx.types);
  const withOptional = required.hasOptional;
  const example = withOptional ? planMethodExample(method, ctx.types, { withOptional: true }) : required;

  const out: TestMethod[] = [];

  const pathArgs = example.pathArgs.map((pa) => renderJavaExample(pa.value, ctx));
  const params = methodHasParams(method, ctx) ? renderParamsBuilder(segments, method, pascalMethod, example, constNames, ctx) : null;
  const testName = `test${qualifier}${pascalMethod}${withOptional ? 'WithOptionalParams' : ''}`;
  out.push({ name: testName, body: renderMainTest(testName, callExpr(chain, methodName, pathArgs, params)) });

  const guardIdx = (method.pathParams || []).findIndex(
    (p) => p.type?.kind === 'scalar' && p.type.scalar === 'string' && p.required !== false,
  );
  if (guardIdx >= 0) {
    const guardArgs = required.pathArgs.map((pa, i) => (i === guardIdx ? '""' : renderJavaExample(pa.value, ctx)));
    const guardParams = methodHasParams(method, ctx)
      ? renderParamsBuilder(segments, method, pascalMethod, required, constNames, ctx)
      : null;
    const guardName = `test${qualifier}${pascalMethod}PathParams`;
    out.push({ name: guardName, body: renderGuardTest(guardName, methodName, callExpr(chain, methodName, guardArgs, guardParams)) });
  }
  return out;
}

/** A method-call expression `client.pets().list(<args>)` (a multi-line params builder flows after the path args). */
function callExpr(chain: string, methodName: string, pathArgs: string[], params: string | null): string {
  const args = [...pathArgs];
  if (params) args.push(params);
  return `${chain}.${methodName}(${args.join(', ')})`;
}

/** The `${Params}.builder().<setter>(...)....build()` expression, or an empty builder when no fields apply. */
function renderParamsBuilder(
  segments: string[],
  method: Method,
  pascalMethod: string,
  example: MethodExample,
  constNames: Set<string>,
  ctx: JavaCtx,
): string {
  const cls = `${resourceQualifier(segments)}${pascalMethod}Params`;
  const fields = example.fields.filter((f) => !constNames.has(f.name));
  if (fields.length === 0) return `${cls}.builder().build()`;
  const setters = fields.map((f) => `          .${camelCase(f.name)}(${renderJavaExample(f.value, ctx)})`).join('\n');
  return `${cls}.builder()\n${setters}\n          .build()`;
}

/** A standard method test: call the method; an offline transport/HTTP error is acceptable. */
function renderMainTest(name: string, call: string): string {
  return (
    `  private static void ${name}(Client client) {\n` +
    `    try {\n` +
    `      ${call};\n` +
    `    } catch (ApiException expected) {\n` +
    `      // Offline: no mock server answering — a transport/HTTP error is acceptable here.\n` +
    `    }\n  }`
  );
}

/** A guard test: the empty string for a required path param must be rejected before the request is built. */
function renderGuardTest(name: string, methodName: string, call: string): string {
  return (
    `  private static void ${name}(Client client) {\n` +
    `    try {\n` +
    `      ${call};\n` +
    `      throw new AssertionError(${JSON.stringify(`expected a missing required path param error for ${methodName}`)});\n` +
    `    } catch (IllegalArgumentException expected) {\n` +
    `      requireContains(expected.getMessage(), "missing required");\n` +
    `    }\n  }`
  );
}

/** The `client.<accessor>()...` receiver chain — the generated client accessors, exactly. */
function clientChain(segments: string[]): string {
  return `client.${segments.map((s) => `${camelCase(s)}()`).join('.')}`;
}

/** Whether the method carries a params class (mirrors service.ts planParams). */
function methodHasParams(method: Method, ctx: JavaCtx): boolean {
  const body = requestBodyFields(method, ctx.types);
  return body.length > 0 || (method.queryParams?.length ?? 0) > 0 || (method.headerParams?.length ?? 0) > 0;
}

function requestBodyFields(method: Method, types: Map<string, NamedType>): Field[] {
  const ref = method.requestBody?.type as TypeRef | undefined;
  if (ref?.kind === 'ref' && ref.name) {
    const named = types.get(ref.name);
    if (named?.fields) return named.fields;
  }
  return [];
}

/** The const-valued body field names (auto-filled, never a builder input). */
function constBodyFieldNames(method: Method, ctx: JavaCtx): string[] {
  return requestBodyFields(method, ctx.types).filter(isConstField).map((f) => f.name);
}

/** Render a language-neutral example value into a compilable Java expression. */
export function renderJavaExample(value: ExampleValue, ctx: JavaCtx): string {
  switch (value.kind) {
    case 'string':
      return JSON.stringify(value.value);
    case 'integer':
      return `${value.value}L`;
    case 'number':
      return Number.isInteger(value.value) ? `${value.value}.0` : String(value.value);
    case 'boolean':
      return value.value ? 'true' : 'false';
    case 'null':
      return 'null';
    case 'binary':
      return '"Example data".getBytes(java.nio.charset.StandardCharsets.UTF_8)';
    case 'enum':
      return renderEnumConst(value.typeName, value.value, ctx);
    case 'const':
      return constLiteral(value.value);
    case 'array':
      return isRenderableElement(value.item)
        ? `java.util.List.of(${renderJavaExample(value.item, ctx)})`
        : 'java.util.List.of()';
    case 'map':
      return isRenderableElement(value.value)
        ? `java.util.Map.of("key", ${renderJavaExample(value.value, ctx)})`
        : 'java.util.Map.of()';
    // An open union field is typed Object; render its planned variant so a
    // REQUIRED union field (e.g. model: string|enum) gets a non-null value the
    // builder's required-guard accepts (a scalar/enum variant is Object-assignable).
    case 'union':
      return renderJavaExample(value.variant, ctx);
    // A model POJO is decode-only (no builder), but every generated struct has a
    // public no-arg constructor (its own `fromJson` uses `new X()`), so a
    // REQUIRED object-typed field gets a valid non-null instance the builder's
    // required-guard accepts. Falls back to null only for a type with no class.
    case 'object': {
      const named = value.typeName ? ctx.types.get(value.typeName) : undefined;
      return named?.kind === 'struct' ? `new ${pascalCase(value.typeName as string)}()` : 'null';
    }
    case 'any':
      return 'null';
    default:
      return 'null';
  }
}

/** Whether an example element renders to a self-typed literal (safe inside List.of / Map.of). */
function isRenderableElement(value: ExampleValue): boolean {
  return ['string', 'integer', 'number', 'boolean', 'enum', 'const', 'binary'].includes(value.kind);
}

/** The generated Java enum constant for an example enum value (matches model.ts enumMember). */
function renderEnumConst(typeName: string, rawValue: unknown, ctx: JavaCtx): string {
  const named = ctx.types.get(typeName);
  const ev = named?.values?.find((v) => v.value === rawValue);
  const member = screamingSnakeCase(String(ev?.name ?? ev?.value ?? rawValue)) || 'VALUE';
  return `${pascalCase(typeName)}.${member}`;
}
