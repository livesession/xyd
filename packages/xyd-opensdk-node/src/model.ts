import type { EnumValue, Field, NamedType, OpensdkSpecJson, TypeRef } from '@xyd-js/opensdk-core';

import { ModelRefs, nodeType } from './nodetype';
import { pascalCase } from './naming';

/**
 * Emit `src/models.ts`: every named type in the symbol table as a TypeScript
 * declaration — structs become `interface`s (property names = wire names, so a
 * body/response object serializes wire-correct with no key remapping), enums
 * become string/number-literal unions, aliases become `type X = ...`, and unions
 * are an open `unknown` placeholder (a phase-2 seam for discriminated decode).
 */
export function renderModelsFile(spec: OpensdkSpecJson): string {
  const decls = (spec.types || []).map(renderNamedType).filter(Boolean);
  if (decls.length === 0) return 'export {};\n';
  return `${decls.join('\n\n')}\n`;
}

function renderNamedType(type: NamedType): string {
  switch (type.kind) {
    case 'enum':
      return renderEnum(type);
    case 'alias':
      return renderAlias(type);
    case 'union':
      return renderUnion(type);
    default:
      return renderInterface(type);
  }
}

/** A JSDoc block (`/** ... *\/`) from free text, or '' when empty. */
export function jsDoc(text: string | undefined): string {
  const raw = (text || '').trim();
  if (!raw) return '';
  const lines = raw.split('\n');
  if (lines.length === 1) return `/** ${lines[0].trim()} */\n`;
  return `/**\n${lines.map((l) => ` * ${l.trim()}`.trimEnd()).join('\n')}\n */\n`;
}

function renderInterface(type: NamedType): string {
  const name = pascalCase(type.name);
  const refs = new ModelRefs();
  const fields = (type.fields || []).map((f) => interfaceFieldLine(f, refs));
  const body = fields.length ? `\n${fields.join('\n')}\n` : '';
  return `${jsDoc(type.description)}export interface ${name} {${body}}`;
}

/** One interface field. The property name is the WIRE name (kept verbatim so the
 * request/response body is wire-correct); optional fields get `?`. */
function interfaceFieldLine(f: Field, refs: ModelRefs): string {
  const doc = jsDoc(f.description);
  const docLines = doc ? doc.split('\n').filter(Boolean).map((l) => `  ${l}`).join('\n') + '\n' : '';
  const key = propKey(f.name);
  const optional = f.required ? '' : '?';
  return `${docLines}  ${key}${optional}: ${nodeType(f.type, refs)};`;
}

/** A property key: a bare identifier when safe, else a quoted string literal. */
export function propKey(name: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

/**
 * A string/number-literal union for an enum (openai-node's `object: 'model'`
 * style), e.g. `export type PetStatus = 'available' | 'pending' | 'sold';`.
 */
function renderEnum(type: NamedType): string {
  const name = pascalCase(type.name);
  const values = type.values || [];
  if (values.length === 0) return `${jsDoc(type.description)}export type ${name} = never;`;
  const members = values.map((v) => enumLiteral(v, type.base)).join(' | ');
  return `${jsDoc(type.description)}export type ${name} = ${members};`;
}

function enumLiteral(value: EnumValue, base: string | undefined): string {
  if (base === 'integer') return String(value.value);
  return JSON.stringify(String(value.value));
}

function renderAlias(type: NamedType): string {
  const name = pascalCase(type.name);
  return `${jsDoc(type.description)}export type ${name} = ${nodeType(type.of)};`;
}

/**
 * A union renders as the TypeScript union of its variant types. A
 * discriminator-mapped union (propertyName + non-empty mapping) additionally
 * gets a `decode<Union>` helper that peeks the discriminator and narrows to the
 * concrete variant (raw value falls through) — the request/decode path calls it.
 * Mirrors the Go emitter's Unmarshal<Union>JSON.
 */
function renderUnion(type: NamedType): string {
  const name = pascalCase(type.name);
  const variants = type.variants || [];
  const throwaway = new ModelRefs();
  const rhs = variants.length ? variants.map((v) => nodeType(v as TypeRef, throwaway)).join(' | ') : 'unknown';
  const decl = `${jsDoc(type.description)}export type ${name} = ${rhs};`;
  const decode = mappedUnion(type) ? `\n\n${renderDecodeUnion(type)}` : '';
  return `${decl}${decode}`;
}

/** A union with a usable discriminator (propertyName + non-empty mapping), or null. */
function mappedUnion(type: NamedType): { propertyName: string; mapping: Record<string, string> } | null {
  const disc = type.discriminator;
  if (disc?.propertyName && disc.mapping && Object.keys(disc.mapping).length > 0) {
    return { propertyName: disc.propertyName, mapping: disc.mapping };
  }
  return null;
}

/** The `decode<Union>` function name for a mapped-union type name, or null. */
export function unionDecodeName(type: NamedType): string | null {
  return mappedUnion(type) ? `decode${pascalCase(type.name)}` : null;
}

/** The discriminator switch: peek `propertyName`, dispatch to the mapped variant, raw fallback. */
function renderDecodeUnion(type: NamedType): string {
  const name = pascalCase(type.name);
  const { propertyName, mapping } = mappedUnion(type)!;
  const safe = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(propertyName);
  const typeKey = safe ? propertyName : JSON.stringify(propertyName);
  const accessor = safe ? `?.${propertyName}` : `?.[${JSON.stringify(propertyName)}]`;
  const cases = Object.entries(mapping)
    .map(([value, variant]) => `    case ${JSON.stringify(value)}:\n      return data as ${pascalCase(variant)};`)
    .join('\n');
  return (
    `/** Decode a \`${name}\` by its \`${propertyName}\` discriminator (unknown value falls through). */\n` +
    `export function decode${name}(data: unknown): ${name} {\n` +
    `  switch ((data as { ${typeKey}?: string } | null | undefined)${accessor}) {\n` +
    `${cases}\n` +
    `    default:\n      return data as ${name};\n` +
    `  }\n}`
  );
}
