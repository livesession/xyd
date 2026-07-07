import type { Method, Param, Resource } from '@xyd-js/opensdk-core';
import { type MethodExample, type OperationPlan, planMethodExample, planOperation } from '@xyd-js/opensdk-framework';

import { renderNodeExample } from './example-node';
import { propKey } from './model';
import { camelCase, nodeMethodName } from './naming';
import type { NodeCtx } from './resource';

// The SDK's OWN test suite — the artifact openai-node ships (tests/api-resources/*).
// One tests/<resource>.test.ts per top-level resource constructs the generated
// Client (against a mock fetch), calls every method with shared-planner example
// values (a required-only case plus a "with all params" case when the method has
// optionals), and guards empty path params. Built on the stdlib `node:test` +
// `node:assert` so it needs no external runner; a tiny ambient shim keeps it
// @types/node-free so it type-checks with only the DOM lib.

/** tsconfig.test.json — type-check src + the generated tests in one pass (keeps `tsc` build src-only). */
export function testTsconfig(): string {
  const config = {
    extends: './tsconfig.json',
    compilerOptions: { noEmit: true },
    include: ['src', 'tests'],
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}

/** tests/_shims.d.ts — minimal ambient decls for the stdlib test modules (no @types/node needed). */
export function tsNodeShims(): string {
  return `declare module 'node:test' {
  interface TestContext {
    skip(message?: string): void;
  }
  export function test(name: string, fn: (t: TestContext) => void | Promise<void>): void;
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: (t: TestContext) => void | Promise<void>): void;
}

declare module 'node:assert' {
  interface AssertFn {
    (value: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    rejects(
      block: (() => Promise<unknown>) | Promise<unknown>,
      error?: RegExp | ((err: unknown) => boolean),
      message?: string,
    ): Promise<void>;
    throws(block: () => unknown, error?: RegExp | ((err: unknown) => boolean), message?: string): void;
  }
  const assert: AssertFn;
  export default assert;
}
`;
}

/** tests/setup.ts — the shared client (pointed at the mock base URL) + a server probe + a structural check. */
export function testSetupFile(clientName: string, defaultExport: boolean): string {
  // Bind the client to a local `Client` so the rest of the suite is export-shape
  // agnostic (default import, or a named import aliased).
  const importLine = defaultExport
    ? `import Client from '../src/index';`
    : `import { ${clientName} as Client } from '../src/index';`;
  return `import assert from 'node:assert';

${importLine}

/** The spec-shaped mock base URL the generated suite runs against (openai-node's TEST_API_BASE_URL). */
const baseURL = readEnv('TEST_API_BASE_URL') ?? 'http://127.0.0.1:4010';

/** Read an env var without a hard \`@types/node\` dependency (DOM lib only). */
function readEnv(name: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.[name];
}

/** A Client pointed at the mock base URL, using the platform \`fetch\`. */
export function testClient(): Client {
  return new Client({ apiKey: 'My API Key', baseURL });
}

/** Probe the mock server; a \`false\` skips the test (offline / no mock server). */
export async function checkTestServer(): Promise<boolean> {
  try {
    await fetch(baseURL);
    return true;
  } catch {
    return false;
  }
}

/** Pragmatic structural check: a method result (model, page container or raw Response) is present. */
export function assertMatchesType(value: unknown): void {
  assert.ok(value !== undefined && value !== null, 'expected a response');
}
`;
}

/** One collected method: its client accessor chain + a test-name prefix. */
interface FlatMethod {
  method: Method;
  /** Attribute chain from `client`, e.g. ["videos", "characters"]. */
  chain: string[];
  /** Test-name qualifier for nested resources (empty for a top-level method). */
  namePrefix: string;
}

/** Walk the resource subtree, flattening every method with its client chain. */
function collectMethods(resource: Resource, chain: string[], namePrefix: string, out: FlatMethod[]): void {
  for (const method of resource.methods || []) out.push({ method, chain, namePrefix });
  for (const sub of resource.resources || []) {
    const attr = camelCase(sub.name);
    collectMethods(sub, [...chain, attr], `${namePrefix}${attr}.`, out);
  }
}

/** The first required string path param of a method (drives the guard test), or null. */
function firstStringPathParam(method: Method): Param | null {
  for (const p of method.pathParams || []) {
    if (p.type?.kind === 'scalar' && p.type.scalar === 'string' && p.required !== false) return p;
  }
  return null;
}

/** Whether the method has a response worth asserting (binary, page, or a primary type). */
function hasResponse(op: OperationPlan): boolean {
  return op.binaryContentType !== null || op.pageName !== null || op.primaryResponse !== 'none';
}

/**
 * Whether the method's single params argument is REQUIRED (non-`?`) in the emitted
 * signature — the same rule the resource emitter uses. When it is, a required-only
 * example with no fields still needs an explicit `{}` so the call type-checks.
 */
function paramsRequired(op: OperationPlan): boolean {
  const query = op.paramGroups.query;
  const header = op.paramGroups.header;
  if (op.hasBody) return op.bodyRequired;
  return query.some((p) => p.required) || header.some((p) => p.required);
}

/** The params object literal for an example's fields, or `{}` when a required arg has no fields. */
function paramsObject(ex: MethodExample, requiredArg: boolean): string | null {
  if (ex.fields.length) {
    return `{ ${ex.fields.map((f) => `${propKey(f.name)}: ${renderNodeExample(f.value)}`).join(', ')} }`;
  }
  return requiredArg ? '{}' : null;
}

/** Positional path args followed by a single params object literal for one example. */
function renderCallArgs(ex: MethodExample, requiredArg: boolean): string {
  const parts = ex.pathArgs.map((pa) => renderNodeExample(pa.value));
  const params = paramsObject(ex, requiredArg);
  if (params) parts.push(params);
  return parts.join(', ');
}

/** The same call args but with the guarded path param replaced by an empty string. */
function renderGuardArgs(ex: MethodExample, target: Param, requiredArg: boolean): string {
  const parts = ex.pathArgs.map((pa) => (pa.param === target ? '""' : renderNodeExample(pa.value)));
  const params = paramsObject(ex, requiredArg);
  if (params) parts.push(params);
  return parts.join(', ');
}

/** A `test("...", async (t) => { ... })` block invoking one method against the mock (skips when it is down). */
function renderMethodTest(name: string, call: string, assertable: boolean): string {
  const lines = [
    `test(${JSON.stringify(name)}, async (t) => {`,
    '  if (!(await checkTestServer())) return t.skip();',
    '  const client = testClient();',
  ];
  if (assertable) {
    lines.push(`  const result = await ${call};`, '  assertMatchesType(result);');
  } else {
    lines.push(`  await ${call};`);
  }
  lines.push('});');
  return lines.join('\n');
}

/**
 * The empty-path-param guard test: an empty target throws the guard message. The
 * resource method guards its path params SYNCHRONOUSLY (it is not `async` — it
 * returns the client's request promise), so the throw is synchronous and the test
 * asserts with `assert.throws` (Node's `assert.rejects` does not convert a
 * synchronous throw into a rejection).
 */
function renderPathParamsTest(
  name: string,
  callChain: string,
  ex: MethodExample,
  target: Param,
  requiredArg: boolean,
): string {
  return [
    `test(${JSON.stringify(name)}, () => {`,
    '  const client = testClient();',
    `  assert.throws(() => ${callChain}(${renderGuardArgs(ex, target, requiredArg)}), /missing required ${target.name} parameter/);`,
    '});',
  ].join('\n');
}

/** tests/<resource>.test.ts for one top-level resource (walks its whole subtree). */
export function renderResourceTestFile(resource: Resource, ctx: NodeCtx): string {
  const collected: FlatMethod[] = [];
  collectMethods(resource, [camelCase(resource.name)], '', collected);

  const blocks: string[] = [];
  let usesAssert = false;
  for (const { method, chain, namePrefix } of collected) {
    const action = nodeMethodName(method.action);
    const label = `${namePrefix}${action}`;
    const callChain = `client.${[...chain, action].join('.')}`;
    const op = planOperation(method, ctx.types);
    const assertable = hasResponse(op);
    const requiredArg = paramsRequired(op);

    const required = planMethodExample(method, ctx.types);
    blocks.push(
      renderMethodTest(`${label} (method)`, `${callChain}(${renderCallArgs(required, requiredArg)})`, assertable),
    );

    if (required.hasOptional) {
      const all = planMethodExample(method, ctx.types, { withOptional: true });
      blocks.push(
        renderMethodTest(`${label} (method, all params)`, `${callChain}(${renderCallArgs(all, requiredArg)})`, assertable),
      );
    }

    const target = firstStringPathParam(method);
    if (target) {
      usesAssert = true;
      blocks.push(renderPathParamsTest(`${label} (path params)`, callChain, required, target, requiredArg));
    }
  }

  const importLines = [`import { test } from 'node:test';`];
  if (usesAssert) importLines.push(`import assert from 'node:assert';`);
  importLines.push('', `import { assertMatchesType, checkTestServer, testClient } from './setup';`);
  const imports = importLines.join('\n');
  const body = blocks.length ? blocks.join('\n\n') : 'test("noop", () => {});';
  return `${imports}\n\n${body}\n`;
}
