import type { EnumValue, Field, NamedType } from '@xyd-js/opensdk-core';
import type { GeneratedFile } from '@xyd-js/opensdk-framework';

import { constLiteral, isConstField, javaDecode, javaType, unionMapping } from './javatype';
import { javaDoc, javaFile } from './javawriter';
import { camelCase, pascalCase, screamingSnakeCase } from './naming';
import type { JavaCtx } from './project';

/**
 * Emit one `.java` file per named type. Structs become plain POJOs (private
 * fields + fluent accessors + a manual `fromJson`/`toJsonMap` codec, with
 * const-valued fields auto-filled on encode); enums become Java enums carrying
 * their wire value; a mapped discriminated union becomes a holder class with a
 * discriminator-aware `fromJson`. A mapping-less union / alias stays a PHASE-2
 * seam — refs to them degrade to `Object` (see javatype), so no file is emitted
 * and generated code still compiles.
 */
export function renderTypeFiles(types: NamedType[], ctx: JavaCtx): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  for (const type of types) {
    if (type.kind === 'struct') files.push(structFile(type, ctx));
    else if (type.kind === 'enum') files.push(enumFile(type, ctx));
    else if (type.kind === 'union' && unionMapping(type)) files.push(unionFile(type, ctx));
    // mapping-less union / alias: no dedicated class (refs resolve to Object).
  }
  return files;
}

/**
 * A mapped discriminated union: a holder class whose `fromJson` peeks the
 * discriminator property and decodes the concrete variant (mirrors the Go
 * emitter's Unmarshal<Union>JSON). An unknown/absent discriminator keeps the
 * raw parsed value so no data is lost. The union type itself stays `Object`
 * (variants are heterogeneous) — this class exists only for the decode.
 */
function unionFile(type: NamedType, ctx: JavaCtx): GeneratedFile {
  const name = pascalCase(type.name);
  const mapped = unionMapping(type)!;
  const entries = Object.entries(mapped.mapping).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const cases = entries
    .map(
      ([value, variant]) =>
        `    if (${JSON.stringify(value)}.equals(discriminator)) {\n` +
        `      return ${pascalCase(variant)}.fromJson(json);\n` +
        `    }`,
    )
    .join('\n');

  const doc = javaDoc(
    type.description ||
      `Decode helper for the ${name} union, selecting the concrete variant by its ${JSON.stringify(mapped.property)} discriminator.`,
  );
  const head = doc ? `${doc}\n` : '';
  const body =
    `${head}public final class ${name} {\n` +
    `  private ${name}() {\n  }\n\n` +
    `  /**\n` +
    `   * Decode JSON into the concrete ${name} variant selected by the ${JSON.stringify(mapped.property)}\n` +
    `   * discriminator. An unknown or absent discriminator keeps the raw parsed value.\n` +
    `   */\n` +
    `  public static Object fromJson(Object json) {\n` +
    `    if (!(json instanceof Map)) {\n      return json;\n    }\n` +
    `    Object discriminator = ((Map<?, ?>) json).get(${JSON.stringify(mapped.property)});\n` +
    `${cases}\n` +
    `    return json;\n` +
    `  }\n}`;
  return { path: `${ctx.srcDir}${name}.java`, content: javaFile(ctx.fullPackage, ['java.util.Map'], body) };
}

function structFile(type: NamedType, ctx: JavaCtx): GeneratedFile {
  const name = pascalCase(type.name);
  const fields = type.fields || [];
  const fieldTypes = fields.map((f) => javaType(f.type, ctx.types));

  const imports = ['java.util.LinkedHashMap', 'java.util.Map'];
  if (fieldTypes.some((t) => t.includes('List<'))) imports.push('java.util.List');

  const doc = javaDoc(type.description);
  const head = doc ? `${doc}\n` : '';

  const fieldDecls = fields.map((f, i) => `  private ${fieldTypes[i]} ${camelCase(f.name)};`).join('\n');
  const accessors = fields
    .map((f, i) => `  public ${fieldTypes[i]} ${camelCase(f.name)}() {\n    return ${camelCase(f.name)};\n  }`)
    .join('\n\n');

  const fromJson = structFromJson(name, fields, ctx);
  const toJsonMap = structToJsonMap(fields);

  const bodyParts = fields.length
    ? [fieldDecls, accessors, fromJson, toJsonMap]
    : [emptyFromJson(name), emptyToJsonMap()];

  const body = `${head}public final class ${name} implements Json.JsonSerializable {\n${bodyParts.join('\n\n')}\n}`;
  return { path: `${ctx.srcDir}${name}.java`, content: javaFile(ctx.fullPackage, imports, body) };
}

