import type { NamedType, TypeRef } from '@xyd-js/opensdk-core';

import { pascalCase } from './naming';

/**
 * Map an IR TypeRef to a C# type expression. Named refs resolve through the
 * symbol table: struct/enum refs become their PascalCased class/enum name;
 * an ALIAS resolves to its underlying C# type (C# has no namespace-level type
 * alias, so aliases don't get their own class); a UNION maps to `object`
 * (phase-2 seam — discriminated-union modeling is not attempted yet).
 * Scalars map to C# built-ins; arrays -> List<T>; maps -> Dictionary<string, T>.
 */
export function csType(ref: TypeRef | undefined, types: Map<string, NamedType>): string {
  if (!ref) return 'object';
  switch (ref.kind) {
    case 'scalar':
      return csScalar(ref.scalar, ref.format);
    case 'ref': {
      if (!ref.name) return 'object';
      const named = types.get(ref.name);
      if (named?.kind === 'alias') return csType(named.of as TypeRef | undefined, types);
      if (named?.kind === 'union') return 'object';
      return pascalCase(ref.name); // struct / enum (or unknown placeholder -> treated as class)
    }
    case 'array':
      return `List<${csType(ref.items as TypeRef | undefined, types)}>`;
    case 'map':
      return `Dictionary<string, ${csType(ref.values as TypeRef | undefined, types)}>`;
    default:
      return 'object';
  }
}

function csScalar(scalar: string | undefined, format: string | undefined): string {
  switch (scalar) {
    case 'string':
      return format === 'binary' ? 'byte[]' : 'string';
    case 'integer':
      return format === 'int32' ? 'int' : 'long';
    case 'number':
      return format === 'float' ? 'float' : 'double';
    case 'boolean':
      return 'bool';
    default:
      return 'object';
  }
}

/** Wrap a C# type in a nullable (`T?`) unless it already is one. */
export function nullable(type: string): string {
  return type.endsWith('?') ? type : `${type}?`;
}

/** Whether a TypeRef is a binary blob (string format=binary) — an upload/download payload. */
export function isBinaryRef(ref: TypeRef | undefined): boolean {
  return ref?.kind === 'scalar' && ref.scalar === 'string' && ref.format === 'binary';
}

/**
 * Whether a TypeRef ultimately carries binary bytes (`format: binary`), following
 * array items and named union/alias refs (struct/enum refs are never binary). A
 * `seen` set guards recursive unions. Mirrors the Python emitter's isBinaryTypeRef:
 * a json body carrying such a field is routed through the multipart encoder.
 */
export function isBinaryTypeRef(
  ref: TypeRef | undefined,
  types: Map<string, NamedType>,
  seen = new Set<string>(),
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
