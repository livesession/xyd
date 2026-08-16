import type { OpenAPIV3 } from 'openapi-types';

// openapi-types is 3.0-shaped (SchemaObject.type is a single string), but the
// openai spec is 3.1 (type can be an array like ["string","null"], and `const`
// is a single-value enum). We model schemas loosely to span both — a plain bag,
// not the strict OpenAPIV3.SchemaObject (whose narrow `type` union collapses an
// intersection).
export interface Schema {
  type?: string | string[];
  format?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  items?: unknown;
  enum?: unknown[];
  const?: unknown;
  allOf?: unknown[];
  oneOf?: unknown[];
  anyOf?: unknown[];
  additionalProperties?: unknown;
  nullable?: boolean;
  description?: string;
  default?: unknown;
  discriminator?: OpenAPIV3.DiscriminatorObject;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  examples?: unknown[];
  [k: string]: unknown;
}

const SCALAR_TYPES = new Set(['string', 'number', 'integer', 'boolean']);

/** The declared type(s) with any `"null"` stripped (3.1 nullable union). */
export function nonNullTypes(schema: Schema | undefined): string[] {
  if (!schema?.type) return [];
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  return types.filter((t) => t !== 'null');
}

/** True when the schema permits `null` (3.0 `nullable` or 3.1 `type:[...,"null"]`). */
export function isNullable(schema: Schema | undefined): boolean {
  if (!schema) return false;
  if ((schema as { nullable?: boolean }).nullable === true) return true;
  return Array.isArray(schema.type) && schema.type.includes('null');
}

/** The scalar type of a schema, or null if it isn't a scalar. */
export function scalarType(schema: Schema | undefined): string | null {
  const t = nonNullTypes(schema)[0];
  return t && SCALAR_TYPES.has(t) ? t : null;
}

export function isScalar(schema: Schema | undefined): boolean {
  return scalarType(schema) !== null;
}

export function isArray(schema: Schema | undefined): boolean {
  return nonNullTypes(schema).includes('array');
}

export function arrayItems(schema: Schema | undefined): Schema | undefined {
  if (!isArray(schema)) return undefined;
  return schema?.items as Schema | undefined;
}

/** The additionalProperties value schema for a map-shaped object (or undefined). */
export function mapValues(schema: Schema | undefined): Schema | undefined {
  const ap = (schema as { additionalProperties?: unknown } | undefined)?.additionalProperties;
  if (ap && typeof ap === 'object') return ap as Schema;
  return undefined;
}

/** True when the schema is an object (explicit type or has properties). */
export function isObjectSchema(schema: Schema | undefined): boolean {
  if (!schema) return false;
  if (nonNullTypes(schema).includes('object')) return true;
  if (schema.properties && Object.keys(schema.properties).length > 0) return true;
  return false;
}

/** Enum values (undefined when not an enum). Includes 3.1 `const` as a 1-value enum. */
export function getEnum(schema: Schema | undefined): unknown[] | undefined {
  if (!schema) return undefined;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum;
  if (schema.const !== undefined) return [schema.const];
  return undefined;
}

export function getDefault(schema: Schema | undefined): unknown {
  return (schema as { default?: unknown } | undefined)?.default;
}

export function getDescription(schema: Schema | undefined): string | undefined {
  return schema?.description;
}

/** True for a binary/file string property (multipart uploads). */
export function isBinary(schema: Schema | undefined): boolean {
  return nonNullTypes(schema).includes('string') && schema?.format === 'binary';
}

/** Resolves an allOf member that is a `$ref` (possibly chained) to its raw schema. */
export type RefResolver = (member: unknown) => Schema | undefined;

/**
 * Merge an `allOf` chain into a single object schema (properties + required).
 * Non-allOf schemas are returned unchanged. Guards against allOf cycles.
 *
 * On the raw (un-dereferenced) document a member can be a `$ref` — pass
 * `resolveRef` (the SymbolTable supplies one) so inherited fields survive;
 * without it a `$ref` member contributes nothing (base fields are DROPPED).
 */
export function mergeAllOf(
  schema: Schema | undefined,
  resolveRef?: RefResolver,
  seen: WeakSet<object> = new WeakSet(),
): Schema | undefined {
  if (!schema || !Array.isArray(schema.allOf) || schema.allOf.length === 0) return schema;
  if (seen.has(schema)) return schema;
  seen.add(schema);

  const merged: Schema = { type: 'object', properties: {}, required: [] };
  const required = new Set<string>(Array.isArray(schema.required) ? schema.required : []);

  for (const raw of schema.allOf) {
    const sub = resolveRef?.(raw) ?? (raw as Schema);
    if (!sub || typeof sub !== 'object' || seen.has(sub)) continue;
    const resolved = mergeAllOf(sub, resolveRef, seen) ?? sub;
    if (resolved.properties) {
      Object.assign(merged.properties as Record<string, unknown>, resolved.properties);
    }
    if (Array.isArray(resolved.required)) {
      for (const r of resolved.required) required.add(r);
    }
  }
  if (schema.properties) {
    Object.assign(merged.properties as Record<string, unknown>, schema.properties);
  }
  merged.required = [...required];
  if (schema.description) merged.description = schema.description;
  return merged;
}
