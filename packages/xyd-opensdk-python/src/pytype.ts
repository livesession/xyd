import type { TypeRef } from '@xyd-js/opensdk-core';

import { pascalCase } from './naming';

/**
 * Records which `typing` names a rendered file actually uses so the generated
 * import line stays minimal (mirrors the Go emitter's Imports tracker).
 */
export class PyUses {
  private readonly typing = new Set<string>();

  use(name: string): void {
    this.typing.add(name);
  }

  /** The `from typing import ...` line, or null when nothing is used. */
  typingImport(): string | null {
    if (this.typing.size === 0) return null;
    const order = ['Any', 'BinaryIO', 'Optional', 'Union'];
    return `from typing import ${order.filter((n) => this.typing.has(n)).join(', ')}`;
  }
}

/**
 * Map an IR TypeRef to a Python type expression (PEP 585 builtin generics:
 * list[T] / dict[str, T]). Every returned expression is ALSO a valid runtime
 * value, so generated code can hand it to the transport's `decode()`.
 */
export function pyType(ref: TypeRef | undefined, uses: PyUses): string {
  if (!ref) return anyType(uses);
  const base = pyBase(ref, uses);
  return ref.nullable ? optionalize(base, uses) : base;
}

function pyBase(ref: TypeRef, uses: PyUses): string {
  switch (ref.kind) {
    case 'scalar':
      return pyScalar(ref.scalar, ref.format, uses);
    case 'ref':
      return ref.name ? pascalCase(ref.name) : anyType(uses);
    case 'array':
      return `list[${pyType(ref.items as TypeRef | undefined, uses)}]`;
    case 'map':
      return `dict[str, ${pyType(ref.values as TypeRef | undefined, uses)}]`;
    default:
      return anyType(uses);
  }
}

function pyScalar(scalar: string | undefined, format: string | undefined, uses: PyUses): string {
  switch (scalar) {
    case 'string':
      if (format === 'binary') {
        // Upload fields accept raw bytes or an open file-like object.
        uses.use('Union');
        uses.use('BinaryIO');
        return 'Union[bytes, BinaryIO]';
      }
      return 'str';
    case 'integer':
      return 'int';
    case 'number':
      return 'float';
    case 'boolean':
      return 'bool';
    default:
      return anyType(uses);
  }
}

function anyType(uses: PyUses): string {
  uses.use('Any');
  return 'Any';
}

/** Wrap a type in Optional[...] unless it already is. */
export function optionalize(type: string, uses: PyUses): string {
  if (type.startsWith('Optional[')) return type;
  uses.use('Optional');
  return `Optional[${type}]`;
}

/** Type expressions `decode()` can't refine — methods return the raw JSON as-is. */
export function isPassthroughType(type: string): boolean {
  return type === 'Any' || type === 'str' || type === 'int' || type === 'float' || type === 'bool';
}
