import type { Field, NamedType, TypeRef } from '@xyd-js/opensdk-core';

import { pascalCase } from './naming';

/** The mapped discriminator of a union (propertyName + non-empty mapping), else null. */
export function unionMapping(type: NamedType): { property: string; mapping: Record<string, string> } | null {
  if (type.kind !== 'union') return null;
  const disc = type.discriminator;
  if (!disc?.propertyName || !disc.mapping || Object.keys(disc.mapping).length === 0) return null;
  return { property: disc.propertyName, mapping: disc.mapping };
}

/** Whether a field's type is a fixed-literal scalar (JSON Schema const / 1-value enum). */
export function isConstField(field: Field): boolean {
  const ref = field.type as TypeRef | undefined;
  return ref?.kind === 'scalar' && ref.const !== undefined;
}

/** The Java literal for a const scalar value (string quoted, number/bool verbatim). */
export function constLiteral(value: unknown): string {
  if (typeof value === 'number') return `${value}L`;
  if (typeof value === 'boolean') return String(value);
  return JSON.stringify(String(value));
}

/**
 * Whether a TypeRef ultimately carries binary bytes (`format: binary`),
 * following array items and named union/alias refs (struct/enum refs are never
 * binary). Mirrors the Python emitter's isBinaryTypeRef — a json-labelled body
 * that hides a binary field must still route through the multipart encoder.
 */
export function isBinaryTypeRef(
  ref: TypeRef | undefined,
  types: Map<string, NamedType>,
  seen: Set<string> = new Set(),
): boolean {
  if (!ref) return false;
  if (ref.kind === 'scalar') return ref.scalar === 'string' && ref.format === 'binary';
  if (ref.kind === 'array') return isBinaryTypeRef(ref.items as TypeRef | undefined, types, seen);
  if (ref.kind === 'ref' && ref.name) {
    if (seen.has(ref.name)) return false;
    seen.add(ref.name);
    const named = types.get(ref.name);
    if (!named) return false;
    if (named.kind === 'union') return (named.variants || []).some((v) => isBinaryTypeRef(v as TypeRef, types, seen));
    if (named.kind === 'alias') return isBinaryTypeRef(named.of as TypeRef | undefined, types, seen);
  }
  return false;
}

/**
 * How a query param serializes, by resolved type shape (mirrors the Go emitter's
 * queryKind): scalar/enum -> single key=value; array -> repeated/comma-joined;
 * map -> deepObject or JSON; struct ref / any -> JSON-encoded.
 */
export type QueryKind = 'scalar' | 'array' | 'map' | 'object';

export function queryKind(ref: TypeRef | undefined, types: Map<string, NamedType>): QueryKind {
  if (!ref) return 'scalar';
  if (ref.kind === 'scalar') return 'scalar';
  if (ref.kind === 'array') return 'array';
  if (ref.kind === 'map') return 'map';
  if (ref.kind === 'ref' && ref.name) {
    const named = types.get(ref.name);
    if (named?.kind === 'enum') return 'scalar';
    if (named?.kind === 'alias') return queryKind(named.of as TypeRef | undefined, types);
    return 'object';
  }
  return 'object';
}

/**
 * Map an IR TypeRef to a Java type expression. Named refs resolve to their
 * generated class name (struct/enum) in the root package; aliases inline their
 * underlying type; unions/unknowns fall back to `Object` (a PHASE-2 seam).
 * Scalars map to boxed builtins so every value is nullable-friendly.
 */
export function javaType(ref: TypeRef | undefined, types: Map<string, NamedType>): string {
  if (!ref) return 'Object';
  switch (ref.kind) {
    case 'scalar':
      return javaScalar(ref.scalar, ref.format);
    case 'array':
      return `List<${javaType(ref.items as TypeRef | undefined, types)}>`;
    case 'map':
      return `Map<String, ${javaType(ref.values as TypeRef | undefined, types)}>`;
    case 'ref':
      return javaRefType(ref.name, types);
    default:
      return 'Object';
  }
}

