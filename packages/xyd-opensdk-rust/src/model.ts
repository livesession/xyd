import type { EnumValue, Field, NamedType, OpensdkSpecJson, TypeRef } from '@xyd-js/opensdk-core';

import { pascalCase, screamingSnakeCase, snakeCase } from './naming';
import { rsType } from './rstype';
import { braced, deriveLine, indent, rsDoc, rsString } from './rswriter';

/**
 * Emit `src/models.rs`: every named type as an idiomatic serde declaration.
 * Structs become `#[derive(...Serialize, Deserialize)]` with every field
 * `Option<T>` + `#[serde(default, skip_serializing_if)]` (so `..Default::default()`
 * is always legal and partial responses decode); string enums become real Rust
 * enums with a `#[serde(other)]` catch-all; integer enums a newtype + consts;
 * discriminated unions serde internally-tagged enums; mapping-less unions
 * `#[serde(untagged)]`; aliases plain type aliases.
 */
/**
 * A null-tolerant array deserializer: drops null / undecodable elements instead
 * of failing the whole response (APIs occasionally return null list items). Wired
 * onto every `Option<Vec<T>>` field via `deserialize_with`.
 */
const NULL_VEC_HELPER = `fn null_vec<'de, D, T>(deserializer: D) -> Result<Option<Vec<T>>, D::Error>
where
    D: serde::Deserializer<'de>,
    T: serde::de::DeserializeOwned,
{
    let opt: Option<Vec<serde_json::Value>> = Option::deserialize(deserializer)?;
    Ok(opt.map(|items| items.into_iter().filter_map(|value| serde_json::from_value(value).ok()).collect()))
}`;

export function renderModelsFile(spec: OpensdkSpecJson): string {
  const decls = (spec.types || []).map(renderNamedType).filter(Boolean);
  const body = decls.length ? decls.join('\n\n') : '// No named types in this spec.';
  return `use serde::{Deserialize, Serialize};\n\n${NULL_VEC_HELPER}\n\n${body}\n`;
}

function renderNamedType(type: NamedType): string {
  switch (type.kind) {
    case 'enum':
      return type.base === 'integer' ? renderIntEnum(type) : renderStringEnum(type);
    case 'union':
      return unionMapping(type) ? renderTaggedUnion(type) : renderUntaggedUnion(type);
    case 'alias':
      return renderAlias(type);
    default:
      return renderStruct(type);
  }
}

/** The mapped discriminator of a union (propertyName + non-empty mapping), else null. */
export function unionMapping(type: NamedType): { property: string; mapping: Record<string, string> } | null {
  if (type.kind !== 'union') return null;
  const disc = type.discriminator;
  if (!disc?.propertyName || !disc.mapping || Object.keys(disc.mapping).length === 0) return null;
  return { property: disc.propertyName, mapping: disc.mapping };
}

/** A collision-free identifier: append a numeric suffix when `base` is already taken. */
function uniqueName(base: string, seen: Set<string>): string {
  let name = base || 'field';
  for (let i = 2; seen.has(name); i++) name = `${base}${i}`;
  seen.add(name);
  return name;
}

/** `pub <rustName>: Option<T>,` with serde default/skip + a wire-name rename when it differs. */
function renderField(field: Field, seen: Set<string>): string {
  const rustName = uniqueName(snakeCase(field.name), seen);
  const attrs = ['default', 'skip_serializing_if = "Option::is_none"'];
  // Array fields decode null / undecodable elements away instead of erroring.
  if (field.type?.kind === 'array') attrs.push('deserialize_with = "null_vec"');
  if (rustName !== field.name) attrs.push(`rename = ${rsString(field.name)}`);
  const doc = rsDoc(field.description);
  const head = doc ? `${doc}\n` : '';
  return `${head}#[serde(${attrs.join(', ')})]\npub ${rustName}: Option<${rsType(field.type)}>,`;
}

