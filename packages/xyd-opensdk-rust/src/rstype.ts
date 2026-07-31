import type { TypeRef } from '@xyd-js/opensdk-core';

import { pascalCase } from './naming';

/**
 * Map an IR TypeRef to a Rust type expression (used for model fields, params
 * struct fields and method return types). Named refs render as their PascalCase
 * type name; arrays -> `Vec<T>`; maps -> `HashMap<String, T>`; a `binary`-format
 * scalar -> `Vec<u8>`; anything unclassified -> `serde_json::Value` (which any
 * JSON decodes into without error).
 */
export function rsType(ref: TypeRef | undefined): string {
  if (!ref) return 'serde_json::Value';
  switch (ref.kind) {
    case 'scalar':
      return rsScalar(ref.scalar, ref.format);
    case 'ref':
      return ref.name ? pascalCase(ref.name) : 'serde_json::Value';
    case 'array':
      return `Vec<${rsType(ref.items as TypeRef | undefined)}>`;
    case 'map':
      return `std::collections::HashMap<String, ${rsType(ref.values as TypeRef | undefined)}>`;
    default:
      return 'serde_json::Value';
  }
}

function rsScalar(scalar: string | undefined, format: string | undefined): string {
  if ((format || '').toLowerCase() === 'binary') return 'Vec<u8>';
  switch (scalar) {
    case 'string':
      return 'String';
    case 'integer':
      return format === 'int32' ? 'i32' : 'i64';
    case 'number':
      return format === 'float' ? 'f32' : 'f64';
    case 'boolean':
      return 'bool';
    default:
      return 'serde_json::Value';
  }
}

/** Whether a TypeRef is a `binary`-format scalar (rendered as `Vec<u8>`, sent as a file part). */
export function isBinaryRef(ref: TypeRef | undefined): boolean {
  return ref?.kind === 'scalar' && (ref.format || '').toLowerCase() === 'binary';
}