function javaScalar(scalar: string | undefined, format: string | undefined): string {
  switch (scalar) {
    case 'string':
      return format === 'binary' ? 'byte[]' : 'String';
    case 'integer':
      return 'Long';
    case 'number':
      return 'Double';
    case 'boolean':
      return 'Boolean';
    default:
      return 'Object';
  }
}

function javaRefType(name: string | undefined, types: Map<string, NamedType>): string {
  if (!name) return 'Object';
  const named = types.get(name);
  if (!named) return 'Object'; // unknown placeholder ref -> raw JSON value
  if (named.kind === 'struct' || named.kind === 'enum') return pascalCase(name);
  if (named.kind === 'alias') return javaType(named.of as TypeRef | undefined, types);
  return 'Object'; // union
}

/** Whether a TypeRef is a binary blob (string format=binary) — an upload/download payload. */
export function isBinaryRef(ref: TypeRef | undefined): boolean {
  return ref?.kind === 'scalar' && ref.scalar === 'string' && ref.format === 'binary';
}

/** Whether a ref resolves to a generated class that carries `fromJson`/`toJsonMap` (struct/enum). */
export function isModelRef(ref: TypeRef | undefined, types: Map<string, NamedType>): boolean {
  if (ref?.kind !== 'ref' || !ref.name) return false;
  const named = types.get(ref.name);
  return named?.kind === 'struct' || named?.kind === 'enum';
}

/** The lambda variable for a decode at nesting `depth` — `__e`, `__e1`, `__e2`, ...
 * A nested array/map decode must NOT reuse its enclosing lambda's parameter
 * (Java forbids shadowing a lambda param), so each level gets a distinct name.
 * Depth 0 stays `__e` to keep the single-level (overwhelmingly common) shape. */
function lambdaVar(depth: number): string {
  return depth === 0 ? '__e' : `__e${depth}`;
}

/**
 * A Java expression that decodes a parsed-JSON `Object` (`src`) into the typed
 * value for `ref`. Reused by model `fromJson` and method-return decoding, so
 * both stay in lockstep. Arrays/maps use vendored `Json.mapList`/`mapValues`
 * with a lambda over each element; struct/enum refs call their `fromJson`.
 * `depth` scopes the lambda variable so nested containers don't shadow.
 */
export function javaDecode(ref: TypeRef | undefined, src: string, types: Map<string, NamedType>, depth = 0): string {
  if (!ref) return src;
  switch (ref.kind) {
    case 'scalar':
      return scalarDecode(ref.scalar, ref.format, src);
    case 'array': {
      const v = lambdaVar(depth);
      return `Json.mapList(${src}, ${v} -> ${javaDecode(ref.items as TypeRef | undefined, v, types, depth + 1)})`;
    }
    case 'map': {
      const v = lambdaVar(depth);
      return `Json.mapValues(${src}, ${v} -> ${javaDecode(ref.values as TypeRef | undefined, v, types, depth + 1)})`;
    }
    case 'ref':
      return refDecode(ref.name, src, types);
    default:
      return src;
  }
}

function scalarDecode(scalar: string | undefined, format: string | undefined, src: string): string {
  switch (scalar) {
    case 'string':
      return format === 'binary' ? `Json.asBytes(${src})` : `Json.asString(${src})`;
    case 'integer':
      return `Json.asLong(${src})`;
    case 'number':
      return `Json.asDouble(${src})`;
    case 'boolean':
      return `Json.asBoolean(${src})`;
    default:
      return src;
  }
}

function refDecode(name: string | undefined, src: string, types: Map<string, NamedType>): string {
  if (!name) return src;
  const named = types.get(name);
  if (!named) return src;
  if (named.kind === 'struct' || named.kind === 'enum') return `${pascalCase(name)}.fromJson(${src})`;
  if (named.kind === 'alias') return javaDecode(named.of as TypeRef | undefined, src, types);
  // A mapped discriminated union decodes to its concrete variant via its
  // generated helper class; a mapping-less union keeps the raw parsed value.
  if (named.kind === 'union' && unionMapping(named)) return `${pascalCase(name)}.fromJson(${src})`;
  return src; // open union
}
