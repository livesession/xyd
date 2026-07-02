import type { EnumValue, NamedType, TypeRef } from '@xyd-js/opensdk-core';
import type { ExampleValue } from '@xyd-js/opensdk-framework';

import { csType, isBinaryRef } from './cstype';
import { pascalCase, structPropertyNames } from './naming';

// Renders the framework's language-neutral ExampleValue tree into a C# literal,
// for the generated test suite (generateTests). The shared planner
// (planExample / planMethodExample) decides WHAT a realistic example is; this
// module only decides how C# spells it, TYPED against the declared TypeRef so
// each literal matches the method's parameter/model type exactly (List<T>,
// Dictionary<string,T>, `new Model { ... }`, an enum member, a byte[] upload).

export interface CsExampleCtx {
  types: Map<string, NamedType>;
}

/** One enum member identifier from a value (name override, else the wire value). */
function enumMemberName(value: EnumValue): string {
  return pascalCase(String(value.name ?? value.value)) || 'Value';
}

/** A binary example: bytes from a fixed sample string. */
const BINARY_LITERAL = 'System.Text.Encoding.UTF8.GetBytes("Example data")';

/**
 * Render an example value against its DECLARED TypeRef so container element
 * types are exact and a bottomed-out example (depth cap / unresolved ref) falls
 * back to the C# default the field accepts — the invariant that keeps the whole
 * spec compiling.
 */
export function renderRefValue(ref: TypeRef | undefined, value: ExampleValue, ctx: CsExampleCtx): string {
  if (!ref) return renderScalarLike(value);
  if (value.kind === 'any' || value.kind === 'null') return zeroValue(ref, ctx);
  switch (ref.kind) {
    case 'array': {
      if (value.kind !== 'array') return zeroValue(ref, ctx);
      const item = csType(ref.items as TypeRef | undefined, ctx.types);
      return `new List<${item}> { ${renderRefValue(ref.items as TypeRef | undefined, value.item, ctx)} }`;
    }
    case 'map': {
      if (value.kind !== 'map') return zeroValue(ref, ctx);
      const val = csType(ref.values as TypeRef | undefined, ctx.types);
      return `new Dictionary<string, ${val}> { ["key"] = ${renderRefValue(ref.values as TypeRef | undefined, value.value, ctx)} }`;
    }
    case 'ref': {
      const named = ref.name ? ctx.types.get(ref.name) : undefined;
      if (!named) return renderScalarLike(value);
      if (named.kind === 'alias') return renderRefValue(named.of as TypeRef | undefined, value, ctx);
      if (named.kind === 'union') {
        // Unions surface as `object`: emit the first concrete variant (assignable).
        if (value.kind !== 'union') return 'null';
        return renderRefValue((named.variants || [])[0] as TypeRef | undefined, value.variant, ctx);
      }
      if (named.kind === 'enum') return renderEnum(named, value);
      if (value.kind !== 'object') return zeroValue(ref, ctx);
      return renderObject(named, value, ctx);
    }
    default:
      if (isBinaryRef(ref)) return BINARY_LITERAL;
      return renderScalarLike(value);
  }
}

function renderObject(named: NamedType, value: Extract<ExampleValue, { kind: 'object' }>, ctx: CsExampleCtx): string {
  const type = pascalCase(named.name);
  if (value.fields.length === 0) return `new ${type}()`;
  const byName = new Map((named.fields || []).map((f) => [f.name, f.type as TypeRef | undefined]));
  // Object-initializer property names MUST match the collision-resolved model
  // declaration (CS0542/CS0102), so reuse the same allocator.
  const idents = structPropertyNames(type, (named.fields || []).map((f) => f.name));
  const parts = value.fields.map(
    (f) => `${idents.get(f.name) ?? pascalCase(f.name)} = ${renderRefValue(byName.get(f.name), f.value, ctx)}`,
  );
  return `new ${type} { ${parts.join(', ')} }`;
}

function renderEnum(named: NamedType, value: ExampleValue): string {
  const raw = value.kind === 'enum' || value.kind === 'const' ? value.value : undefined;
  const ev: EnumValue = named.values?.find((v) => v.value === raw) ?? ({ value: raw } as EnumValue);
  return `${pascalCase(named.name)}.${enumMemberName(ev)}`;
}

/** A scalar/const/binary example rendered from the value alone (no TypeRef context). */
function renderScalarLike(value: ExampleValue): string {
  switch (value.kind) {
    case 'string':
      return JSON.stringify(value.value);
    case 'integer':
      return String(value.value);
    case 'number':
      return String(value.value);
    case 'boolean':
      return value.value ? 'true' : 'false';
    case 'null':
      return 'null';
    case 'binary':
      return BINARY_LITERAL;
    case 'const':
      return csLiteral(value.value);
    case 'enum':
      return csLiteral(value.value);
    default:
      return 'null';
  }
}

/** A JSON scalar (const/enum wire value) as a C# literal. */
function csLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  return JSON.stringify(String(v));
}

/** The C# default value for a TypeRef (fallback for bottomed-out examples). */
function zeroValue(ref: TypeRef | undefined, ctx: CsExampleCtx): string {
  if (!ref) return 'null';
  switch (ref.kind) {
    case 'scalar':
      if (ref.const !== undefined) return csLiteral(ref.const);
      if (ref.scalar === 'integer' || ref.scalar === 'number') return '0';
      if (ref.scalar === 'boolean') return 'false';
      return '""';
    case 'array':
    case 'map':
      return 'null';
    case 'ref': {
      const named = ref.name ? ctx.types.get(ref.name) : undefined;
      if (!named) return 'null';
      if (named.kind === 'alias') return zeroValue(named.of as TypeRef | undefined, ctx);
      if (named.kind === 'enum' || named.kind === 'union') return 'null';
      return `new ${pascalCase(ref.name as string)}()`;
    }
    default:
      return 'null';
  }
}
