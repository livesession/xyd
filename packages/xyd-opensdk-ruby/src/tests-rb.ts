import type { Method, NamedType, OpensdkSpecJson, Param, Resource } from '@xyd-js/opensdk-core';
import { type MethodExample, planMethodExample, planOperation } from '@xyd-js/opensdk-framework';

import { renderRbExample } from './example-rb';
import { pascalCase, rubyGemName, screamingSnakeCase, snakeCase } from './naming';
import type { OpensdkRubyOptions } from './types';

// The generated SDK's OWN test suite (rubyEmitter.generateTests), minitest-shaped
// (stdlib: `require "minitest/autorun"`). One test/test_<resource>.rb per
// top-level resource constructs the generated Client against a mock base URL,
// calls every method with shared-planner example values (a required-only case
// plus a "with all params" case when the method has optionals), guards empty
// path params, and lightly checks the response shape. Example VALUES come from
// the language-neutral planner (planMethodExample / planExample) so the Go,
// Python and Ruby suites exercise identical shapes. Running the suite against a
// mock server is phase 4; these files exist to be syntactically sound (ruby -c).

/** test/test_helper.rb — the shared Client factory bound to a mock base URL. */
export function testHelperRb(moduleName: string, pkg: string): string {
  return `require "minitest/autorun"
require "stringio"
require_relative ${JSON.stringify(`../lib/${pkg}`)}

# Shared setup for the generated SDK test suite: a Client bound to a mock base
# URL (override with TEST_API_BASE_URL). Running the suite against a mock server
# is a follow-up; these tests exist to be syntactically and structurally sound.
module TestHelper
  BASE_URL = ENV.fetch("TEST_API_BASE_URL", "http://localhost:4010")

  def build_client
    ${moduleName}::Client.new(api_key: "My API Key", base_url: BASE_URL)
  end
end
`;
}

/** One collected method: its client accessor chain + a test-name prefix. */
interface FlatMethod {
  method: Method;
  /** Attribute chain from `@client`, e.g. ["videos", "characters"]. */
  chain: string[];
  /** Test-name qualifier for nested resources (empty for a top-level method). */
  namePrefix: string;
}

/** Walk the resource subtree, flattening every method with its client chain. */
function collectMethods(resource: Resource, chain: string[], namePrefix: string, out: FlatMethod[]): void {
  for (const method of resource.methods || []) out.push({ method, chain, namePrefix });
  for (const sub of resource.resources || []) {
    const attr = snakeCase(sub.name);
    collectMethods(sub, [...chain, attr], `${namePrefix}${attr}_`, out);
  }
}

/** The first required string path param of a method (drives the guard test), or null. */
function firstStringPathParam(method: Method): Param | null {
  for (const p of method.pathParams || []) {
    if (p.type?.kind === 'scalar' && p.type.scalar === 'string' && p.required !== false) return p;
  }
  return null;
}

/**
 * The minitest assertion for a call result: `String` for a binary download,
 * `<Module>::Page` for a paginated list, a non-nil check when the method has a
 * response, or null (no assertion) for a response-less method.
 */
function resultAssertion(method: Method, types: Map<string, NamedType>, moduleName: string): string | null {
  const plan = planOperation(method, types);
  if (plan.binaryContentType) return 'assert_instance_of(String, result)';
  if (plan.pageName) return `assert_instance_of(${moduleName}::Page, result)`;
  if (method.primaryResponse) return 'refute_nil(result)';
  return null;
}

/** Positional path args followed by `name: value` keyword args for one example. */
function renderCallArgs(ex: MethodExample): string {
  const parts = ex.pathArgs.map((pa) => renderRbExample(pa.value));
  for (const f of ex.fields) parts.push(`${snakeCase(f.name)}: ${renderRbExample(f.value)}`);
  return parts.join(', ');
}

/** A `def <name>; result = <call>; <assertion>; end` test method (one method-body). */
function renderMethodTest(name: string, call: string, assertion: string | null): string {
  const lines = [`  def ${name}`, '    client = build_client'];
  if (assertion) {
    lines.push(`    result = client.${call}`);
    lines.push(`    ${assertion}`);
  } else {
    lines.push(`    client.${call}`);
  }
  lines.push('  end');
  return lines.join('\n');
}

/** The empty-path-param guard test: an empty target raises ArgumentError. */
function renderPathParamsTest(name: string, chain: string[], action: string, ex: MethodExample, target: Param): string {
  const parts: string[] = [];
  for (const pa of ex.pathArgs) parts.push(pa.param === target ? '""' : renderRbExample(pa.value));
  for (const f of ex.fields) parts.push(`${snakeCase(f.name)}: ${renderRbExample(f.value)}`);
  const call = `client.${[...chain, action].join('.')}(${parts.join(', ')})`;
  return [
    `  def ${name}`,
    '    client = build_client',
    '    assert_raises(ArgumentError) do',
    `      ${call}`,
    '    end',
    '  end',
  ].join('\n');
}

