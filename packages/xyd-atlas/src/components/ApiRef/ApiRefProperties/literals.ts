import {
  DEFINED_DEFINITION_PROPERTY_TYPE,
  type DefinitionProperty,
} from "@xyd-js/uniform";

/** How many enum values the type column prints inline before it collapses to
 * `…` — the full list stays behind the row's "Show possible types" toggle. */
export const ENUM_INLINE_LIMIT = 6;

function metaValue(property: DefinitionProperty, name: string): unknown {
  const meta = property.meta?.find((m) => m.name === name);
  return meta ? meta.value : undefined;
}

/** The `const` meta — the literal of a single-value enum or an OpenAPI 3.1
 * `const` — when the converter emitted one. */
export function constOf(
  property: DefinitionProperty
): { value: unknown } | null {
  if (!property?.meta?.some((m) => m.name === "const")) {
    return null;
  }

  return { value: metaValue(property, "const") };
}

/** A row that holds exactly one value. Its only child is that value, which the
 * type column already prints, so the row never needs a toggle. */
export function isConstant(property: DefinitionProperty): boolean {
  return (
    property?.type === DEFINED_DEFINITION_PROPERTY_TYPE.ENUM &&
    constOf(property) !== null
  );
}

/** The enum's base type (the `enum-type` meta), when the converter knows it. */
function enumTypeOf(property: DefinitionProperty): string | undefined {
  const value = metaValue(property, "enum-type");

  return typeof value === "string" ? value : undefined;
}

/** One value as a document writes it: strings quoted (`"widget"`); numbers,
 * booleans and the other kinds as they are (`2`, `true`). An enum whose base
 * type is unknown is read as strings. */
export function formatLiteral(value: unknown, enumType?: string): string {
  if (typeof value === "string") {
    return enumType === undefined || enumType === "string"
      ? JSON.stringify(value)
      : value;
  }

  if (value === null || value === undefined) {
    return "null";
  }

  return String(value);
}

/** The literals of an enum row: the `const` value alone, else the children
 * (one per value) in order. Empty for anything that is not an enum with values. */
export function enumLiterals(property: DefinitionProperty): string[] {
  if (property?.type !== DEFINED_DEFINITION_PROPERTY_TYPE.ENUM) {
    return [];
  }

  const enumType = enumTypeOf(property);
  const constant = constOf(property);

  if (constant) {
    return [formatLiteral(constant.value, enumType)];
  }

  return (property.properties || []).map((value) =>
    formatLiteral(String(value.name ?? ""), enumType)
  );
}

/** The type-column text of an enum row: `"a" | "b" | "c"`; the first `limit`
 * values then `…` for a long one; the literal alone for a constant. Empty when
 * the row is not an enum with values, so the caller falls back to the type. */
export function enumInlineSymbol(
  property: DefinitionProperty,
  limit: number = ENUM_INLINE_LIMIT
): string {
  const literals = enumLiterals(property);

  if (!literals.length) {
    return "";
  }

  if (literals.length > limit) {
    return [...literals.slice(0, limit), "…"].join(" | ");
  }

  return literals.join(" | ");
}
