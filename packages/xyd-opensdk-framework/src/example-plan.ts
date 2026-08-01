// Shared example-value planner for the generated SDK test suites (generateTests).
// It turns a TypeRef into a language-NEUTRAL example tree; each emitter renders
// that tree in its own syntax (Go composite literals, Python kwargs). This keeps
// "what a realistic example value is" in one place — the same way planOperation
// centralizes request semantics — so the Go and Python test suites exercise the
// SAME shapes and can never drift.
import type { Method, NamedType, Param, TypeRef } from '@xyd-js/opensdk-core';

/** A language-neutral example value; emitters render it to their own syntax. */
export type ExampleValue =
  | { kind: 'string'; value: string }
  | { kind: 'integer'; value: number }
  | { kind: 'number'; value: number }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'null' }
  | { kind: 'binary' }
  | { kind: 'enum'; typeName: string; value: unknown }
  | { kind: 'const'; value: unknown }
  | { kind: 'array'; item: ExampleValue }
  | { kind: 'map'; value: ExampleValue }
  | { kind: 'object'; typeName?: string; fields: ExampleField[] }
  | { kind: 'union'; typeName: string; variant: ExampleValue }
  | { kind: 'any' };

/** One example field of an object/params example. */
export interface ExampleField {
  name: string;
  value: ExampleValue;
  required: boolean;
}

export interface PlanExampleOptions {
  /** Include optional struct fields (the "with all params" / "WithOptionalParams" example). */
  withOptional?: boolean;
  /** Example text for a bare string scalar at THIS level (not propagated into nested types). */
  stringHint?: string;
  /**
   * Prefer the spec's own `example`/`default` values and emit format-aware scalar
   * samples (date-time, uuid, email, ...) instead of the neutral `0`/`'x'`. OFF by
   * default so the generated SDK TEST goldens + MockServer responses stay stable;
   * only the doc USAGE snippets (`generateUsage`) opt in.
   */
  realistic?: boolean;
}

/** The example call for one method — everything a test needs to invoke it. */
export interface MethodExample {
  /** Positional path arguments, in path order (each with its source param). */
  pathArgs: { param: Param; value: ExampleValue }[];
  /** Params-struct / keyword fields: query ∪ header ∪ request-body fields. */
  fields: ExampleField[];
  /** True when any non-required field exists — drives the "with all params" variant. */
  hasOptional: boolean;
}

const MAX_DEPTH = 6;

/**
 * Resolve a TypeRef to an example value, expanding named types via the symbol
 * table. Cycle-guarded (a type currently being expanded yields a terminal empty
 * object) and depth-capped so deeply/recursively nested schemas stay finite.
 */
export function planExample(
  ref: TypeRef | undefined,
  types: Map<string, NamedType>,
  opts: PlanExampleOptions = {},
  seen: Set<string> = new Set(),
  depth = 0,
): ExampleValue {
  if (!ref || depth > MAX_DEPTH) return { kind: 'any' };

  if (ref.const !== undefined) return { kind: 'const', value: ref.const };

  switch (ref.kind) {
    case 'scalar':
      return scalarExample(ref, opts.stringHint, opts.realistic);
    case 'array':
      return { kind: 'array', item: planExample(ref.items as TypeRef, types, dropHint(opts), seen, depth + 1) };
    case 'map':
      return { kind: 'map', value: planExample(ref.values as TypeRef, types, dropHint(opts), seen, depth + 1) };
    case 'any':
      return { kind: 'any' };
    case 'ref':
      return refExample(ref, types, opts, seen, depth);
    default:
      return { kind: 'any' };
  }
}

function scalarExample(ref: TypeRef, stringHint?: string, realistic?: boolean): ExampleValue {
  const fmt = (ref.format || '').toLowerCase();
  if (fmt === 'binary') return { kind: 'binary' };
  switch (ref.scalar) {
    case 'integer':
      return { kind: 'integer', value: realistic ? 1 : 0 };
    case 'number':
      return { kind: 'number', value: realistic ? 1 : 0 };
    case 'boolean':
      return { kind: 'boolean', value: true };
    default:
      return { kind: 'string', value: realistic ? realisticString(fmt, stringHint) : (stringHint ?? 'x') };
  }
}

/** A believable string sample for a known `format`, else the hint (a param name
 * reads well, e.g. `After: "after"`) or a neutral `"string"`. `realistic` only. */
function realisticString(fmt: string, hint?: string): string {
  switch (fmt) {
    case 'date-time':
      return '2024-01-01T00:00:00Z';
    case 'date':
      return '2024-01-01';
    case 'email':
      return 'user@example.com';
    case 'uri':
    case 'url':
      return 'https://example.com';
    case 'uuid':
      return '123e4567-e89b-12d3-a456-426614174000';
    case 'hostname':
      return 'example.com';
    case 'ipv4':
      return '192.0.2.1';
    default:
      return hint ?? 'string';
  }
}

/**
 * Coerce a spec `example`/`default` JSON literal into a neutral ExampleValue —
 * ONLY for scalar/scalar-array shapes (a struct/enum/union literal would need the
 * type to render correctly, so we return undefined and let planExample walk the
 * type). Returns undefined when it can't safely coerce.
 */
function literalToExample(value: unknown): ExampleValue | undefined {
  switch (typeof value) {
    case 'string':
      return { kind: 'string', value };
    case 'boolean':
      return { kind: 'boolean', value };
    case 'number':
      return Number.isInteger(value) ? { kind: 'integer', value } : { kind: 'number', value };
  }
  if (value === null) return { kind: 'null' };
  if (Array.isArray(value) && value.length) {
    const item = literalToExample(value[0]);
    if (item) return { kind: 'array', item };
  }
  return undefined;
}

