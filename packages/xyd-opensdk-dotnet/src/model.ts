import type { EnumValue, Field, NamedType, TypeRef } from '@xyd-js/opensdk-core';

import { csType, nullable } from './cstype';
import { csDoc, csFile, indent } from './cswriter';
import { pascalCase, structPropertyNames } from './naming';

interface ModelCtx {
  types: Map<string, NamedType>;
  usings: Set<string>;
}

/**
 * Emit `Models.cs`: every named STRUCT as a POCO (public class with
 * `[JsonPropertyName]`-tagged nullable properties) and every ENUM as a C# enum
 * plus a generated `System.Text.Json.JsonConverter<T>` that maps each member to
 * its wire literal. A struct field whose type is a JSON-Schema `const` gets its
 * fixed literal as a property default, so request bodies auto-fill it when the
 * caller leaves it unset (response decode overwrites it). A union with a mapped
 * discriminator additionally emits a static decoder that peeks the discriminator
 * and materializes the concrete variant (raw fallback otherwise). Aliases and
 * open unions are handled structurally by `csType` (aliases resolve to their
 * underlying type; unions map to `object`), so they emit no standalone C# type.
 */
export function renderModelsFile(types: NamedType[], namespaceName: string): string {
  const ctx: ModelCtx = { types: new Map(types.map((t) => [t.name, t])), usings: new Set() };
  const decls: string[] = [];
  for (const type of types) {
    if (type.kind === 'struct') decls.push(structType(type, ctx));
    else if (type.kind === 'enum') decls.push(...enumType(type, ctx));
    else if (type.kind === 'union') {
      const decoder = unionDecoder(type, ctx);
      if (decoder) decls.push(decoder);
    }
    // alias / open union: no standalone C# type (resolved structurally by csType).
  }
  return csFile([...ctx.usings], namespaceName, decls);
}

/** The generated converter class name for an enum, e.g. `PetStatusConverter`. */
function enumConverterName(typeName: string): string {
  return `${pascalCase(typeName)}Converter`;
}

/** The generated discriminated-union decoder class name, e.g. `ShapeUnion`. */
export function unionDecoderName(typeName: string): string {
  return `${pascalCase(typeName)}Union`;
}

/** One enum member identifier from a value (name override, else the wire value). */
function enumMemberName(value: EnumValue): string {
  const raw = String(value.name ?? value.value);
  return pascalCase(raw) || 'Value';
}

/** Whether a field's type is a fixed-literal scalar (JSON Schema const). */
function isConstField(field: Field): boolean {
  const ref = field.type as TypeRef | undefined;
  return ref?.kind === 'scalar' && ref.const !== undefined;
}

/** The C# literal for a const scalar value (string quoted, number/bool verbatim). */
function csConstLiteral(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return JSON.stringify(String(value));
}

/** The mapped discriminator of a union (propertyName + non-empty mapping), else null. */
export function unionMapping(type: NamedType): { property: string; mapping: Record<string, string> } | null {
  if (type.kind !== 'union') return null;
  const disc = type.discriminator;
  if (!disc?.propertyName || !disc.mapping || Object.keys(disc.mapping).length === 0) return null;
  return { property: disc.propertyName, mapping: disc.mapping };
}

function structType(type: NamedType, ctx: ModelCtx): string {
  const name = pascalCase(type.name);
  const doc = csDoc(type.description);
  const head = doc ? `${doc}\n` : '';
  const fields = type.fields || [];
  if (fields.length === 0) return `${head}public sealed class ${name}\n{\n}`;
  ctx.usings.add('System.Text.Json.Serialization');
  const idents = structPropertyNames(name, fields.map((f) => f.name));
  const members = fields.map((f) => structProperty(f, idents.get(f.name) as string, ctx)).join('\n\n');
  return `${head}public sealed class ${name}\n{\n${indent(members)}\n}`;
}

/** One `[JsonPropertyName("wire")] public T? Prop { get; set; }` member. */
function structProperty(field: Field, propName: string, ctx: ModelCtx): string {
  const type = csType(field.type as TypeRef | undefined, ctx.types);
  if (type.includes('List<') || type.includes('Dictionary<')) ctx.usings.add('System.Collections.Generic');
  const doc = csDoc(field.description);
  const head = doc ? `${doc}\n` : '';
  // A const field seeds its fixed literal as a default so request bodies
  // auto-fill it when the caller leaves it unset (response JSON overwrites it).
  const init = isConstField(field) ? ` = ${csConstLiteral((field.type as TypeRef).const)};` : '';
  // Every model property is nullable: response JSON may omit any field and
  // request bodies send only the fields the caller set (WhenWritingNull). The
  // identifier is collision-resolved (CS0542/CS0102) upstream; the wire name is
  // preserved on [JsonPropertyName].
  return `${head}[JsonPropertyName(${JSON.stringify(field.name)})]\npublic ${nullable(type)} ${propName} { get; set; }${init}`;
}

