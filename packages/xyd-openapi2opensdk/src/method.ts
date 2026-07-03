import type { OpenAPIV3 } from 'openapi-types';
import type { Method, Pagination, Param, RequestBody, Response, ResolvedSdkBehavior, TypeRef } from '@xyd-js/opensdk-core';

import type { DerivedTarget } from './action';
import { type Schema, isArray } from './schema';
import type { SchemaOrRef, SymbolTable } from './nominal';
import { securityRequirements } from './security';
import { uniqueName } from './unique';

// Well-known auth headers we never surface as method params (the runtime adds them).
const AUTH_HEADERS = new Set(['authorization', 'x-api-key', 'api-key', 'cookie']);

function isRef(x: unknown): x is OpenAPIV3.ReferenceObject {
  return !!x && typeof x === 'object' && '$ref' in (x as object) && typeof (x as { $ref: unknown }).$ref === 'string';
}

/** Resolve a `#/components/<section>/<name>` object ref against the raw doc. */
function derefObject<T>(doc: OpenAPIV3.Document, node: T | OpenAPIV3.ReferenceObject): T | undefined {
  if (!isRef(node)) return node as T;
  const m = node.$ref.match(/#\/components\/(\w+)\/(.+)$/);
  if (!m) return undefined;
  const section = (doc.components as Record<string, unknown> | undefined)?.[m[1]] as Record<string, unknown> | undefined;
  const resolved = section?.[m[2]];
  return isRef(resolved) ? derefObject<T>(doc, resolved) : (resolved as T | undefined);
}

/** Pick the request/response content entry to model (prefer JSON, then multipart, then form). */
function pickContent(content: Record<string, OpenAPIV3.MediaTypeObject> | undefined): {
  contentType: string;
  media: OpenAPIV3.MediaTypeObject;
} | undefined {
  if (!content) return undefined;
  const order = ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'];
  for (const ct of order) {
    if (content[ct]) return { contentType: ct, media: content[ct] };
  }
  const first = Object.keys(content)[0];
  return first ? { contentType: first, media: content[first] } : undefined;
}

function encodingFor(contentType: string): RequestBody['encoding'] {
  if (contentType.includes('multipart')) return 'multipart';
  if (contentType.includes('x-www-form-urlencoded')) return 'form';
  return 'json';
}

/** Identifier-safe param name: strip wire junk (`ids[]` -> `ids`); `_` if nothing survives. */
function identifierName(wire: string): string {
  return wire.replace(/[^a-zA-Z0-9_]/g, '') || '_';
}

/** Build one typed Method from an operation. */
export function buildMethod(
  doc: OpenAPIV3.Document,
  method: string,
  path: string,
  operation: OpenAPIV3.OperationObject,
  pathItemParams: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[],
  target: DerivedTarget,
  symbols: SymbolTable,
  behavior: ResolvedSdkBehavior,
): Method {
  const out: Method = { action: target.action, httpMethod: method.toLowerCase(), path };
  // Hoisted inline types are named from this hint. Qualify it with the FULL
  // resource path so a `retrieve include` under threads/runs/steps can never
  // share a name with one under organization/certificates.
  const hint = [...target.resourcePath, target.action].join('-');
  if (operation.operationId) out.operationId = operation.operationId;
  if (operation.description) out.description = operation.description;
  else if (operation.summary) out.description = operation.summary;
  if (operation.deprecated) out.deprecated = true;

  // Parameters (path-item params first, operation params override by name+in).
  const paramList = [...pathItemParams, ...(operation.parameters ?? [])]
    .map((p) => derefObject<OpenAPIV3.ParameterObject>(doc, p))
    .filter((p): p is OpenAPIV3.ParameterObject => !!p && !!p.name && !!p.in);

  const seen = new Set<string>();
  const pathParams: Param[] = [];
  const queryParams: Param[] = [];
  const headerParams: Param[] = [];
  // per-location identifier namespaces (two params may sanitize to one name)
  const usedNames: Record<string, Set<string>> = { path: new Set(), query: new Set(), header: new Set() };

  // keep path params in URL order
  const orderedPath = target.pathParamNames;

  // Detect-and-strip (oagen operations.ts): a spec-declared idempotency-key
  // header never surfaces as a hand-filled param — the runtime injects a
  // generated key per sdk.idempotency instead.
  const idempotencyHeader = behavior.idempotency.headerName.toLowerCase();

  for (const p of paramList) {
    const key = `${p.in}:${p.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (p.in === 'cookie') continue;
    if (p.in === 'header' && p.name.toLowerCase() === idempotencyHeader) {
      out.injectIdempotencyKey = true;
      continue;
    }
    if (p.in === 'header' && AUTH_HEADERS.has(p.name.toLowerCase())) continue;

    // Identifier/wire split: `name` is identifier-safe (collision-suffixed per
    // location), `wireName` keeps the raw HTTP name whenever it differs.
    const name = uniqueName(identifierName(p.name), usedNames[p.in]);
    const param: Param = {
      name,
      type: symbols.resolveTypeRef(p.schema as SchemaOrRef | undefined, `${hint}-${name}`),
      required: !!p.required,
    };
    if (name !== p.name) param.wireName = p.name;
    if (p.description) param.description = p.description;

    // param metadata: default (schema), example (param, then schema), deprecated (either)
    const schema = derefObject<Schema>(doc, p.schema as never);
    if (schema?.default !== undefined) param.default = schema.default;
    const example =
      (p as { example?: unknown }).example ??
      (schema as { example?: unknown } | undefined)?.example ??
      (Array.isArray(schema?.examples) ? schema.examples[0] : undefined);
    if (example !== undefined) param.example = example;
    if (p.deprecated || schema?.deprecated) param.deprecated = true;

    if (typeof (p as { explode?: boolean }).explode === 'boolean') param.explode = (p as { explode?: boolean }).explode;
    if ((p as { style?: string }).style) param.style = (p as { style?: string }).style;

    if (p.in === 'path') pathParams.push(param);
    else if (p.in === 'query') queryParams.push(param);
    else if (p.in === 'header') headerParams.push(param);
  }
  pathParams.sort((a, b) => orderedPath.indexOf(a.wireName ?? a.name) - orderedPath.indexOf(b.wireName ?? b.name));

  if (pathParams.length) out.pathParams = pathParams;
  if (queryParams.length) out.queryParams = queryParams;
  if (headerParams.length) out.headerParams = headerParams;

  // Request body.
  const bodyNode = derefObject<OpenAPIV3.RequestBodyObject>(doc, operation.requestBody as never);
  if (bodyNode) {
    const picked = pickContent(bodyNode.content);
    if (picked) {
      const body: RequestBody = {
        contentType: picked.contentType,
        // `-request` (not `-params`): matches the spec's own body-component naming
        // (CreateChatCompletionRequest) and stays out of the Go emitter's
        // `<Resource><Method>Params` namespace.
        type: symbols.resolveTypeRef(picked.media.schema as SchemaOrRef | undefined, `${hint}-request`),
        required: !!bodyNode.required,
        encoding: encodingFor(picked.contentType),
      };
      if (bodyNode.description) body.description = bodyNode.description;
      out.requestBody = body;
    }
  }

  // Responses.
  const responses: Response[] = [];
  let primary: TypeRef | undefined;
  let primaryStatus = '';
  for (const [status, resNode] of Object.entries(operation.responses ?? {})) {
    const res = derefObject<OpenAPIV3.ResponseObject>(doc, resNode as never);
    if (!res) continue;
    const picked = pickContent(res.content);
    const entry: Response = { status };
    if (res.description) entry.description = res.description;
    if (picked) {
      entry.contentType = picked.contentType;
      entry.type = symbols.resolveTypeRef(picked.media.schema as SchemaOrRef | undefined, `${hint}-response`);
    }
    responses.push(entry);
    // primary = first 2xx with a JSON body
    if (!primary && /^2\d\d$/.test(status) && entry.type) {
      primary = entry.type;
      primaryStatus = status;
    }
  }
  if (responses.length) out.responses = responses;
  if (primary) out.primaryResponse = primary;

  // Pagination: a list-style primary response with a `data` array + a next/has_more marker.
  const pagination = detectPagination(doc, operation, primaryStatus, symbols, {
    action: target.action,
    httpMethod: method.toLowerCase(),
    primary,
    queryParams,
  });
  if (pagination) out.pagination = pagination;

  // Per-operation security (e.g. AdminApiKeyAuth on /organization endpoints) —
  // only when declared AND different from the document default; `[]` means an
  // explicitly public endpoint.
  if (operation.security && JSON.stringify(operation.security) !== JSON.stringify(doc.security ?? [])) {
    out.security = securityRequirements(doc, operation.security);
  }

  return out;
}

const LIMIT_PARAMS = ['limit', 'page_size', 'per_page'];
const CURSOR_PARAMS = ['after', 'cursor', 'starting_after', 'page'];
const OFFSET_PARAMS = ['offset', 'skip', 'start'];

/** The paged element type: the primary response struct's itemsField array element. */
function resolveItemType(primary: TypeRef | undefined, symbols: SymbolTable, itemsField: string): TypeRef | undefined {
  if (primary?.kind !== 'ref' || !primary.name) return undefined;
  const named = symbols.get(primary.name);
  if (named?.kind !== 'struct') return undefined;
  const field = named.fields?.find((f) => f.name === itemsField);
  const type = field?.type as TypeRef | undefined;
  return type?.kind === 'array' && type.items ? (type.items as TypeRef) : undefined;
}

/** Heuristic cursor/list pagination detection (openai-style: data[] + has_more, `after` cursor). */
function detectPagination(
  doc: OpenAPIV3.Document,
  operation: OpenAPIV3.OperationObject,
  status: string,
  symbols: SymbolTable,
  ctx: { action: string; httpMethod: string; primary: TypeRef | undefined; queryParams: Param[] },
): Pagination | undefined {
  if (!status) return undefined;
  const res = derefObject<OpenAPIV3.ResponseObject>(doc, operation.responses?.[status] as never);
  const picked = pickContent(res?.content);
  // Resolve the envelope through `$ref` chains AND allOf composition, so a
  // list response assembled from a shared page base is still seen.
  const schema = symbols.resolveObjectSchema(picked?.media.schema as SchemaOrRef | undefined);
  const props = schema?.properties as Record<string, SchemaOrRef> | undefined;
  if (!props) return undefined;

  const limitParam = ctx.queryParams.find((p) => LIMIT_PARAMS.includes(p.name))?.name;

  const itemsField = ['data', 'items', 'results'].find((f) => props[f] && isArray(props[f] as Schema));
  if (!itemsField) return undefined;
  const nextField = ['has_more', 'next', 'next_cursor', 'has_next'].find((f) => f in props);
  if (!nextField) {
    // OFFSET style: a list envelope driven by an integer offset/skip/start
    // query param needs no next/has_more marker.
    const offsetParam = ctx.queryParams.find(
      (p) => OFFSET_PARAMS.includes(p.name) && p.type?.kind === 'scalar' && p.type.scalar === 'integer',
    )?.name;
    if (ctx.httpMethod === 'get' && ctx.action === 'list' && offsetParam) {
      const pg: Pagination = { style: 'offset', itemsField, offsetParam };
      const itemType = resolveItemType(ctx.primary, symbols, itemsField);
      if (itemType) pg.itemType = itemType;
      if (limitParam) pg.limitParam = limitParam;
      return pg;
    }
    // Marker-less envelope: a GET collection whose response wraps a data/items
    // array with no has_more/next (GET /models) is still paged in openai-go
    // (pagination.Page[Model]) — single-page style, no cursor.
    if (ctx.httpMethod !== 'get' || ctx.action !== 'list' || !['data', 'items'].includes(itemsField)) return undefined;
    const pg: Pagination = { style: 'page', itemsField };
    const itemType = resolveItemType(ctx.primary, symbols, itemsField);
    if (itemType) pg.itemType = itemType;
    if (limitParam) pg.limitParam = limitParam;
    return pg;
  }

  // Cursor detection reads the ALREADY-NORMALIZED query params — `$ref`'d and
  // path-item-level parameters are included (raw operation.parameters missed them).
  const cursorParam = ctx.queryParams.find((p) => CURSOR_PARAMS.includes(p.name))?.name;

  const pg: Pagination = { style: 'cursor', itemsField, nextField };
  const itemType = resolveItemType(ctx.primary, symbols, itemsField);
  if (itemType) pg.itemType = itemType;
  if (cursorParam) pg.cursorParam = cursorParam;
  if (limitParam) pg.limitParam = limitParam;
  return pg;
}