function renderStruct(type: NamedType): string {
  const name = pascalCase(type.name);
  const head = docHead(type.description);
  const derives = deriveLine(['Debug', 'Clone', 'Default', 'Serialize', 'Deserialize']);
  const fields = type.fields || [];
  if (fields.length === 0) return `${head}${derives}\npub struct ${name} {}`;
  const seen = new Set<string>();
  const body = fields.map((f) => renderField(f, seen)).join('\n');
  return `${head}${derives}\n${braced(`pub struct ${name}`, body)}`;
}

function renderStringEnum(type: NamedType): string {
  const name = pascalCase(type.name);
  const head = docHead(type.description);
  const derives = deriveLine(['Debug', 'Clone', 'PartialEq', 'Serialize', 'Deserialize']);
  const values = type.values || [];
  const seen = new Set<string>();
  const variants = values.map((v) => `#[serde(rename = ${rsString(String(v.value))})]\n${uniqueName(variantName(v), seen)},`);
  // Forward-compat catch-all: an unknown wire value decodes to Unknown instead of
  // erroring (openai enums are additive). Deserialize-only; never sent on the wire.
  // Collision-safe: a real "unknown" value keeps `Unknown`; the catch-all shifts.
  const catchAll = uniqueName('Unknown', seen);
  variants.push(`/// A value the SDK does not yet know about.\n#[serde(other)]\n${catchAll},`);
  return `${head}${derives}\n${braced(`pub enum ${name}`, variants.join('\n'))}`;
}

function renderIntEnum(type: NamedType): string {
  const name = pascalCase(type.name);
  const head = docHead(type.description);
  const derives = deriveLine(['Debug', 'Clone', 'Copy', 'PartialEq', 'Eq', 'Default', 'Serialize', 'Deserialize']);
  const newtype = `${head}${derives}\npub struct ${name}(pub i64);`;
  const seen = new Set<string>();
  const consts = (type.values || [])
    .map((v) => `pub const ${uniqueName(screamingSnakeCase(String(v.name ?? v.value)), seen)}: ${name} = ${name}(${Number(v.value)});`)
    .join('\n');
  if (!consts) return newtype;
  return `${newtype}\n\n${braced(`impl ${name}`, consts)}`;
}

function renderTaggedUnion(type: NamedType): string {
  const name = pascalCase(type.name);
  const head = docHead(type.description);
  const mapped = unionMapping(type);
  if (!mapped) return renderUntaggedUnion(type);
  const derives = deriveLine(['Debug', 'Clone', 'Serialize', 'Deserialize']);
  // Sorted for deterministic output regardless of IR key order.
  const entries = Object.entries(mapped.mapping).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const seen = new Set<string>();
  const variants = entries.map(
    ([value, variant]) =>
      `#[serde(rename = ${rsString(value)})]\n${uniqueName(pascalCase(variant), seen)}(${pascalCase(variant)}),`,
  );
  return `${head}${derives}\n#[serde(tag = ${rsString(mapped.property)})]\n${braced(`pub enum ${name}`, variants.join('\n'))}`;
}

function renderUntaggedUnion(type: NamedType): string {
  const name = pascalCase(type.name);
  const head = docHead(type.description);
  const derives = deriveLine(['Debug', 'Clone', 'Serialize', 'Deserialize']);
  const variants = (type.variants || []).map((v, i) => `Variant${i}(${rsType(v as TypeRef)}),`);
  // A trailing catch-all makes decode total: an unknown or null shape (e.g. a
  // depth-capped array element) decodes into Other instead of erroring. serde
  // tries variants in order, so the typed variants above keep priority.
  variants.push('Other(serde_json::Value),');
  return `${head}${derives}\n#[serde(untagged)]\n${braced(`pub enum ${name}`, variants.join('\n'))}`;
}

function renderAlias(type: NamedType): string {
  const name = pascalCase(type.name);
  const head = docHead(type.description);
  return `${head}pub type ${name} = ${rsType(type.of as TypeRef | undefined)};`;
}

/** The Rust enum variant identifier for one enum value (name override wins). */
function variantName(v: EnumValue): string {
  return pascalCase(String(v.name ?? v.value)) || 'Value';
}

function docHead(description: string | undefined): string {
  const doc = rsDoc(description);
  return doc ? `${doc}\n` : '';
}
