import type { Method, NamedType, Param, Resource } from '@xyd-js/opensdk-core';
import { type MethodExample, planMethodExample } from '@xyd-js/opensdk-framework';

import { renderRsExample } from './example-rs';
import { snakeCase } from './naming';
import { methodHasParams, paramsStructName, resourceClassName } from './service';

// The generated SDK's OWN test suite (rustEmitter.generateTests). One
// tests/<resource>.rs per top-level resource constructs the Client against a
// mock base URL (tests/common/mod.rs), calls every method with shared-planner
// example values (a required-only case + a "with all params" case when the
// method has optionals), and guards empty path params. Example VALUES come from
// the language-neutral planner (planMethodExample) so the Go/Python/Ruby/Rust
// suites exercise identical shapes. The suite runs green against a MockServer in
// the e2e harness (E2E_SDK_TESTS=1).

/** tests/common/mod.rs — the shared Client factory bound to a mock base URL. */
export function commonModRs(crate: string): string {
  return `#![allow(dead_code, unused_imports)]

/// A Client bound to a mock base URL (override with TEST_API_BASE_URL).
pub fn build_client() -> ${crate}::Client {
    let base_url = std::env::var("TEST_API_BASE_URL").unwrap_or_else(|_| "http://localhost:4010".to_string());
    ${crate}::Client::builder()
        .api_key("My API Key")
        .base_url(base_url)
        .build()
}
`;
}

interface Collected {
  method: Method;
  /** Resource names from the root to the owning resource, e.g. ["videos","characters"]. */
  segments: string[];
}

function collectMethods(resource: Resource, segments: string[], out: Collected[]): void {
  for (const method of resource.methods || []) out.push({ method, segments });
  for (const sub of resource.resources || []) collectMethods(sub, [...segments, sub.name], out);
}

/** The first required string path param of a method (drives the guard test), or null. */
function firstStringPathParam(method: Method): Param | null {
  for (const p of method.pathParams || []) {
    if (p.type?.kind === 'scalar' && p.type.scalar === 'string' && p.required !== false) return p;
  }
  return null;
}

/** The accessor chain from `client`, e.g. `client.pets().inventory()`. */
function chainCall(segments: string[]): string {
  return `client.${segments.map((s) => `${snakeCase(s)}()`).join('.')}`;
}

/** Test-name qualifier for nested resources (empty for a top-level method). */
function namePrefix(segments: string[]): string {
  return segments
    .slice(1)
    .map((s) => `${snakeCase(s)}_`)
    .join('');
}

/** The params-struct literal for one example (or `::default()` when it has no fields). */
function paramsLiteral(name: string, ex: MethodExample, types: Map<string, NamedType>): string {
  if (ex.fields.length === 0) return `${name}::default()`;
  const rows = ex.fields.map((f) => `${snakeCase(f.name)}: Some(${renderRsExample(f.value, types, true)})`);
  return `${name} { ${rows.join(', ')}, ..Default::default() }`;
}

/** Positional path args (borrowed), then the params struct literal when present. */
function callArgs(method: Method, cls: string, ex: MethodExample, types: Map<string, NamedType>): string {
  const parts = ex.pathArgs.map((pa) => renderRsExample(pa.value, types, false));
  if (methodHasParams(method, types)) parts.push(paramsLiteral(paramsStructName(cls, method.action), ex, types));
  return parts.join(', ');
}

/** The guard-call args: the target path param forced empty, others as examples. */
function guardArgs(method: Method, cls: string, ex: MethodExample, target: Param, types: Map<string, NamedType>): string {
  const parts = ex.pathArgs.map((pa) => (pa.param === target ? '""' : renderRsExample(pa.value, types, false)));
  if (methodHasParams(method, types)) parts.push(paramsLiteral(paramsStructName(cls, method.action), ex, types));
  return parts.join(', ');
}

/** tests/<resource>.rs for one top-level resource (walks its whole subtree). */
export function resourceTestRs(resource: Resource, crate: string, types: Map<string, NamedType>): string {
  const collected: Collected[] = [];
  collectMethods(resource, [resource.name], collected);

  const blocks: string[] = [];
  for (const { method, segments } of collected) {
    const cls = resourceClassName(segments);
    const chain = chainCall(segments);
    const action = snakeCase(method.action);
    const base = `${namePrefix(segments)}${action}`;

    const required = planMethodExample(method, types);
    blocks.push(methodTest(`test_method_${base}`, `${chain}.${action}(${callArgs(method, cls, required, types)})`));

    if (required.hasOptional) {
      const all = planMethodExample(method, types, { withOptional: true });
      blocks.push(
        methodTest(`test_method_${base}_with_all_params`, `${chain}.${action}(${callArgs(method, cls, all, types)})`),
      );
    }

    const target = firstStringPathParam(method);
    if (target) {
      blocks.push(guardTest(`test_path_params_${base}`, `${chain}.${action}(${guardArgs(method, cls, required, target, types)})`));
    }
  }

  const body = blocks.length ? blocks.join('\n\n') : '// no methods';
  return `#![allow(dead_code, unused_imports)]
mod common;

use common::build_client;
use ${crate}::*;

${body}
`;
}

/** A `#[tokio::test]` that invokes a method and `?`-propagates any error. */
function methodTest(name: string, call: string): string {
  return `#[tokio::test]
async fn ${name}() -> Result<(), Box<dyn std::error::Error>> {
    let client = build_client();
    let _ = ${call}.await?;
    Ok(())
}`;
}

/** A `#[tokio::test]` asserting an empty required path param is rejected. */
function guardTest(name: string, call: string): string {
  return `#[tokio::test]
async fn ${name}() {
    let client = build_client();
    let error = ${call}.await.unwrap_err();
    assert!(matches!(error, Error::InvalidArgument(_)));
}`;
}
