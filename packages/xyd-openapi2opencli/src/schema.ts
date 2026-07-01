import type { OpenAPIV3 } from 'openapi-types';

export type Schema = OpenAPIV3.SchemaObject;

const SCALAR_TYPES = new Set(['string', 'number', 'integer', 'boolean']);

/** The scalar type of a schema, or null if it isn't a scalar. */
export function scalarType(schema: Schema | undefined): string | null {
  if (!schema) return null;
  const t = typeof schema.type === 'string' ? schema.type : undefined;
  if (t && SCALAR_TYPES.has(t)) return t;
  return null;
}

export function isScalar(schema: Schema | undefined): boolean {
  return scalarType(schema) !== null;
}

export function isBoolean(schema: Schema | undefined): boolean {
  return scalarType(schema) === 'boolean';
}

export function isArray(schema: Schema | undefined): boolean {
  return !!schema && schema.type === 'array';
}

export function arrayItems(schema: Schema | undefined): Schema | undefined {
  if (!schema || schema.type !== 'array') return undefined;
  return schema.items as Schema | undefined;
}

/** True when the schema is an object (explicit type or has properties). */
export function isObjectSchema(schema: Schema | undefined): boolean {
  if (!schema) return false;
  if (schema.type === 'object') return true;
  if (schema.properties && Object.keys(schema.properties).length > 0) return true;
  return false;
}

/** Enum values rendered as strings (undefined when not an enum). */
export function getEnum(schema: Schema | undefined): string[] | undefined {
  if (!schema || !Array.isArray(schema.enum) || schema.enum.length === 0) return undefined;
  return schema.enum.map((v) => String(v));
}

export function getDefault(schema: Schema | undefined): unknown {
  if (!schema) return undefined;
  return (schema as { default?: unknown }).default;
}

export function getDescription(schema: Schema | undefined): string | undefined {
  return schema?.description;
}

/**
 * Merge an `allOf` chain into a single object schema (properties + required).
 * Non-allOf schemas are returned unchanged.
 */
export function mergeAllOf(schema: Schema | undefined, seen: WeakSet<object> = new WeakSet()): Schema | undefined {
  if (!schema || !Array.isArray(schema.allOf) || schema.allOf.length === 0) return schema;
  // Guard against allOf cycles in dereferenced (possibly circular) schemas.
  if (seen.has(schema)) return schema;
  seen.add(schema);

  const merged: Schema = { type: 'object', properties: {}, required: [] };
  const required = new Set<string>(Array.isArray(schema.required) ? schema.required : []);

  for (const sub of schema.allOf as Schema[]) {
    const resolved = mergeAllOf(sub, seen) ?? sub;
    if (resolved.properties) {
      Object.assign(merged.properties as Record<string, unknown>, resolved.properties);
    }
    if (Array.isArray(resolved.required)) {
      for (const r of resolved.required) required.add(r);
    }
  }
  // Properties declared directly alongside allOf
  if (schema.properties) {
    Object.assign(merged.properties as Record<string, unknown>, schema.properties);
  }
  merged.required = [...required];
  if (schema.description) merged.description = schema.description;
  return merged;
}

/**
 * Resolve a body schema to the object schema we can flatten, plus a flag telling
 * whether the original was a non-trivial composition (oneOf/anyOf) we only
 * partially captured.
 */
export function resolveObjectSchema(schema: Schema | undefined): { object?: Schema; complex: boolean } {
  if (!schema) return { complex: false };

  const merged = mergeAllOf(schema) ?? schema;
  if (isObjectSchema(merged)) return { object: merged, complex: false };

  // oneOf / anyOf at the body root: take the first object branch, mark complex.
  const branches = (merged.oneOf || merged.anyOf) as Schema[] | undefined;
  if (Array.isArray(branches)) {
    for (const branch of branches) {
      const b = mergeAllOf(branch) ?? branch;
      if (isObjectSchema(b)) return { object: b, complex: true };
    }
    return { complex: true };
  }

  return { complex: false };
}

/** True for a binary/file string property (multipart uploads). */
export function isBinary(schema: Schema | undefined): boolean {
  return !!schema && schema.type === 'string' && schema.format === 'binary';
}