/** test/test_<resource>.rb for one top-level resource (walks its whole subtree). */
export function resourceTestRb(resource: Resource, moduleName: string, types: Map<string, NamedType>): string {
  const collected: FlatMethod[] = [];
  collectMethods(resource, [snakeCase(resource.name)], '', collected);

  const blocks: string[] = [];
  for (const { method, chain, namePrefix } of collected) {
    const action = snakeCase(method.action);
    const base = `${namePrefix}${action}`;
    const callChain = [...chain, action].join('.');
    const assertion = resultAssertion(method, types, moduleName);

    const required = planMethodExample(method, types);
    const requiredArgs = renderCallArgs(required);
    const requiredCall = requiredArgs ? `${callChain}(${requiredArgs})` : callChain;
    blocks.push(renderMethodTest(`test_method_${base}`, requiredCall, assertion));

    if (required.hasOptional) {
      const all = planMethodExample(method, types, { withOptional: true });
      const allArgs = renderCallArgs(all);
      const allCall = allArgs ? `${callChain}(${allArgs})` : callChain;
      blocks.push(renderMethodTest(`test_method_${base}_with_all_params`, allCall, assertion));
    }

    const target = firstStringPathParam(method);
    if (target) {
      blocks.push(renderPathParamsTest(`test_path_params_${base}`, chain, action, required, target));
    }
  }

  const body = blocks.length ? blocks.join('\n\n') : '  # no methods';
  return `require_relative "test_helper"

class Test${pascalCase(resource.name)} < Minitest::Test
  include TestHelper

${body}
end
`;
}

/** The env var the generated client reads its API key from (mirrors emitter.resolveOptions). */
function usageEnvVar(spec: OpensdkSpecJson, pkg: string): string {
  return spec.security?.find((s) => s.envVar)?.envVar ?? `${screamingSnakeCase(pkg)}_API_KEY`;
}

/**
 * A single per-operation USAGE SNIPPET (docs): a self-contained, runnable-looking
 * Ruby example that requires the gem, constructs the client, and makes ONE
 * required-only method call (à la Fern/Speakeasy/Stainless), mirroring the Go
 * emitter's `generateGoUsage` and the Python emitter's `generatePythonUsage`.
 * Reuses the same client attribute-chain builder (snake_case) and the shared
 * example planner (required-only, no `withOptional`) the test suite uses, minus
 * the mock/assert/guard scaffolding. `chain` is the resource-name path
 * (root→owner) the method hangs off.
 */
export function generateRubyUsage(
  method: Method,
  chain: string[],
  spec: OpensdkSpecJson,
  options: OpensdkRubyOptions = {},
): string {
  const pkg = options.packageName ?? rubyGemName(spec.info.title);
  const moduleName = options.moduleName ?? pascalCase(spec.info.title);
  const envVar = usageEnvVar(spec, pkg);

  const types = new Map((spec.types || []).map((t) => [t.name, t]));
  const attrs = chain.map((s) => snakeCase(s));
  const action = snakeCase(method.action);
  const callChain = `client.${[...attrs, action].join('.')}`;

  // A doc usage snippet: ALL fields with realistic (spec example/default) values.
  const example = planMethodExample(method, types, { realistic: true, withOptional: true });
  const args = renderCallArgs(example);
  const call = args ? `${callChain}(${args})` : callChain;

  // Capture + print the result only when the method returns one (binary
  // download, paginated list, or a primary response) — mirrors resultAssertion.
  const op = planOperation(method, types);
  const hasResult = op.binaryContentType != null || op.pageName != null || method.primaryResponse != null;

  // Client construction: normally the default base URL. When the caller sets
  // `baseUrlEnv` (the snippet-run tier), also read the base URL from that env var
  // so the snippet can target a recording server. Only alters output when set —
  // default snippet output stays byte-identical.
  const clientArgs = [`api_key: ENV[${JSON.stringify(envVar)}]`];
  if (options.baseUrlEnv) {
    clientArgs.push(`base_url: ENV[${JSON.stringify(options.baseUrlEnv)}]`);
  }
  const clientLine = `client = ${moduleName}::Client.new(${clientArgs.join(', ')})`;

  const lines = [`require ${JSON.stringify(pkg)}`, ``, clientLine, ``];
  if (hasResult) {
    lines.push(`result = ${call}`);
    lines.push(`pp result`);
  } else {
    lines.push(call);
  }
  return `${lines.join('\n')}\n`;
}