/** Under `realistic`, the spec's own example/default for a scalar/array-typed
 * param or field (skips ref types — enum/struct/union render from the type).
 * Exported so re-planning emitters (Go, .NET, which walk fields via `planExample`
 * rather than `planMethodExample.fields`) can honor spec example/default too. */
export function realisticLiteral(type: TypeRef | undefined, ...candidates: unknown[]): ExampleValue | undefined {
  if (!type || (type.kind !== 'scalar' && type.kind !== 'array')) return undefined;
  for (const candidate of candidates) {
    if (candidate === undefined) continue;
    const example = literalToExample(candidate);
    if (example) return example;
  }
  return undefined;
}

function refExample(
  ref: TypeRef,
  types: Map<string, NamedType>,
  opts: PlanExampleOptions,
  seen: Set<string>,
  depth: number,
): ExampleValue {
  const name = ref.name;
  const named = name ? types.get(name) : undefined;
  if (!named || !name) return { kind: 'any' };

  // cycle guard: a self/mutually-referential struct yields a terminal example
  if (seen.has(name)) return { kind: 'object', typeName: name, fields: [] };

  switch (named.kind) {
    case 'enum': {
      const first = named.values?.[0];
      return { kind: 'enum', typeName: name, value: first ? first.value : '' };
    }
    case 'alias':
      return planExample(named.of as TypeRef, types, dropHint(opts), seen, depth + 1);
    case 'union': {
      const variant = (named.variants || [])[0] as TypeRef | undefined;
      const nested = new Set(seen).add(name);
      return { kind: 'union', typeName: name, variant: planExample(variant, types, dropHint(opts), nested, depth + 1) };
    }
    default: {
      // struct: fill required fields; optional too when withOptional
      const nested = new Set(seen).add(name);
      const fields = exampleFields(named.fields || [], types, opts, nested, depth + 1);
      return { kind: 'object', typeName: name, fields };
    }
  }
}

/** Example fields for a struct's field list; required-first, optionals only when withOptional. */
export function exampleFields(
  fields: { name: string; type: TypeRef; required?: boolean; default?: unknown }[],
  types: Map<string, NamedType>,
  opts: PlanExampleOptions,
  seen: Set<string> = new Set(),
  depth = 0,
): ExampleField[] {
  const out: ExampleField[] = [];
  const wanted = fields.filter((f) => f.required || opts.withOptional);
  // required first, then optional — deterministic, readable literals
  wanted.sort((a, b) => Number(!!b.required) - Number(!!a.required));
  const nested: PlanExampleOptions = { withOptional: opts.withOptional, realistic: opts.realistic };
  for (const f of wanted) {
    // Field carries only `default` (no `example`); prefer it under `realistic`.
    const value =
      (opts.realistic ? realisticLiteral(f.type, f.default) : undefined) ??
      planExample(f.type, types, nested, seen, depth);
    out.push({ name: f.name, required: !!f.required, value });
  }
  return out;
}

/** Drop the per-level stringHint before recursing into nested types (keep withOptional + realistic). */
function dropHint(opts: PlanExampleOptions): PlanExampleOptions {
  return opts.stringHint === undefined ? opts : { withOptional: opts.withOptional, realistic: opts.realistic };
}

/**
 * The example call for a method: positional path args + the params-struct /
 * keyword fields (query ∪ header ∪ request-body fields). Path/query/header
 * string examples use the param name (readable, non-empty like openai-go's
 * `After: "after"`); nested body strings default to "x".
 */
export function planMethodExample(
  method: Method,
  types: Map<string, NamedType>,
  opts: { withOptional?: boolean; realistic?: boolean } = {},
): MethodExample {
  const withOptional = !!opts.withOptional;
  const realistic = !!opts.realistic;

  const pathArgs = (method.pathParams || []).map((param) => ({
    param,
    value:
      (realistic ? realisticLiteral(param.type as TypeRef, param.example, param.default) : undefined) ??
      planExample(param.type as TypeRef, types, { stringHint: param.name, realistic }),
  }));

  const fields: ExampleField[] = [];
  const addParam = (p: Param) => {
    if (!p.required && !withOptional) return;
    fields.push({
      name: p.name,
      required: !!p.required,
      // A param carries both `example` and `default`; prefer them under `realistic`.
      value:
        (realistic ? realisticLiteral(p.type as TypeRef, p.example, p.default) : undefined) ??
        planExample(p.type as TypeRef, types, { withOptional, stringHint: p.name, realistic }),
    });
  };
  for (const p of method.queryParams || []) addParam(p);
  for (const p of method.headerParams || []) addParam(p);

  // request body: flatten its struct fields into the params struct / kwargs
  const bodyRef = method.requestBody?.type as TypeRef | undefined;
  if (bodyRef?.kind === 'ref' && bodyRef.name) {
    const named = types.get(bodyRef.name);
    if (named?.kind === 'struct') {
      for (const f of exampleFields(named.fields || [], types, { withOptional, realistic })) fields.push(f);
    }
  }

  // required-first for stable, readable output
  fields.sort((a, b) => Number(b.required) - Number(a.required));

  const hasOptional =
    (method.queryParams || []).some((p) => !p.required) ||
    (method.headerParams || []).some((p) => !p.required) ||
    bodyHasOptional(bodyRef, types);

  return { pathArgs, fields, hasOptional };
}

function bodyHasOptional(bodyRef: TypeRef | undefined, types: Map<string, NamedType>): boolean {
  if (bodyRef?.kind !== 'ref' || !bodyRef.name) return false;
  const named = types.get(bodyRef.name);
  return !!named?.fields?.some((f) => !f.required);
}
