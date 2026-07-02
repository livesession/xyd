import type { NamedType, TypeRef } from '@xyd-js/opensdk-core';

import { pascalCase } from './naming';

/**
 * Tracks the model type names a rendered file references, so its `import type`
 * line from `../models` stays minimal (mirrors the Go emitter's Imports and the
 * Python emitter's PyUses trackers).
 */
export class ModelRefs {
  private readonly names = new Set<string>();

  add(name: string): void {
    this.names.add(name);
  }

  /** The referenced model names, sorted for deterministic imports. */
  sorted(): string[] {
    return [...this.names].sort();
  }
}

/**
 * Map an IR TypeRef to a TypeScript type expression. Named refs resolve to their
 * generated interface/type name (recorded on `refs` so the file imports it);
 * scalars map to TS builtins; arrays/maps recurse; binary uploads become a
 * `Uint8Array | Blob` union.
 */
export function nodeType(ref: TypeRef | undefined, refs?: ModelRefs): string {
  if (!ref) return 'unknown';
  const base = nodeBase(ref, refs);
  return ref.nullable ? `${base} | null` : base;
}

function nodeBase(ref: TypeRef, refs?: ModelRefs): string {
  // A `const` scalar renders as a literal type ("circle") so discriminated
  // unions stay TS-narrowable and const body fields type-check to their value.
  if (ref.const !== undefined) return constLiteral(ref.const);
  switch (ref.kind) {
    case 'scalar':
      return nodeScalar(ref.scalar, ref.format);
    case 'ref': {
      if (!ref.name) return 'unknown';
      const name = pascalCase(ref.name);
      refs?.add(name);
      return name;
    }
    case 'array':
      return `${maybeParen(nodeType(ref.items as TypeRef | undefined, refs))}[]`;
    case 'map':
      return `Record<string, ${nodeType(ref.values as TypeRef | undefined, refs)}>`;
    default:
      return 'unknown';
  }
}

/** Parenthesize a union/nullable type before appending `[]` so `A | null` arrays read right. */
function maybeParen(type: string): string {
  return type.includes(' ') ? `(${type})` : type;
}

function nodeScalar(scalar: string | undefined, format: string | undefined): string {
  switch (scalar) {
    case 'string':
      // Upload fields accept raw bytes or a Blob (browser/File also satisfies Blob).
      if (format === 'binary') return 'Uint8Array | Blob';
      return 'string';
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'unknown';
  }
}

/** A const scalar as a TypeScript literal type/value (string quoted, number/bool bare). */
function constLiteral(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return 'unknown';
}

/** Whether a TypeRef is a binary blob (string format=binary) — an upload payload. */
export function isBinaryRef(ref: TypeRef | undefined): boolean {
  return ref?.kind === 'scalar' && ref.scalar === 'string' && ref.format === 'binary';
}

/**
 * Whether a TypeRef ultimately carries binary bytes (`format: binary`), following
 * array items and named union/alias refs (struct/enum refs are never binary). A
 * `seen` set guards recursive unions. Mirrors the Python emitter's isBinaryTypeRef:
 * a json-labelled body that carries a binary field must route through multipart.
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

/** Resolve a request body's fields by following its TypeRef into the symbol table. */
export function bodyFields(ref: TypeRef | undefined, types: Map<string, NamedType>) {
  if (ref?.kind === 'ref' && ref.name) {
    const named = types.get(ref.name);
    if (named?.fields) return named.fields;
  }
  return [];
}
