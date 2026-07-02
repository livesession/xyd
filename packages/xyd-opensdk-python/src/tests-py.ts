import type { Method, NamedType, Param, Resource, TypeRef } from '@xyd-js/opensdk-core';
import { type MethodExample, type PageName, planMethodExample, planOperation } from '@xyd-js/opensdk-framework';

import { renderPyExample } from './example-py';
import { pyPageName } from './method';
import { pascalCase, snakeCase } from './naming';
import { PyUses, pyType } from './pytype';

// The SDK's OWN pytest suite — the artifact openai-python ships
// (tests/api_resources/test_*.py). One tests/test_<resource>.py per top-level
// resource constructs the generated Client (conftest fixture, mock base URL),
// calls every method with shared-planner example values (a required-only case
// plus a "with all params" case when the method has optionals), guards empty
// path params, and structurally checks the response type via assert_matches_type.
// SYNC ONLY — we have no async / raw / streaming client; those are follow-ups.

const DEFAULT_BASE_URL = 'http://127.0.0.1:4010';

/** tests/utils.py — a pragmatic, stdlib-only structural type check. */
export function testUtilsPy(): string {
  return `from __future__ import annotations

import typing
from typing import Any


def assert_matches_type(expected_type: Any, value: Any, *, path: Any = None) -> None:
    """Pragmatic structural check for the generated test suite.

    Verifies the SHAPE of a response without being strict about deep generics:
    dataclass instances, the vendored pagination containers, primitives, lists
    and dicts are all accepted. A parameterized generic (e.g. CursorPage[Pet],
    list[str]) is matched against its ORIGIN only; Any / object / typing
    constructs (Optional, Union, ...) always match.
    """
    origin = typing.get_origin(expected_type)
    if origin is not None:
        expected_type = origin
    if expected_type is Any or expected_type is object or expected_type is None:
        return
    if not isinstance(expected_type, type):
        return
    assert isinstance(value, expected_type), (
        f"expected {getattr(expected_type, '__name__', expected_type)!r}, "
        f"got {type(value).__name__!r} (path={path})"
    )
`;
}

/** tests/conftest.py — the shared `client` fixture against the mock base URL. */
export function testConftestPy(pkg: string): string {
  return `from __future__ import annotations

import os

import pytest

from ${pkg} import Client

base_url = os.environ.get("TEST_API_BASE_URL", ${JSON.stringify(DEFAULT_BASE_URL)})


@pytest.fixture
def client() -> Client:
    return Client(api_key="My API Key", base_url=base_url)
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
 * The type expression asserted against the call result: `bytes` for a binary
 * download, `<Page>[<Item>]` for a paginated list, the primary response type
 * otherwise, or null when the method has no response (no assertion emitted).
 */
function responseTypeExpr(
  method: Method,
  types: Map<string, NamedType>,
  uses: PyUses,
  pages: Set<PageName>,
): string | null {
  const plan = planOperation(method, types);
  if (plan.binaryContentType) return 'bytes';
  const page = pyPageName(plan);
  if (page) {
    pages.add(page);
    return `${page}[${pyType(method.pagination?.itemType as TypeRef | undefined, uses)}]`;
  }
  const primary = method.primaryResponse as TypeRef | undefined;
  if (!primary) return null;
  return pyType(primary, uses);
}

/** Positional path args followed by `name=value` keyword args for one example. */
function renderCallArgs(ex: MethodExample): string {
  const parts = ex.pathArgs.map((pa) => renderPyExample(pa.value));
  for (const f of ex.fields) parts.push(`${snakeCase(f.name)}=${renderPyExample(f.value)}`);
  return parts.join(', ');
}

/** A `def test_...(self, client): result = call; assert_matches_type(...)` block. */
function renderMethodTest(name: string, call: string, responseType: string | null): string {
  const lines = [`    def ${name}(self, client: Client) -> None:`];
  if (responseType) {
    lines.push(`        result = ${call}`);
    lines.push(`        assert_matches_type(${responseType}, result, path=["response"])`);
  } else {
    lines.push(`        ${call}`);
  }
  return lines.join('\n');
}

/** The empty-path-param guard test: an empty target raises ValueError. */
function renderPathParamsTest(name: string, callChain: string, ex: MethodExample, target: Param): string {
  const n = snakeCase(target.name);
  const parts: string[] = [];
  for (const pa of ex.pathArgs) parts.push(pa.param === target ? '""' : renderPyExample(pa.value));
  for (const f of ex.fields) parts.push(`${snakeCase(f.name)}=${renderPyExample(f.value)}`);
  return [
    `    def ${name}(self, client: Client) -> None:`,
    `        with pytest.raises(ValueError, match=r"Expected a non-empty value for \`${n}\` but received ''"):`,
    `            ${callChain}(${parts.join(', ')})`,
  ].join('\n');
}

/** tests/test_<resource>.py for one top-level resource (walks its whole subtree). */
export function resourceTestPy(resource: Resource, pkg: string, types: Map<string, NamedType>): string {
  const uses = new PyUses();
  const pages = new Set<PageName>();
  let usesPytest = false;

  const collected: FlatMethod[] = [];
  collectMethods(resource, [snakeCase(resource.name)], '', collected);

  const blocks: string[] = [];
  for (const { method, chain, namePrefix } of collected) {
    const action = snakeCase(method.action);
    const base = `${namePrefix}${action}`;
    const callChain = `client.${[...chain, action].join('.')}`;
    const responseType = responseTypeExpr(method, types, uses, pages);

    const required = planMethodExample(method, types);
    blocks.push(renderMethodTest(`test_method_${base}`, `${callChain}(${renderCallArgs(required)})`, responseType));

    if (required.hasOptional) {
      const all = planMethodExample(method, types, { withOptional: true });
      blocks.push(
        renderMethodTest(`test_method_${base}_with_all_params`, `${callChain}(${renderCallArgs(all)})`, responseType),
      );
    }

    const target = firstStringPathParam(method);
    if (target) {
      usesPytest = true;
      blocks.push(renderPathParamsTest(`test_path_params_${base}`, callChain, required, target));
    }
  }

  const groups: string[][] = [['from __future__ import annotations']];
  const typingLine = uses.typingImport();
  if (typingLine) groups.push([typingLine]);
  if (usesPytest) groups.push(['import pytest']);
  const local = ['from tests.utils import assert_matches_type', `from ${pkg} import Client`, `from ${pkg}.models import *  # noqa: F401,F403`];
  if (pages.size > 0) {
    const names = (['CursorPage', 'Page'] as const).filter((n) => pages.has(n));
    local.push(`from ${pkg}._pagination import ${names.join(', ')}`);
  }
  groups.push(local);

  const imports = groups.map((g) => g.join('\n')).join('\n\n');
  const body = blocks.length ? blocks.join('\n\n') : '    pass';
  return `${imports}\n\n\nclass Test${pascalCase(resource.name)}:\n${body}\n`;
}
