import type { Method, NamedType, OpensdkSpecJson, Param } from '@xyd-js/opensdk-core';

/**
 * The shared per-operation semantic planning layer between the IR and the
 * emitters (oagen's operation-plan idea): every "what should the generated
 * method do" decision is computed ONCE here, so language emitters render
 * decisions instead of re-deriving them (the Go/Python drift channel).
 *
 * The semantics are lifted verbatim from the Go emitter's service.ts
 * (methodPageName / binaryContentType / bodyEncoding / returnSignature) — the
 * ground truth an adopting emitter must stay byte-identical to.
 */

/** The vendored auto-pager kind for a paginated list method. */
export type PageName = 'CursorPage' | 'Page' | 'OffsetPage';

/** How the request body is encoded on the wire. */
export type BodyEncoding = 'json' | 'multipart' | 'form';

/**
 * Classification of `method.primaryResponse`:
 * - 'struct'       — ref to a struct (or an unknown placeholder ref, which
 *                    defaults to struct): composite-literal + decode-into;
 * - 'union-mapped' — ref to a union with a mapped discriminator (propertyName
 *                    + non-empty mapping): decode raw, dispatch by variant;
 * - 'union-open'   — ref to a union without a usable mapping: open value decode;
 * - 'scalar'       — everything else with a response (enum/alias refs, arrays,
 *                    maps, scalars, any): plain value decode;
 * - 'none'         — no primary response (e.g. 204): execute, no decode.
 *
 * Precedence note (matching the Go emitter): a consumer checks
 * `binaryContentType` (raw *http.Response) and `pageName` (vendored page)
 * FIRST — this classification only drives the plain-response path.
 */
export type PrimaryResponseKind = 'struct' | 'union-mapped' | 'union-open' | 'scalar' | 'none';

/** The method's parameters grouped by request location (each defaulted to []). */
export interface OperationParamGroups {
  path: Param[];
  query: Param[];
  header: Param[];
}

/** The engine-computed plan for one method. */
export interface OperationPlan {
  /** The planned method, for convenience. */
  method: Method;
  /**
   * The vendored page kind for a paginated list method, or null to keep the
   * raw envelope return. Same gates as the Go emitter's methodPageName:
   * requires a non-binary response, `pagination.itemType`, and
   * `pagination.itemsField === 'data'` (the vendored CursorPage/Page/OffsetPage
   * fix the wire fields to `data`/`has_more`); 'offset' additionally requires
   * `offsetParam`.
   */
  pageName: PageName | null;
  /**
   * The primary 2xx response's content type when it is NOT json (binary /
   * stream download, e.g. application/octet-stream, audio/*) — such methods
   * return the raw response. Null for json or absent.
   */
  binaryContentType: string | null;
  /** The request body's wire encoding, or null when the method has no body. */
  encoding: BodyEncoding | null;
  /** Path/query/header parameters, grouped. */
  paramGroups: OperationParamGroups;
  /** Whether the method has a request body. */
  hasBody: boolean;
  /** Whether that body is required. */
  bodyRequired: boolean;
  /** Classification of the primary response (see PrimaryResponseKind). */
  primaryResponse: PrimaryResponseKind;
  /** IR passthrough: the runtime injects a generated idempotency key (per sdk.idempotency). */
  injectIdempotencyKey: boolean;
}

/**
 * Compute the operation plan for one method. `types` is the IR symbol table
 * (the same map EmitterContext carries); `spec` is accepted for future
 * policy-aware planning (e.g. sdk.idempotency) and is currently unused.
 */
export function planOperation(method: Method, types: Map<string, NamedType>, spec?: OpensdkSpecJson): OperationPlan {
  void spec;
  const binary = binaryContentType(method);
  return {
    method,
    pageName: pageName(method, binary),
    binaryContentType: binary,
    encoding: bodyEncoding(method),
    paramGroups: {
      path: method.pathParams ?? [],
      query: method.queryParams ?? [],
      header: method.headerParams ?? [],
    },
    hasBody: !!method.requestBody,
    bodyRequired: !!method.requestBody?.required,
    primaryResponse: classifyPrimaryResponse(method, types),
    injectIdempotencyKey: !!method.injectIdempotencyKey,
  };
}

/**
 * The FIRST declared 2xx response's content type when it is not json, else
 * null (byte-identical to the Go emitter's binaryContentType: the primary 2xx
 * is picked by declaration order, and only ITS content type is inspected).
 */
function binaryContentType(method: Method): string | null {
  const primary = (method.responses || []).find((r) => typeof r.status === 'string' && r.status.startsWith('2'));
  const contentType = primary?.contentType;
  if (contentType && !contentType.includes('json')) return contentType;
  return null;
}

/** The vendored page kind — the Go emitter's methodPageName gates, verbatim. */
function pageName(method: Method, binary: string | null): PageName | null {
  if (binary) return null;
  const pagination = method.pagination;
  if (!pagination?.itemType || pagination.itemsField !== 'data') return null;
  if (pagination.style === 'cursor') return 'CursorPage';
  if (pagination.style === 'page') return 'Page';
  if (pagination.style === 'offset' && pagination.offsetParam) return 'OffsetPage';
  return null;
}

/** The IR body encoding a method routes on: json (default) | multipart | form; null without a body. */
function bodyEncoding(method: Method): BodyEncoding | null {
  if (!method.requestBody) return null;
  const encoding = method.requestBody.encoding;
  return encoding === 'multipart' || encoding === 'form' ? encoding : 'json';
}

/**
 * Classify the primary response, mirroring the Go emitter's
 * isStructResponse / mappedUnionResponse / returnSignature decisions:
 * unknown refs default to struct; only a union with propertyName + a
 * non-empty mapping counts as mapped; enum/alias refs (not
 * composite-literalable) and every non-ref shape decode as plain values.
 */
function classifyPrimaryResponse(method: Method, types: Map<string, NamedType>): PrimaryResponseKind {
  const ref = method.primaryResponse;
  if (!ref) return 'none';
  if (ref.kind === 'ref' && ref.name) {
    const named = types.get(ref.name);
    if (!named || named.kind === 'struct') return 'struct';
    if (named.kind === 'union') {
      const disc = named.discriminator;
      const mapped = !!disc?.propertyName && !!disc.mapping && Object.keys(disc.mapping).length > 0;
      return mapped ? 'union-mapped' : 'union-open';
    }
    return 'scalar'; // enum / alias
  }
  return 'scalar'; // scalar / array / map / any
}