function structFromJson(name: string, fields: Field[], ctx: JavaCtx): string {
  const assigns = fields
    .map((f) => `    out.${camelCase(f.name)} = ${javaDecode(f.type, `map.get(${JSON.stringify(f.name)})`, ctx.types)};`)
    .join('\n');
  return (
    `  public static ${name} fromJson(Object json) {\n` +
    `    if (json == null) {\n      return null;\n    }\n` +
    `    @SuppressWarnings("unchecked")\n` +
    `    Map<String, Object> map = (Map<String, Object>) json;\n` +
    `    ${name} out = new ${name}();\n` +
    `${assigns}\n` +
    `    return out;\n` +
    `  }`
  );
}

function structToJsonMap(fields: Field[]): string {
  const puts = fields
    .map((f) => {
      const member = camelCase(f.name);
      const key = JSON.stringify(f.name);
      // Const-valued fields are auto-filled with the fixed literal when the
      // caller left them null (mirrors the Go emitter's const auto-fill).
      if (isConstField(f)) return `    map.put(${key}, ${member} != null ? ${member} : ${constLiteral((f.type as { const?: unknown }).const)});`;
      if (f.required) return `    map.put(${key}, ${member});`;
      return `    if (${member} != null) {\n      map.put(${key}, ${member});\n    }`;
    })
    .join('\n');
  return (
    `  @Override\n` +
    `  public Map<String, Object> toJsonMap() {\n` +
    `    Map<String, Object> map = new LinkedHashMap<>();\n` +
    `${puts}\n` +
    `    return map;\n` +
    `  }`
  );
}

function emptyFromJson(name: string): string {
  return (
    `  public static ${name} fromJson(Object json) {\n` +
    `    return json == null ? null : new ${name}();\n` +
    `  }`
  );
}

function emptyToJsonMap(): string {
  return (
    `  @Override\n` +
    `  public Map<String, Object> toJsonMap() {\n` +
    `    return new LinkedHashMap<>();\n` +
    `  }`
  );
}

function enumFile(type: NamedType, ctx: JavaCtx): GeneratedFile {
  const name = pascalCase(type.name);
  const isInt = type.base === 'integer';
  const valueType = isInt ? 'long' : 'String';
  const values = type.values || [];

  const doc = javaDoc(type.description);
  const head = doc ? `${doc}\n` : '';

  const members = values.length
    ? `${values.map((v) => `  ${enumMember(name, v)}(${enumLiteral(v.value, isInt)})`).join(',\n')};`
    : '  ;';

  const equalsExpr = isInt ? 'item.value == value' : 'item.value.equals(value)';
  const coerce = isInt ? 'Json.asLong(json)' : 'Json.asString(json)';

  const body =
    `${head}public enum ${name} implements Json.JsonEnum {\n` +
    `${members}\n\n` +
    `  private final ${valueType} value;\n\n` +
    `  ${name}(${valueType} value) {\n    this.value = value;\n  }\n\n` +
    `  public ${valueType} value() {\n    return value;\n  }\n\n` +
    `  @Override\n  public Object jsonValue() {\n    return value;\n  }\n\n` +
    `  public static ${name} fromValue(${valueType} value) {\n` +
    `    for (${name} item : values()) {\n` +
    `      if (${equalsExpr}) {\n        return item;\n      }\n    }\n` +
    `    throw new IllegalArgumentException("unknown ${name} value: " + value);\n` +
    `  }\n\n` +
    `  public static ${name} fromJson(Object json) {\n` +
    `    return json == null ? null : fromValue(${coerce});\n` +
    `  }\n}`;

  return { path: `${ctx.srcDir}${name}.java`, content: javaFile(ctx.fullPackage, [], body) };
}

function enumMember(enumName: string, value: EnumValue): string {
  const member = screamingSnakeCase(String(value.name ?? value.value));
  return member || 'VALUE';
}

function enumLiteral(value: unknown, isInt: boolean): string {
  if (isInt) return String(value);
  return JSON.stringify(String(value));
}
