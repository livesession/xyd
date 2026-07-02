import type { EnumValue, Field, NamedType, OpensdkSpecJson, TypeRef } from '@xyd-js/opensdk-core';

import { goType } from './gotype';
import { goDoc, goField, goFile, Imports, goStruct } from './gowriter';
import { pascalCase } from './naming';

/**
 * Emit `types.go`: every named type in the symbol table as a Go declaration.
 * Structs become response-shaped Go structs (plain fields + json tags); enums
 * become `type X string` + a const block; unions/aliases get pragmatic v1 shapes.
 */
export function renderTypesFile(spec: OpensdkSpecJson, pkg: string): string {
  const imports = new Imports();
  const decls: string[] = [];
  for (const type of spec.types || []) {
    decls.push(renderNamedType(type, imports));
  }
  return goFile(pkg, imports, decls);
}

function renderNamedType(type: NamedType, imports: Imports): string {
  switch (type.kind) {
    case 'enum':
      return renderEnum(type);
    case 'alias':
      return renderAlias(type);
    case 'union':
      return renderUnion(type, imports);
    default:
      return renderStruct(type);
  }
}

/** Whether a field's type is a fixed-literal scalar (JSON Schema const / 1-value enum). */
export function isConstField(field: Field): boolean {
  const ref = field.type as TypeRef | undefined;
  return ref?.kind === 'scalar' && ref.const !== undefined;
}

/** The package-level constant name for a struct field's fixed literal. */
export function constFieldName(typeName: string, fieldName: string): string {
  return `${pascalCase(typeName)}${pascalCase(fieldName)}Const`;
}

/** The Go literal for a const scalar value (string quoted, number/bool verbatim). */
export function goConstLiteral(value: unknown): string {
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(String(value));
}

/** The Go zero-value literal for a scalar Go type (for const auto-fill guards). */
export function goZeroLiteral(goScalar: string): string {
  if (goScalar === 'string') return '""';
  if (goScalar === 'bool') return 'false';
  return '0';
}

function renderStruct(type: NamedType): string {
  const name = pascalCase(type.name);
  const fields = (type.fields || []).map((f) => {
    const goName = pascalCase(f.name);
    const tag = `json:${JSON.stringify(f.name)}`;
    // A const field stays its plain scalar type — response decode leaves it a
    // plain field; request marshaling auto-fills it (see service.ts).
    return goField(goName, goType(f.type), tag);
  });
  const decls = [goStruct(name, fields, goDoc(type.description, name))];
  // Surface each fixed literal as a package-level constant for reference.
  for (const f of type.fields || []) {
    if (!isConstField(f)) continue;
    const ident = constFieldName(type.name, f.name);
    const doc =
      `// ${ident} is the fixed value of ${name}.${pascalCase(f.name)}. Request\n` +
      `// marshaling auto-fills it when the field is zero; response decoding\n` +
      `// leaves it a plain field.`;
    decls.push(`${doc}\nconst ${ident} ${goType(f.type)} = ${goConstLiteral((f.type as TypeRef).const)}`);
  }
  return decls.join('\n\n');
}

function renderEnum(type: NamedType): string {
  const name = pascalCase(type.name);
  const base = type.base === 'integer' ? 'int64' : 'string';
  const doc = goDoc(type.description, name);
  const head = `${doc ? `${doc}\n` : ''}type ${name} ${base}`;

  const values = type.values || [];
  if (values.length === 0) return head;

  const consts = values.map((v) => `\t${constName(name, v)} ${name} = ${literal(v.value, base)}`).join('\n');
  return `${head}\n\nconst (\n${consts}\n)`;
}

function constName(typeName: string, value: EnumValue): string {
  if (value.name) return pascalCase(value.name);
  return `${typeName}${pascalCase(String(value.value))}`;
}

function literal(value: unknown, base: string): string {
  if (base === 'int64') return String(value);
  return JSON.stringify(String(value));
}

function renderAlias(type: NamedType): string {
  const name = pascalCase(type.name);
  const doc = goDoc(type.description, name);
  return `${doc ? `${doc}\n` : ''}type ${name} = ${goType(type.of)}`;
}

/** The mapped discriminator of a union (propertyName + non-empty mapping), else null. */
export function unionMapping(type: NamedType): { property: string; mapping: Record<string, string> } | null {
  if (type.kind !== 'union') return null;
  const disc = type.discriminator;
  if (!disc?.propertyName || !disc.mapping || Object.keys(disc.mapping).length === 0) return null;
  return { property: disc.propertyName, mapping: disc.mapping };
}

/** The generated decode helper name for a mapped union, e.g. `UnmarshalShapeJSON`. */
export function unionUnmarshalerName(type: NamedType): string {
  return `Unmarshal${pascalCase(type.name)}JSON`;
}

function renderUnion(type: NamedType, imports: Imports): string {
  // A union is emitted as an open interface (any variant satisfies it). A union
  // with a mapped discriminator additionally gets an Unmarshal<Union>JSON helper
  // that decodes the concrete variant; a mapping-less union stays as-is.
  const name = pascalCase(type.name);
  const doc = goDoc(type.description, name);
  const decl = `${doc ? `${doc}\n` : ''}type ${name} interface{}`;

  const mapped = unionMapping(type);
  if (!mapped) return decl;
  imports.add('encoding/json');

  // Sorted for deterministic output regardless of IR key order.
  const entries = Object.entries(mapped.mapping).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const cases = entries
    .map(
      ([value, variant]) =>
        `\tcase ${JSON.stringify(value)}:\n` +
        `\t\tvar variant ${pascalCase(variant)}\n` +
        `\t\tif err := json.Unmarshal(data, &variant); err != nil {\n` +
        `\t\t\treturn nil, err\n\t\t}\n` +
        `\t\treturn variant, nil`,
    )
    .join('\n');

  const helperDoc =
    `// ${unionUnmarshalerName(type)} decodes JSON into the concrete ${name} variant selected\n` +
    `// by the ${JSON.stringify(mapped.property)} discriminator property. An unknown (or absent)\n` +
    `// discriminator value retains the raw JSON as a json.RawMessage so no data is lost.`;
  const helper =
    `${helperDoc}\n` +
    `func ${unionUnmarshalerName(type)}(data []byte) (${name}, error) {\n` +
    `\tvar probe struct {\n` +
    `\t\tDiscriminator string ${'`'}json:${JSON.stringify(mapped.property)}${'`'}\n` +
    `\t}\n` +
    `\tif err := json.Unmarshal(data, &probe); err != nil {\n` +
    `\t\treturn nil, err\n\t}\n` +
    `\tswitch probe.Discriminator {\n${cases}\n\t}\n` +
    `\treturn json.RawMessage(append([]byte(nil), data...)), nil\n` +
    `}`;

  return `${decl}\n\n${helper}`;
}
