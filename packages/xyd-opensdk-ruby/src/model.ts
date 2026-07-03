import type { NamedType, OpensdkSpecJson, TypeRef } from '@xyd-js/opensdk-core';

import { pascalCase, screamingSnakeCase, snakeCase } from './naming';
import { block, indent, rbComment, rbString } from './rbwriter';

/**
 * Emit `lib/<pkg>/models.rb`: every named type as an idiomatic Ruby declaration
 * inside `module <Module>; module Models`. Structs become
 * `Struct.new(..., keyword_init: true)` (openai-ruby's model shape, minus
 * Sorbet); enums become a constant-holding module; unions/aliases get a
 * documented passthrough (a clean seam for phase-2 typed decoding).
 */
export function renderModelsFile(spec: OpensdkSpecJson, moduleName: string): string {
  const decls = (spec.types || []).map(renderNamedType).filter(Boolean);
  const body = decls.length ? decls.join('\n\n') : '# No named types in this spec.';
  return `${block(`module ${moduleName}`, block('module Models', body))}\n`;
}

function renderNamedType(type: NamedType): string {
  switch (type.kind) {
    case 'enum':
      return renderEnum(type);
    case 'union':
      // A mapped discriminated union gets a real decode helper; a mapping-less
      // union (or an alias) stays an open passthrough.
      return unionMapping(type) ? renderUnionDecoder(type) : renderPassthrough(type);
    case 'alias':
      return renderPassthrough(type);
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

/** The generated Ruby decode helper reference for a mapped union, e.g. `Models::Shape`. */
export function unionDecoderRef(moduleName: string, type: NamedType): string {
  return `${moduleName}::Models::${pascalCase(type.name)}`;
}

/**
 * A mapped discriminated union: a namespace module carrying its discriminator +
 * `value -> variant-class` table and a `decode` that peeks the discriminator and
 * builds the concrete variant Struct. An unknown/absent discriminator (or a
 * non-Hash value) flows the raw value through unchanged — no data lost. Mirrors
 * the Go emitter's Unmarshal<Union>JSON (probe + switch + raw fallback).
 */
function renderUnionDecoder(type: NamedType): string {
  const name = pascalCase(type.name);
  const mapped = unionMapping(type);
  if (!mapped) return renderPassthrough(type);
  // Sorted for deterministic output regardless of IR key order.
  const entries = Object.entries(mapped.mapping).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const mappingLines = entries.map(([value, variant]) => `${rbString(value)} => ${rbString(pascalCase(variant))}`);
  const mappingBlock =
    mappingLines.length === 1
      ? `MAPPING = { ${mappingLines[0]} }.freeze`
      : `MAPPING = {\n${indent(mappingLines.join(',\n'))}\n}.freeze`;

  const decode = [
    '# Decode a parsed JSON value into the concrete variant selected by the',
    `# ${rbString(mapped.property)} discriminator. An unknown or absent discriminator`,
    '# (or a non-Hash value) returns the value unchanged.',
    'def self.decode(value)',
    indent('return value unless value.is_a?(Hash)'),
    indent('raw = value[DISCRIMINATOR.to_sym]'),
    indent('raw = value[DISCRIMINATOR] if raw.nil?'),
    indent('variant = MAPPING[raw.to_s]'),
    indent('return value if variant.nil?'),
    indent('klass = Models.const_get(variant)'),
    indent('attrs = {}'),
    indent(
      block('klass.members.each do |member|', [
        'if value.key?(member)',
        indent('attrs[member] = value[member]'),
        'elsif value.key?(member.to_s)',
        indent('attrs[member] = value[member.to_s]'),
        'end',
      ].join('\n')),
    ),
    indent('klass.new(**attrs)'),
    'rescue NameError, ArgumentError',
    indent('value'),
    'end',
  ].join('\n');

  const body = [`DISCRIMINATOR = ${rbString(mapped.property)}`, mappingBlock, decode].join('\n\n');
  const doc = rbComment(type.description);
  const head = doc ? `${doc}\n` : '';
  return `${head}${block(`module ${name}`, body)}`;
}

function renderStruct(type: NamedType): string {
  const name = pascalCase(type.name);
  const doc = rbComment(type.description);
  const head = doc ? `${doc}\n` : '';
  const fields = type.fields || [];
  // An empty struct is a plain (open) class — `Struct.new(keyword_init: true)`
  // with zero members is not portable across rubies.
  if (fields.length === 0) return `${head}${name} = Class.new`;
  const members = fields.map((f) => `:${snakeCase(f.name)}`).join(', ');
  return `${head}${name} = Struct.new(${members}, keyword_init: true)`;
}

function renderEnum(type: NamedType): string {
  const name = pascalCase(type.name);
  const doc = rbComment(type.description);
  const head = doc ? `${doc}\n` : '';
  const values = type.values || [];
  if (values.length === 0) return `${head}module ${name}\nend`;
  const isInt = type.base === 'integer';
  const members = values.map((v) => {
    const member = screamingSnakeCase(String(v.name ?? v.value)) || 'VALUE';
    const literal = isInt ? String(v.value) : JSON.stringify(String(v.value));
    return `${member} = ${literal}`;
  });
  return `${head}${block(`module ${name}`, members.join('\n'))}`;
}

/**
 * Aliases and unions have no first-class Ruby analogue in a stdlib-only SDK; a
 * value of the type flows through as its decoded JSON. We emit a documented
 * comment so the name is discoverable without pretending to a Ruby type.
 */
function renderPassthrough(type: NamedType): string {
  const name = pascalCase(type.name);
  const what = type.kind === 'alias' ? aliasOf(type.of as TypeRef | undefined) : 'a union';
  const doc = rbComment(type.description);
  const head = doc ? `${doc}\n` : '';
  return `${head}# ${name} is ${what}; values flow through as decoded JSON (phase-1 passthrough).`;
}

function aliasOf(ref: TypeRef | undefined): string {
  if (!ref) return 'an alias';
  if (ref.kind === 'array') return 'an array alias';
  if (ref.kind === 'map') return 'a map alias';
  if (ref.kind === 'ref' && ref.name) return `an alias of ${pascalCase(ref.name)}`;
  return 'an alias';
}
