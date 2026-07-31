import type { NamedType } from '@xyd-js/opensdk-core';
import type { ExampleValue } from '@xyd-js/opensdk-framework';

import { unionMapping } from './model';
import { pascalCase, snakeCase } from './naming';
import { rsString } from './rswriter';

// Renders the framework's language-neutral ExampleValue tree into a Rust literal
// for the generated test suite (generateTests). The shared planner (planExample /
// planMethodExample) decides WHAT a realistic example is; this module only
// decides how Rust spells it — so the Go/Python/Ruby/Rust suites exercise
// byte-identical shapes and can never drift.

/**
 * Render one ExampleValue as a Rust expression. `owned` controls scalar strings:
 * a struct/params field wants an owned `String` (`"x".to_string()`), a `&str`
 * path argument wants a borrowed literal (`"x"`). Enums render as their typed
 * variant; binary as a `Vec<u8>`; objects as struct literals with
 * `..Default::default()`.
 */
export function renderRsExample(value: ExampleValue, types: Map<string, NamedType>, owned = true): string {
  switch (value.kind) {
    case 'string':
      return owned ? `${rsString(value.value)}.to_string()` : rsString(value.value);
    case 'integer':
      return String(value.value);
    case 'number':
      return floatLiteral(value.value);
    case 'boolean':
      return value.value ? 'true' : 'false';
    case 'binary':
      return 'b"Example data".to_vec()';
    case 'enum':
      return renderEnum(value.typeName, value.value, types);
    case 'const':
      return renderLiteral(value.value, owned);
    case 'array':
      return `vec![${renderRsExample(value.item, types, true)}]`;
    case 'map':
      return `std::collections::HashMap::from([("key".to_string(), ${renderRsExample(value.value, types, true)})])`;
    case 'object':
      return renderObject(value.typeName, value.fields, types);
    case 'union':
      return renderUnion(value.typeName, value.variant, types);
    case 'any':
      // The planner bottoms out at 'any' past its depth cap; Default::default()
      // type-infers to whatever the target field/variant is (every struct derives
      // Default), so it fits a String, a struct, a Vec, or a serde_json::Value.
      return 'Default::default()';
    default:
      return 'Default::default()';
  }
}

function renderObject(
  typeName: string | undefined,
  fields: { name: string; value: ExampleValue }[],
  types: Map<string, NamedType>,
): string {
  const name = pascalCase(typeName ?? 'Value');
  if (fields.length === 0) return `${name}::default()`;
  const rows = fields.map((f) => `${snakeCase(f.name)}: Some(${renderRsExample(f.value, types, true)})`);
  return `${name} { ${rows.join(', ')}, ..Default::default() }`;
}

/** An enum example: a newtype `(value)` for integer enums, else `Type::Variant`. */
function renderEnum(typeName: string, value: unknown, types: Map<string, NamedType>): string {
  const named = types.get(typeName);
  const type = pascalCase(typeName);
  if (named?.base === 'integer') return `${type}(${Number(value)})`;
  const match = named?.values?.find((v) => String(v.value) === String(value));
  const variant = pascalCase(String(match?.name ?? match?.value ?? value));
  return `${type}::${variant}`;
}

/**
 * A union example wrapped in the correct enum variant. The planner always uses
 * the union's first IR variant, so: a discriminated (serde-tagged) union renders
 * its named variant (`Type::VariantName(inner)`); a mapping-less (untagged) union
 * renders `Type::Variant0(inner)` — the index-0 variant the model emitter emits.
 */
function renderUnion(typeName: string, variant: ExampleValue, types: Map<string, NamedType>): string {
  const named = types.get(typeName);
  const tagged = named ? !!unionMapping(named) : false;
  const inner = renderRsExample(variant, types, true);
  if (tagged && variant.kind === 'object' && variant.typeName) {
    return `${pascalCase(typeName)}::${pascalCase(variant.typeName)}(${inner})`;
  }
  return `${pascalCase(typeName)}::Variant0(${inner})`;
}

/** A JSON scalar (enum/const wire value) as a Rust literal. */
function renderLiteral(v: unknown, owned: boolean): string {
  if (v === null || v === undefined) return 'Default::default()';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : floatLiteral(v);
  return owned ? `${rsString(String(v))}.to_string()` : rsString(String(v));
}

/** A Rust float literal that infers to f32/f64 as needed (`0` -> `0.0`). */
function floatLiteral(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}
