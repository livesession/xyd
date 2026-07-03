import type { TypeRef } from '@xyd-js/opensdk-core';

import { pascalCase } from './naming';

/**
 * Map an IR TypeRef to a YARD documentation type string (used only in `@param`
 * / `@return` comments — Ruby is duck-typed, so the emitted code never depends
 * on these). Named refs render under the `Models::` namespace so the doc links
 * resolve, scalars map to Ruby builtins, arrays/maps recurse.
 */
export function rbDocType(ref: TypeRef | undefined): string {
  if (!ref) return 'Object';
  switch (ref.kind) {
    case 'scalar':
      return rbScalar(ref.scalar, ref.format);
    case 'ref':
      return ref.name ? `Models::${pascalCase(ref.name)}` : 'Object';
    case 'array':
      return `Array<${rbDocType(ref.items as TypeRef | undefined)}>`;
    case 'map':
      return `Hash{String => ${rbDocType(ref.values as TypeRef | undefined)}}`;
    default:
      return 'Object';
  }
}

function rbScalar(scalar: string | undefined, format: string | undefined): string {
  switch (scalar) {
    case 'string':
      return format === 'binary' ? 'IO, String' : 'String';
    case 'integer':
      return 'Integer';
    case 'number':
      return 'Float';
    case 'boolean':
      return 'Boolean';
    default:
      return 'Object';
  }
}
