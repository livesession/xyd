import type { TypeRef } from '@xyd-js/opensdk-core';

import { pascalCase } from './naming';

/**
 * Map an IR TypeRef to a Go type expression. Named refs resolve to their Go type
 * name in the root package; scalars map to Go builtins; arrays/maps recurse.
 */
export function goType(ref: TypeRef | undefined): string {
  if (!ref) return 'any';
  switch (ref.kind) {
    case 'scalar':
      return goScalar(ref.scalar, ref.format);
    case 'ref':
      return ref.name ? pascalCase(ref.name) : 'any';
    case 'array':
      return `[]${goType(ref.items as TypeRef | undefined)}`;
    case 'map':
      return `map[string]${goType(ref.values as TypeRef | undefined)}`;
    default:
      return 'any';
  }
}

function goScalar(scalar: string | undefined, format: string | undefined): string {
  switch (scalar) {
    case 'string':
      return 'string';
    case 'integer':
      return format === 'int32' ? 'int32' : 'int64';
    case 'number':
      return format === 'float' ? 'float32' : 'float64';
    case 'boolean':
      return 'bool';
    default:
      return 'any';
  }
}

/** Whether a TypeRef maps to a plain Go scalar (usable as a `param.Opt[T]` element). */
export function isScalarRef(ref: TypeRef | undefined): boolean {
  return ref?.kind === 'scalar';
}

/** Whether a TypeRef is a binary blob (string format=binary) — an upload payload. */
export function isBinaryRef(ref: TypeRef | undefined): boolean {
  return ref?.kind === 'scalar' && ref.scalar === 'string' && ref.format === 'binary';
}