/** The enum declaration + its string<->member JsonConverter (string enums). */
function enumType(type: NamedType, ctx: ModelCtx): string[] {
  const name = pascalCase(type.name);
  const values = type.values || [];
  const doc = csDoc(type.description);
  const head = doc ? `${doc}\n` : '';
  ctx.usings.add('System.Text.Json.Serialization');

  // Integer-based enums serialize as their numeric value by default (matches
  // the integer wire form) — no custom converter needed.
  if (type.base === 'integer') {
    const members = values.map((v) => `${enumMemberName(v)} = ${Number(v.value)},`).join('\n');
    return [`${head}public enum ${name}\n{\n${indent(members || '// no values')}\n}`];
  }

  // String enums: a generated converter maps each member to its wire literal.
  ctx.usings.add('System');
  ctx.usings.add('System.Text.Json');
  const converter = enumConverterName(type.name);
  const members = values.map((v) => `${enumMemberName(v)},`).join('\n');
  const enumDecl =
    `${head}[JsonConverter(typeof(${converter}))]\n` + `public enum ${name}\n{\n${indent(members || '// no values')}\n}`;

  const readCases = values
    .map((v) => `${JSON.stringify(String(v.value))} => ${name}.${enumMemberName(v)},`)
    .join('\n');
  const writeCases = values
    .map((v) => `${name}.${enumMemberName(v)} => ${JSON.stringify(String(v.value))},`)
    .join('\n');
  const converterDecl =
    `internal sealed class ${converter} : JsonConverter<${name}>\n{\n` +
    indent(
      `public override ${name} Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)\n` +
        `{\n` +
        indent(
          `string? value = reader.GetString();\n` +
            `return value switch\n{\n` +
            indent(`${readCases}\n_ => throw new JsonException($"Unknown ${name} value: {value}"),`) +
            `\n};`,
        ) +
        `\n}\n\n` +
        `public override void Write(Utf8JsonWriter writer, ${name} value, JsonSerializerOptions options)\n` +
        `{\n` +
        indent(
          `writer.WriteStringValue(value switch\n{\n` +
            indent(`${writeCases}\n_ => throw new JsonException($"Unknown ${name} value: {value}"),`) +
            `\n});`,
        ) +
        `\n}`,
    ) +
    `\n}`;

  return [enumDecl, converterDecl];
}

/**
 * The static decoder for a union with a mapped discriminator: peek the
 * discriminator property, deserialize the concrete variant it selects, and fall
 * back to the raw `JsonElement` when the discriminator is unknown/absent (no
 * data loss). Mirrors the Go emitter's `Unmarshal<Union>JSON`. An open
 * (mapping-less) union emits nothing — it stays `object` (see csType).
 */
function unionDecoder(type: NamedType, ctx: ModelCtx): string | null {
  const mapped = unionMapping(type);
  if (!mapped) return null;
  ctx.usings.add('System.Text.Json');

  const name = pascalCase(type.name);
  const cls = unionDecoderName(type.name);
  // Sorted for deterministic output regardless of IR key order.
  const entries = Object.entries(mapped.mapping).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const cases = entries
    .map(([value, variant]) => `case ${JSON.stringify(value)}:\n    return JsonSerializer.Deserialize<${pascalCase(variant)}>(json, Options);`)
    .join('\n');

  const doc = csDoc(
    `Decodes a ${name} from JSON by its ${JSON.stringify(mapped.property)} discriminator, ` +
      `returning the raw JSON element when the value is unknown.`,
  );
  const head = doc ? `${doc}\n` : '';
  const body =
    `private static readonly JsonSerializerOptions Options = new() { PropertyNameCaseInsensitive = true };\n\n` +
    `public static object? Decode(string json)\n{\n` +
    indent(
      `if (string.IsNullOrEmpty(json))\n{\n    return null;\n}\n` +
        `using JsonDocument document = JsonDocument.Parse(json);\n` +
        `JsonElement root = document.RootElement;\n` +
        `if (root.ValueKind == JsonValueKind.Object &&\n` +
        `    root.TryGetProperty(${JSON.stringify(mapped.property)}, out JsonElement discriminator) &&\n` +
        `    discriminator.ValueKind == JsonValueKind.String)\n{\n` +
        indent(`switch (discriminator.GetString())\n{\n${indent(cases)}\n}`) +
        `\n}\n` +
        `return JsonSerializer.Deserialize<JsonElement>(json, Options);`,
    ) +
    `\n}`;
  return `${head}internal static class ${cls}\n{\n${indent(body)}\n}`;
}
