// Shared TYPE-reference planner: the language-neutral view of one operation's
// SDK request-params type + response type (the sibling of example-plan.ts, which
// plans example VALUES). Emitters render this into per-language field rows shown
// in Atlas — the request/response TYPES that replace the REST "query params".
import type { Field, Method, NamedType, Param, TypeRef } from '@xyd-js/opensdk-core';

import { type BodyEncoding, type OperationPlan, type PageName, type PrimaryResponseKind, planOperation } from './operation-plan';

/** Where a request field comes from (query/header params collapse into the params type). */
export type FieldLocation = 'body' | 'query' | 'header' | 'path';

/** One language-neutral field of a request/response type. */
export interface NeutralTypeField {
  /** IR field/param name — the casing SOURCE each emitter derives the lang name from. */
  logicalName: string;
  /** Wire name (`Param.wireName ?? name`; a body `Field.name` is already the wire name). */
  wireName: string;
  /** Raw IR type — each emitter renders it to its own language type string. */
  typeRef: TypeRef;
  required: boolean;
  description?: string;
  deprecated?: boolean;
  /** For request fields; response fields carry 'body' (ignored). */
  in: FieldLocation;
}

/** The neutral type reference for one method: its request params type + response type. */
export interface NeutralTypeReference {
  request: {
    /** body ∪ query ∪ header, deduped body-wins (matches the params-interface field order). */
    fields: NeutralTypeField[];
    hasBody: boolean;
    bodyEncoding: BodyEncoding | null;
  };
  response: {
    /** The primary response type (or the paginated item type). */
    typeRef?: TypeRef;
    /** Struct field rows when the response is a ref-to-struct; absent otherwise. */
    fields?: NeutralTypeField[];
    kind: PrimaryResponseKind;
    page: PageName | null;
    binaryContentType: string | null;
  };
}

/** Resolve a body TypeRef (ref → struct) to its field list; `[]` otherwise. The
 * byte-identical resolver each emitter currently duplicates — home it here. */
export function resolveBodyFields(bodyRef: TypeRef | undefined, types: Map<string, NamedType>): Field[] {
  if (bodyRef?.kind !== 'ref' || !bodyRef.name) return [];
  const named = types.get(bodyRef.name);
  return named?.kind === 'struct' ? (named.fields ?? []) : [];
}

/** The ORIGINAL IR schema name behind a field's type, for a cross-type link
 * (`symbolDef.canonical → objects/<name>`). Direct refs only (v1). */
export function refSchemaName(typeRef: TypeRef | undefined): string | undefined {
  return typeRef?.kind === 'ref' && typeRef.name ? typeRef.name : undefined;
}

function toRequestField(source: Field | Param, wireName: string, loc: FieldLocation): NeutralTypeField {
  return {
    logicalName: source.name,
    wireName,
    typeRef: source.type as TypeRef,
    required: !!source.required,
    description: source.description,
    deprecated: source.deprecated,
    in: loc,
  };
}

function responseTypeRef(method: Method, op: OperationPlan): TypeRef | undefined {
  // A paginated list's real payload is the ITEM type, not the page envelope.
  if (op.pageName && method.pagination?.itemType) return method.pagination.itemType as TypeRef;
  return method.primaryResponse as TypeRef | undefined;
}

function responseStructFields(ref: TypeRef | undefined, types: Map<string, NamedType>): NeutralTypeField[] | undefined {
  if (ref?.kind !== 'ref' || !ref.name) return undefined;
  const named = types.get(ref.name);
  if (named?.kind !== 'struct') return undefined;
  return (named.fields ?? []).map((f) => toRequestField(f, f.name, 'body'));
}

/**
 * The neutral type reference for a method: request = body ∪ query ∪ header (deduped
 * body-wins so rows match the params-interface order); response = primaryResponse
 * (or the paginated item type), with struct fields resolved one level deep — nested
 * refs are LINKED (via refSchemaName), not inlined. Reuses planOperation.
 */
export function planTypeReference(method: Method, types: Map<string, NamedType>): NeutralTypeReference {
  const op = planOperation(method, types);

  const fields: NeutralTypeField[] = [];
  const seen = new Set<string>();
  for (const f of resolveBodyFields(method.requestBody?.type as TypeRef | undefined, types)) {
    fields.push(toRequestField(f, f.name, 'body'));
    seen.add(f.name);
  }
  const addParam = (p: Param, loc: FieldLocation) => {
    if (seen.has(p.name)) return; // body-wins
    seen.add(p.name);
    fields.push(toRequestField(p, p.wireName ?? p.name, loc));
  };
  for (const p of op.paramGroups.query) addParam(p, 'query');
  for (const p of op.paramGroups.header) addParam(p, 'header');

  const responseRef = responseTypeRef(method, op);

  return {
    request: { fields, hasBody: op.hasBody, bodyEncoding: op.encoding },
    response: {
      typeRef: responseRef,
      fields: responseStructFields(responseRef, types),
      kind: op.primaryResponse,
      page: op.pageName,
      binaryContentType: op.binaryContentType,
    },
  };
}
