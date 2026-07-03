import type { OpenAPIV3 } from 'openapi-types';
import type { Discriminator, EnumValue, Field, NamedType, TypeRef } from '@xyd-js/opensdk-core';

import { pascalCase } from './naming';
import {
  type Schema,
  arrayItems,
  getDefault,
  getDescription,
  getEnum,
  isArray,
  isBinary,
  isNullable,
  isObjectSchema,
  mapValues,
  mergeAllOf,
  nonNullTypes,
  scalarType,
} from './schema';
import { uniqueName } from './unique';

/** A raw schema OR a `$ref` to one (we work on the un-dereferenced doc). */
export type SchemaOrRef = Schema | OpenAPIV3.ReferenceObject;

function isRef(s: SchemaOrRef | undefined): s is OpenAPIV3.ReferenceObject {
  return !!s && typeof s === 'object' && '$ref' in s && typeof (s as { $ref: unknown }).$ref === 'string';
}

/** The component key of a `#/components/schemas/Name` ref (else undefined). */
function componentKey(ref: string): string | undefined {
  const m = ref.match(/#\/components\/schemas\/(.+)$/);
  return m ? m[1] : undefined;
}

/** A `{type:'null'}` / `const: null` / `enum: [null]` union variant. */
function isNullVariant(v: SchemaOrRef): boolean {
  if (isRef(v)) return false;
  const s = v as Schema;
  if (s.const === null) return true;
  if (Array.isArray(s.enum) && s.enum.length === 1 && s.enum[0] === null) return true;
  const types = Array.isArray(s.type) ? s.type : s.type ? [s.type] : [];
  return types.length > 0 && types.every((t) => t === 'null');
}

/** Drop null-only variants; they mark the union reference nullable instead. */
function splitNullVariants(variants: SchemaOrRef[]): { kept: SchemaOrRef[]; nullable: boolean } {
  const kept = variants.filter((v) => !isNullVariant(v));
  return { kept, nullable: kept.length !== variants.length };
}

/** The single string const of a schema (`const` or a 1-value enum), else undefined. */
function stringConst(s: Schema | undefined): string | undefined {
  const values = getEnum(s);
  return values && values.length === 1 && typeof values[0] === 'string' ? values[0] : undefined;
}

/** JSON with object keys sorted, so structurally equal bodies hash equal. */
function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  if (v && typeof v === 'object') {
    const entries = Object.keys(v as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(v) ?? 'null';
}

/** Structural hash of a NamedType body — name/description excluded. */
function structuralKey(t: NamedType): string {
  const { name: _name, description: _description, ...body } = t;
  return stableStringify(body);
}

/**
 * The nominal symbol table: resolves OpenAPI schemas (component `$ref`s and
 * inline objects/enums/unions) into named types, so a generator can emit named
 * structs/enums/unions instead of the CLI's flattened bag of flags.
 *
 * Works on the RAW (un-dereferenced) document so component identity survives —
 * a `$ref` becomes a `{kind:"ref"}` (never inlined), and self/circular refs are
 * handled naturally by reserving a type name before building its body.
 */
export class SymbolTable {
  /** name -> NamedType, insertion-ordered. */
  private readonly types = new Map<string, NamedType>();
  private readonly used = new Set<string>();
  /** component key -> assigned type name (dedupe repeated refs). */
  private readonly byComponent = new Map<string, string>();
  /** structural hash -> hoisted type name (inline dedup; components stay out). */
  private readonly byShape = new Map<string, string>();
  private readonly schemas: Record<string, SchemaOrRef>;

  constructor(doc: OpenAPIV3.Document) {
    this.schemas = (doc.components?.schemas ?? {}) as Record<string, SchemaOrRef>;
  }

  /** All named types in resolution order. */
  emit(): NamedType[] {
    return [...this.types.values()];
  }

  /** Look up an already-built named type (e.g. to resolve a pagination item type). */
  get(name: string): NamedType | undefined {
    return this.types.get(name);
  }

  /** Follow a `$ref` chain through components.schemas to its raw schema. */
  private resolveRefSchema = (member: unknown): Schema | undefined => {
    const visited = new Set<string>();
    let current = member as SchemaOrRef | undefined;
    while (isRef(current)) {
      const key = componentKey(current.$ref);
      if (!key || visited.has(key)) return undefined;
      visited.add(key);
      current = this.schemas[key];
    }
    return isRef(member as SchemaOrRef) ? (current as Schema | undefined) : undefined;
  };

  /** mergeAllOf with `$ref` members resolved against the components (inherited fields survive). */
  private mergedAllOf(s: Schema): Schema {
    return mergeAllOf(s, this.resolveRefSchema) ?? s;
  }

  /**
   * Resolve a schema (following `$ref` chains) and flatten any allOf
   * composition into its effective object shape. Used by consumers that need
   * a schema's REAL properties (e.g. pagination envelope detection) without
   * minting a named type.
   */
  resolveObjectSchema(schema: SchemaOrRef | undefined): Schema | undefined {
    if (!schema) return undefined;
    const raw = isRef(schema) ? this.resolveRefSchema(schema) : (schema as Schema);
    if (!raw) return undefined;
    return this.mergedAllOf(raw);
  }

  /**
   * Detect the `allOf: [$ref X, {nullable/description-only}]` wrapper pattern:
   * exactly one `$ref` member and no member contributing structure. Returns the
   * ref key so the wrapper stays a (nullable) reference instead of degrading to
   * an empty flattened struct.
   */
  private wrapperRefKey(s: Schema): { key: string; nullable: boolean } | undefined {
    if (!Array.isArray(s.allOf) || s.allOf.length === 0) return undefined;
    if (s.properties && Object.keys(s.properties).length > 0) return undefined;
    let key: string | undefined;
    let nullable = isNullable(s);
    for (const member of s.allOf as SchemaOrRef[]) {
      if (isRef(member)) {
        if (key) return undefined; // two refs -> real composition, flatten it
        key = componentKey(member.$ref);
        if (!key) return undefined;
        continue;
      }
      const m = member as Schema;
      const structural =
        (m.properties && Object.keys(m.properties).length > 0) ||
        m.enum !== undefined ||
        m.const !== undefined ||
        m.oneOf ||
        m.anyOf ||
        m.allOf ||
        m.items ||
        m.additionalProperties !== undefined;
      if (structural) return undefined;
      if (isNullable(m)) nullable = true;
    }
    return key ? { key, nullable } : undefined;
  }

  /**
   * Resolve a schema (or `$ref`) into a structural TypeRef. Inline
   * objects/enums/unions are hoisted into the table under a deterministic name
   * derived from `hint`.
   */
  resolveTypeRef(schema: SchemaOrRef | undefined, hint: string): TypeRef {
    if (!schema) return { kind: 'any' };

    if (isRef(schema)) {
      const key = componentKey(schema.$ref);
      if (key) return { kind: 'ref', name: this.registerComponent(key) };
      return { kind: 'any' };
    }

    const s = schema as Schema;
    const nullable = isNullable(s);

    // single-value const / 1-value enum -> a literal scalar, NOT a one-off named enum
    const enumValues = getEnum(s);
    if (enumValues && enumValues.length === 1) {
      if (enumValues[0] === null) return this.maybeNull({ kind: 'any' }, true);
      return this.maybeNull(this.constScalar(s, enumValues[0]), nullable);
    }

    // enum -> a named enum
    if (enumValues) {
      const name = this.hoist(hint, (self) => this.buildEnum(s, enumValues, self));
      return this.maybeNull({ kind: 'ref', name }, nullable);
    }

    // oneOf / anyOf -> a named union (null variants mark the ref nullable)
    const union = (s.oneOf || s.anyOf) as SchemaOrRef[] | undefined;
    if (Array.isArray(union) && union.length) {
      const { kept, nullable: nullVariant } = splitNullVariants(union);
      if (kept.length === 0) return this.maybeNull({ kind: 'any' }, true);
      if (kept.length === 1) {
        // `oneOf: [T, null]` is not a union — it's a nullable T.
        return this.maybeNull(this.resolveTypeRef(kept[0], hint), nullable || nullVariant);
      }
      const name = this.hoist(hint, (self) => this.buildUnion(self, s, kept));
      return this.maybeNull({ kind: 'ref', name }, nullable || nullVariant);
    }

    // array
    if (isArray(s)) {
      return this.maybeNull({ kind: 'array', items: this.resolveTypeRef(arrayItems(s), `${hint}Item`) }, nullable);
    }

    // scalar
    const scalar = scalarType(s);
    if (scalar) {
      const ref: TypeRef = { kind: 'scalar', scalar };
      if (s.format) ref.format = s.format;
      return this.maybeNull(ref, nullable);
    }

    // allOf wrapper around a single $ref -> a (nullable) reference, not a flatten
    const wrapper = this.wrapperRefKey(s);
    if (wrapper) {
      return this.maybeNull({ kind: 'ref', name: this.registerComponent(wrapper.key) }, nullable || wrapper.nullable);
    }

    // map (typed additionalProperties, or a freeform object) with no fixed properties
    const merged = this.mergedAllOf(s);
    const asMap = this.mapRef(merged, hint);
    if (asMap) return this.maybeNull(asMap, nullable);

    // object (inline) -> a named struct
    if (isObjectSchema(merged) || merged.allOf) {
      const name = this.hoist(hint, (self) => this.buildStruct(self, merged));
      return this.maybeNull({ kind: 'ref', name }, nullable);
    }

    return this.maybeNull({ kind: 'any' }, nullable);
  }

  /**
   * A map TypeRef for an object with no fixed properties: a typed
   * `additionalProperties` schema keeps its value type, and a FREEFORM object
   * (`type: object` with additionalProperties absent, or `additionalProperties:
   * true`) becomes `map<any>` — matching openai-go's `map[string]any` for e.g.
   * FunctionParameters. `additionalProperties: false` stays a (empty) struct.
   */
  private mapRef(merged: Schema, hint: string): TypeRef | undefined {
    const hasProps = merged.properties && Object.keys(merged.properties).length > 0;
    if (hasProps) return undefined;
    const valueSchema = mapValues(merged);
    if (valueSchema) return { kind: 'map', values: this.resolveTypeRef(valueSchema as SchemaOrRef, `${hint}Value`) };
    const ap = merged.additionalProperties;
    if (ap === true || (ap === undefined && isObjectSchema(merged))) {
      return { kind: 'map', values: { kind: 'any' } };
    }
    return undefined;
  }

  private maybeNull(ref: TypeRef, nullable: boolean): TypeRef {
    if (nullable) ref.nullable = true;
    return ref;
  }

  /** Register a component `$ref` target, building it once. Returns its type name. */
  private registerComponent(key: string): string {
    const existing = this.byComponent.get(key);
    if (existing) return existing;

    const name = uniqueName(pascalCase(key), this.used);
    this.byComponent.set(key, name);
    // Reserve a placeholder so self/circular refs resolve before the body is built.
    this.types.set(name, { name, kind: 'struct' });

    const schema = this.schemas[key];
    const built = this.buildFromSchema(name, schema);
    this.types.set(name, built);
    return name;
  }

  /** Hoist an inline type under a fresh name derived from `hint`, building it. */
  private hoist(hint: string, build: (self: string) => NamedType): string {
    const name = uniqueName(pascalCase(hint) || 'Type', this.used);
    this.types.set(name, { name, kind: 'struct' }); // placeholder for self-refs
    const built = build(name);
    built.name = name; // the hoisted name is authoritative — never trust the builder to set it

    // Inline dedup: a hoisted body structurally identical (name/description
    // excluded) to an earlier hoisted one reuses it instead of minting an
    // Error2/Conversation2 phantom. Rolling the mint back is safe — no other
    // type can reference a hoisted name (inline schemas have no `$ref` to them),
    // and children hoisted while building were deduped first, depth-first.
    // Components stay out of the index: their identity matters.
    const shape = structuralKey(built);
    const existing = this.byShape.get(shape);
    if (existing) {
      this.types.delete(name);
      this.used.delete(name);
      return existing;
    }
    this.byShape.set(shape, name);
    this.types.set(name, built);
    return name;
  }

  /** Classify a (raw) schema into a NamedType body under an already-reserved `name`. */
  private buildFromSchema(name: string, schema: SchemaOrRef | undefined): NamedType {
    if (!schema || isRef(schema)) {
      // A component that is itself a bare `$ref` -> an alias.
      const of = this.resolveTypeRef(schema, name);
      return { name, kind: 'alias', of };
    }
    const s = schema as Schema;

    const enumValues = getEnum(s);
    // a component-level standalone const -> an alias of the literal scalar
    if (enumValues && enumValues.length === 1) {
      if (enumValues[0] === null) return { name, kind: 'alias', of: { kind: 'any', nullable: true } };
      const of = this.constScalar(s, enumValues[0]);
      if (isNullable(s)) of.nullable = true;
      const alias: NamedType = { name, kind: 'alias', of };
      if (getDescription(s)) alias.description = getDescription(s);
      return alias;
    }
    if (enumValues) return this.buildEnum(s, enumValues, name);

    const union = (s.oneOf || s.anyOf) as SchemaOrRef[] | undefined;
    if (Array.isArray(union) && union.length) {
      const { kept, nullable: nullVariant } = splitNullVariants(union);
      if (kept.length === 0) return { name, kind: 'alias', of: { kind: 'any', nullable: true } };
      if (kept.length === 1) {
        // `oneOf: [T, null]` component -> the component IS a (nullable) T
        if (isRef(kept[0])) {
          const of = this.resolveTypeRef(kept[0], name);
          if (nullVariant) of.nullable = true;
          return { name, kind: 'alias', of };
        }
        const built = this.buildFromSchema(name, kept[0]);
        if (nullVariant && built.kind === 'alias' && built.of) built.of.nullable = true;
        return built;
      }
      return this.buildUnion(name, s, kept);
    }

    // a component that is itself an allOf wrapper around one $ref -> alias
    const wrapper = this.wrapperRefKey(s);
    if (wrapper) {
      const of: TypeRef = { kind: 'ref', name: this.registerComponent(wrapper.key) };
      if (wrapper.nullable) of.nullable = true;
      return { name, kind: 'alias', of };
    }

    const merged = this.mergedAllOf(s);
    // a component-level bare/freeform object -> an alias of map
    const asMap = this.mapRef(merged, name);
    if (asMap) return { name, kind: 'alias', of: asMap };
    if (isObjectSchema(merged) || merged.allOf) return this.buildStruct(name, merged);

    // top-level scalar / array component -> an alias (newtype).
    return { name, kind: 'alias', of: this.resolveTypeRef(s, name) };
  }

  /** A fixed-literal scalar TypeRef for a single-value const / 1-value enum. */
  private constScalar(s: Schema, value: unknown): TypeRef {
    const base =
      scalarType(s) ??
      (typeof value === 'number'
        ? Number.isInteger(value)
          ? 'integer'
          : 'number'
        : typeof value === 'boolean'
          ? 'boolean'
          : 'string');
    const ref: TypeRef = { kind: 'scalar', scalar: base, const: value };
    if (s.format) ref.format = s.format;
    return ref;
  }

  private buildEnum(s: Schema, values: unknown[], name?: string): NamedType {
    const base = nonNullTypes(s).includes('integer') || nonNullTypes(s).includes('number') ? 'integer' : 'string';
    const enumValues: EnumValue[] = values
      .filter((v) => v !== null)
      .map((v) => ({ value: v as EnumValue['value'] }));
    const type: NamedType = { name: name ?? '', kind: 'enum', base, values: enumValues };
    if (getDescription(s)) type.description = getDescription(s);
    return type;
  }

  /** Callers pass null-filtered `variants` (see splitNullVariants). */
  private buildUnion(name: string, s: Schema, variants: SchemaOrRef[]): NamedType {
    // Every variant a string const -> ONE named enum, not a union of 1-value enums.
    const consts = this.constStrings(variants);
    if (consts) return this.buildEnum(s, consts, name);

    const semantics = Array.isArray(s.oneOf) ? 'oneOf' : 'anyOf';
    const disc = (s as { discriminator?: OpenAPIV3.DiscriminatorObject }).discriminator;
    const variantRefs: TypeRef[] = variants.map((v, i) =>
      this.resolveTypeRef(v, `${name}${this.variantSuffix(v, i, disc?.propertyName)}`),
    );
    const type: NamedType = { name, kind: 'union', semantics, variants: variantRefs };
    if (disc?.propertyName) {
      const discriminator: Discriminator = { propertyName: disc.propertyName };
      const mapping = this.discriminatorMapping(disc, variants, variantRefs);
      if (mapping) discriminator.mapping = mapping;
      type.discriminator = discriminator;
    }
    if (getDescription(s)) type.description = getDescription(s);
    return type;
  }

  /**
   * The discriminator value -> variant TYPE NAME map. Source 1: the spec's
   * explicit `discriminator.mapping` (`$ref` or component-name targets resolve
   * to their named types; unresolvable entries are omitted). Source 2
   * (derived, when absent): a variant whose discriminator property is a
   * const/1-value enum maps that value to the variant's type name. Undefined
   * when nothing resolves.
   */
  private discriminatorMapping(
    disc: OpenAPIV3.DiscriminatorObject,
    variants: SchemaOrRef[],
    variantRefs: TypeRef[],
  ): Record<string, string> | undefined {
    const out: Record<string, string> = {};
    if (disc.mapping && Object.keys(disc.mapping).length > 0) {
      for (const [value, target] of Object.entries(disc.mapping)) {
        const key = componentKey(target) ?? (this.schemas[target] ? target : undefined);
        if (key && this.schemas[key]) out[value] = this.registerComponent(key);
      }
    } else {
      variants.forEach((v, i) => {
        const ref = variantRefs[i];
        if (ref.kind !== 'ref' || !ref.name) return;
        const raw = isRef(v) ? this.resolveRefSchema(v) : (v as Schema);
        if (!raw) return;
        const props = (this.mergedAllOf(raw).properties ?? {}) as Record<string, SchemaOrRef>;
        const prop = props[disc.propertyName];
        const value = prop && !isRef(prop) ? stringConst(prop as Schema) : undefined;
        if (value !== undefined) out[value] = ref.name;
      });
    }
    return Object.keys(out).length ? out : undefined;
  }

  /** The consts when EVERY variant is a string const / 1-value enum (deduped), else undefined. */
  private constStrings(variants: SchemaOrRef[]): string[] | undefined {
    const out: string[] = [];
    for (const v of variants) {
      if (isRef(v)) return undefined;
      const value = stringConst(v as Schema);
      if (value === undefined) return undefined;
      out.push(value);
    }
    return [...new Set(out)];
  }

  /**
   * Hoist-name suffix for an inline union variant: the const-valued
   * discriminator property (e.g. `type: image_url` -> ImageUrl), then the
   * variant's title, then a deterministic short kind suffix for scalars/arrays;
   * VariantN only as a last resort. `$ref` variants never hoist, so the suffix
   * is inert for them.
   */
  private variantSuffix(v: SchemaOrRef, index: number, discProp: string | undefined): string {
    const fallback = `Variant${index}`;
    if (isRef(v)) return fallback;
    const s = v as Schema;

    // a lone const variant among mixed variants -> named after its value
    const own = stringConst(s);
    if (own) return pascalCase(own) || fallback;

    const props = (s.properties ?? {}) as Record<string, SchemaOrRef>;
    const candidates = discProp ? [discProp, 'type', 'role'] : ['type', 'role'];
    for (const key of candidates) {
      const p = props[key];
      if (p && !isRef(p)) {
        const value = stringConst(p as Schema);
        if (value) return pascalCase(value) || fallback;
      }
    }
    if (typeof s.title === 'string' && s.title.trim()) return pascalCase(s.title) || fallback;
    if (isArray(s)) return 'Array';
    const scalar = scalarType(s);
    if (scalar) return pascalCase(scalar);
    return fallback;
  }

  private buildStruct(name: string, s: Schema): NamedType {
    const required = new Set<string>(Array.isArray(s.required) ? s.required : []);
    const props = (s.properties ?? {}) as Record<string, SchemaOrRef>;
    const fields: Field[] = [];

    for (const [propName, propSchema] of Object.entries(props)) {
      const field: Field = {
        name: propName,
        type: this.resolveTypeRef(propSchema, name + pascalCase(propName)),
        required: required.has(propName),
      };
      if (!isRef(propSchema)) {
        const ps = propSchema as Schema;
        if (isNullable(ps)) field.nullable = true;
        if ((ps as { readOnly?: boolean }).readOnly) field.readOnly = true;
        if ((ps as { writeOnly?: boolean }).writeOnly) field.writeOnly = true;
        if ((ps as { deprecated?: boolean }).deprecated) field.deprecated = true;
        if (getDefault(ps) !== undefined) field.default = getDefault(ps);
        if (getDescription(ps)) field.description = getDescription(ps);
      }
      fields.push(field);
    }

    const type: NamedType = { name, kind: 'struct', fields };
    if (getDescription(s)) type.description = getDescription(s);
    return type;
  }

  /** True for a binary body property (multipart signal). */
  static isBinaryProp(schema: SchemaOrRef | undefined): boolean {
    return !isRef(schema) && isBinary(schema as Schema);
  }
}
