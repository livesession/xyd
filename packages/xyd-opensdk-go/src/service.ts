import type { Field, Method, NamedType, Param, Resource, TypeRef } from '@xyd-js/opensdk-core';
import type { ResolvedSdkBehavior } from '@xyd-js/opensdk-core';
import { planOperation } from '@xyd-js/opensdk-framework';
import type { BodyEncoding, OperationPlan, PageName } from '@xyd-js/opensdk-framework';

import { goType, isBinaryRef, isScalarRef } from './gotype';
import { goDoc, goField, goFile, Imports, goStruct } from './gowriter';
import { constFieldName, goZeroLiteral, isConstField, unionUnmarshalerName } from './model';
import { goMethodName, goVar, pascalCase, singularPascalCase, slug } from './naming';

/** Per-file emit context: module path (for internal imports), symbol table, SDK behavior policy. */
export interface GoCtx {
  modulePath: string;
  pkg: string;
  types: Map<string, NamedType>;
  behavior: ResolvedSdkBehavior;
  /** When set, generateUsage reads the client base URL from this env var (snippet-run tests). */
  baseUrlEnv?: string;
}

const HTTP_METHOD_CONST: Record<string, string> = {
  get: 'http.MethodGet',
  post: 'http.MethodPost',
  put: 'http.MethodPut',
  patch: 'http.MethodPatch',
  delete: 'http.MethodDelete',
  head: 'http.MethodHead',
  options: 'http.MethodOptions',
};

/**
 * The globally-unique Go name qualifier for a resource, from its FULL path
 * (root..resource) with each segment SINGULARIZED, e.g. ["chat","completions"]
 * -> "ChatCompletion" (openai-go's ChatCompletionService / ChatCompletionNewParams).
 * Type names are path-qualified so a nested `completions` never collides with a
 * top-level one; FIELD names (Client.Videos etc.) keep the plural via pascalCase.
 */
export function resourceQualifier(segments: string[]): string {
  return segments.map(singularPascalCase).join('');
}

/** The exported Go service type name for a resource at `segments`. */
export function serviceTypeName(segments: string[]): string {
  return `${resourceQualifier(segments)}Service`;
}

/** Emit one top-level resource (and its whole subtree) into a single Go file. */
export function renderServiceFile(resource: Resource, ctx: GoCtx): { path: string; content: string } {
  const imports = new Imports();
  const optionQ = imports.add(`${ctx.modulePath}/option`);
  const decls: string[] = [];
  emitService(resource, [resource.name], ctx, imports, optionQ, decls);
  return { path: `${slug(resource.name) || 'service'}.go`, content: goFile(ctx.pkg, imports, decls) };
}

function emitService(
  resource: Resource,
  segments: string[],
  ctx: GoCtx,
  imports: Imports,
  optionQ: string,
  decls: string[],
): void {
  const svc = serviceTypeName(segments);
  const subs = resource.resources || [];

  // service struct — field names stay local, field TYPES are path-qualified
  const structFields = [goField('Options', `[]${optionQ}.RequestOption`)];
  for (const sub of subs) structFields.push(goField(pascalCase(sub.name), serviceTypeName([...segments, sub.name])));
  decls.push(goStruct(svc, structFields, goDoc(resource.description, svc)));

  // constructor
  const ctorLines = [`\tr = ${svc}{}`, `\tr.Options = opts`];
  for (const sub of subs) {
    ctorLines.push(`\tr.${pascalCase(sub.name)} = New${serviceTypeName([...segments, sub.name])}(opts...)`);
  }
  decls.push(
    `// New${svc} constructs a service that shares the client's request options.\n` +
      `func New${svc}(opts ...${optionQ}.RequestOption) (r ${svc}) {\n${ctorLines.join('\n')}\n\treturn\n}`,
  );

  // methods, followed by their param structs
  const paramStructs: string[] = [];
  for (const method of resource.methods || []) {
    decls.push(emitMethod(resource, segments, method, ctx, imports, optionQ, paramStructs));
  }
  decls.push(...paramStructs);

  // nested services, into the same file
  for (const sub of subs) emitService(sub, [...segments, sub.name], ctx, imports, optionQ, decls);
}

interface ParamsPlan {
  argName: string;
  typeName: string;
  hasBody: boolean;
}

function emitMethod(
  resource: Resource,
  segments: string[],
  method: Method,
  ctx: GoCtx,
  imports: Imports,
  optionQ: string,
  paramStructs: string[],
): string {
  imports.add('context');
  const reqconfigQ = imports.add(`${ctx.modulePath}/internal/requestconfig`);

  // The engine plans the semantic facts (page kind, binary response, body
  // encoding, param groups, response classification) — this emitter renders them.
  const op = planOperation(method, ctx.types);
  const name = goMethodName(method.action);
  const pathParams = op.paramGroups.path;
  const queryParams = op.paramGroups.query;
  const headerParams = op.paramGroups.header;
  const hasBody = op.hasBody;
  const encoding = op.encoding ?? 'json';
  const rawContentType = op.binaryContentType;

  const plan = planParams(segments, name, hasBody, queryParams, headerParams);
  if (plan) paramStructs.push(renderParamsStruct(plan, method, encoding, ctx, imports));

  // signature
  const args = ['ctx context.Context'];
  for (const p of pathParams) args.push(`${goVar(p.name)} ${goType(p.type)}`);
  if (plan) args.push(`${plan.argName} ${plan.typeName}`);
  args.push(`opts ...${optionQ}.RequestOption`);

  imports.add('net/http');
  const httpConst = HTTP_METHOD_CONST[method.httpMethod] || JSON.stringify(method.httpMethod.toUpperCase());

  const lines: string[] = [`\topts = append(r.Options[:], opts...)`];
  if (rawContentType) {
    // openai-go prepends the Accept header so user-supplied options win
    lines.push(
      `\topts = append([]${optionQ}.RequestOption{${optionQ}.WithHeader("Accept", ${JSON.stringify(rawContentType)})}, opts...)`,
    );
  }
  // openai-go guards every string path param before building the path
  for (const p of pathParams) {
    if (goType(p.type) !== 'string') continue;
    imports.add('errors');
    lines.push(
      `\tif ${goVar(p.name)} == "" {\n` +
        `\t\terr = errors.New(${JSON.stringify(`missing required ${p.name} parameter`)})\n` +
        `\t\treturn\n\t}`,
    );
  }
  // required string header params get the same guard as string path params
  if (plan) {
    for (const h of headerParams) {
      if (!h.required || goType(h.type) !== 'string') continue;
      imports.add('errors');
      lines.push(
        `\tif ${plan.argName}.${pascalCase(h.name)} == "" {\n` +
          `\t\terr = errors.New(${JSON.stringify(`missing required ${h.wireName ?? h.name} parameter`)})\n` +
          `\t\treturn\n\t}`,
      );
    }
  }
  const pathExpr = pathExpression(method.path, pathParams, imports);
  const bodyArg = plan?.hasBody ? plan.argName : 'nil';
  lines.push(`\tcfg, err := ${reqconfigQ}.NewRequestConfig(ctx, ${httpConst}, ${pathExpr}, ${bodyArg}, opts...)`);
  lines.push(`\tif err != nil {\n\t\treturn\n\t}`);

  // Spec-declared idempotency: one generated key per logical call, replayed
  // byte-identical across retries (a user-supplied header wins).
  if (methodInjectsIdempotency(method, ctx.behavior)) {
    const headerName = JSON.stringify(ctx.behavior.idempotency.headerName);
    lines.push(
      `\tif cfg.Header.Get(${headerName}) == "" {\n` +
        `\t\tcfg.Header.Set(${headerName}, ${reqconfigQ}.NewIdempotencyKey())\n\t}`,
    );
  }

  // route the body by its IR encoding — the runtime's do() switches on it
  if (plan?.hasBody && encoding !== 'json') {
    lines.push(`\tcfg.Encoding = ${JSON.stringify(encoding)}`);
  }

  if (plan) {
    for (const h of headerParams) lines.push(headerParamLines(plan.argName, h, imports));
    for (const q of queryParams) lines.push(queryParamLines(plan.argName, q, ctx, imports));
  }

  const pageType = paginationPageType(method, op.pageName, ctx, imports);
  lines.push(...responseLines(method, op, ctx, pageType, imports));

  const doc = goDoc(method.description, `${name} ${method.httpMethod.toUpperCase()} ${method.path}`);
  const head = doc ? `${doc}\n` : '';
  // pointer receiver + value-returning constructor is exactly openai-go's mix
  return `${head}func (r *${serviceTypeName(segments)}) ${name}(${args.join(', ')}) ${returnSignature(method, op, pageType)} {\n${lines.join('\n')}\n\treturn\n}`;
}

/** HTTP methods an auto-generated idempotency key makes sense for (mutating, replayable). */
const IDEMPOTENT_POST_LIKE = new Set(['post', 'put', 'patch']);

/**
 * Whether the runtime injects a generated idempotency key for this method:
 * the spec declared the header (Method.injectIdempotencyKey), the method is
 * POST-like, and the policy both auto-generates keys and retries at all —
 * retrying a POST without an idempotency key is the data-corruption bug the
 * whole retry story hinges on (sdk.idempotency + sdk.retry).
 */
export function methodInjectsIdempotency(method: Method, behavior: ResolvedSdkBehavior): boolean {
  if (!method.injectIdempotencyKey) return false;
  if (!IDEMPOTENT_POST_LIKE.has(method.httpMethod)) return false;
  return behavior.idempotency.autoGenerateForPost && behavior.retry.maxRetries > 0;
}

/**
 * The wire query key GetNextPage advances for a paginated method: the cursor
 * param (CursorPage) or the offset param (OffsetPage), resolved to its raw
 * HTTP name. Null when the page kind carries no continuation state (Page, or
 * a cursor page with no cursor param) — such pages stop after one page.
 */
function pageStateKey(method: Method, page: PageName | null): string | null {
  const pagination = method.pagination;
  if (!page || !pagination) return null;
  const paramName =
    page === 'CursorPage' ? pagination.cursorParam : page === 'OffsetPage' ? pagination.offsetParam : undefined;
  if (!paramName) return null;
  const param = (method.queryParams || []).find((q) => q.name === paramName);
  return param?.wireName ?? paramName;
}

/** The qualified generic page type, e.g. `pagination.CursorPage[Pet]`, or null. */
function paginationPageType(method: Method, page: PageName | null, ctx: GoCtx, imports: Imports): string | null {
  if (!page) return null;
  const paginationQ = imports.add(`${ctx.modulePath}/packages/pagination`);
  return `${paginationQ}.${page}[${goType(method.pagination?.itemType as TypeRef | undefined)}]`;
}

export function planParams(
  segments: string[],
  methodName: string,
  hasBody: boolean,
  queryParams: Param[],
  headerParams: Param[],
): ParamsPlan | null {
  if (!hasBody && queryParams.length === 0 && headerParams.length === 0) return null;
  const typeName = `${resourceQualifier(segments)}${methodName}Params`;
  const argName = hasBody
    ? queryParams.length + headerParams.length > 0
      ? 'params'
      : 'body'
    : queryParams.length > 0
      ? 'query'
      : 'params';
  return { argName, typeName, hasBody };
}

function renderParamsStruct(
  plan: ParamsPlan,
  method: Method,
  encoding: BodyEncoding,
  ctx: GoCtx,
  imports: Imports,
): string {
  const fields: string[] = [];

  if (plan.hasBody) {
    for (const f of bodyFields(method, ctx)) fields.push(bodyFieldLine(f, encoding, ctx, imports));
  }
  for (const q of method.queryParams || []) fields.push(queryFieldLine(q, ctx, imports));
  for (const h of method.headerParams || []) fields.push(headerFieldLine(h, ctx, imports));

  const struct = goStruct(plan.typeName, fields);
  // Non-json bodies are encoded by the runtime's apiform (reflection over the
  // same json tags) — a JSON marshaler would be dead (and invalid for io.Reader).
  if (!plan.hasBody || encoding !== 'json') return struct;

  const apijsonQ = imports.add(`${ctx.modulePath}/packages/apijson`);
  // Const-valued body fields are auto-filled when the caller left them at their
  // zero value (value receiver: the fill never mutates the caller's struct).
  const fills = constFillLines(method, ctx);
  const marshalDoc = fills.length
    ? `// MarshalJSON auto-fills const-valued fields left at their zero value.\n`
    : '';
  const marshal =
    `${marshalDoc}func (r ${plan.typeName}) MarshalJSON() ([]byte, error) {\n` +
    `${fills.join('\n')}${fills.length ? '\n' : ''}` +
    `\treturn ${apijsonQ}.MarshalRoot(r)\n}`;
  return `${struct}\n\n${marshal}`;
}

/** The zero-value guard + fill statements for each const body field. */
function constFillLines(method: Method, ctx: GoCtx): string[] {
  const ref = method.requestBody?.type;
  if (ref?.kind !== 'ref' || !ref.name) return [];
  const named = ctx.types.get(ref.name);
  if (!named?.fields) return [];
  const lines: string[] = [];
  for (const f of named.fields) {
    if (!isConstField(f)) continue;
    const fieldName = pascalCase(f.name);
    const zero = goZeroLiteral(goType(f.type));
    lines.push(`\tif r.${fieldName} == ${zero} {\n\t\tr.${fieldName} = ${constFieldName(named.name, f.name)}\n\t}`);
  }
  return lines;
}

/**
 * How a query param serializes, by resolved type shape:
 *   scalar — param.Opt[T] + single key=value
 *   array  — slice field; explode!=false repeats the key, explode=false comma-joins
 *   map    — map field; deepObject k[sub]=v, else a JSON-encoded value
 *   object — struct ref / any; deepObject k[sub]=v via a JSON round-trip, else JSON-encoded
 */
export type QueryKind = 'scalar' | 'array' | 'map' | 'object';

export function queryKind(ref: TypeRef | undefined, types: Map<string, NamedType>): QueryKind {
  if (!ref) return 'scalar';
  if (ref.kind === 'scalar') return 'scalar';
  if (ref.kind === 'array') return 'array';
  if (ref.kind === 'map') return 'map';
  if (ref.kind === 'ref' && ref.name) {
    const named = types.get(ref.name);
    if (named?.kind === 'enum') return 'scalar';
    if (named?.kind === 'alias') return queryKind(named.of as TypeRef | undefined, types);
    return 'object';
  }
  return 'object';
}

/** The params-struct field for one query param (type shape per queryKind). */
function queryFieldLine(q: Param, ctx: GoCtx, imports: Imports): string {
  const tag = `json:"-" query:${JSON.stringify(q.wireName ?? q.name)}`;
  const fieldName = pascalCase(q.name);
  const kind = queryKind(q.type, ctx.types);
  const base = goType(q.type);
  if (kind === 'array' || kind === 'map') return goField(fieldName, base, tag);
  if (kind === 'object') {
    // nil-able so "omitted" is expressible; `any` is already nil-able
    return goField(fieldName, q.required || base === 'any' ? base : `*${base}`, tag);
  }
  // required scalars are plain fields (always sent), like required header params
  if (q.required) return goField(fieldName, base, tag);
  const paramQ = imports.add(`${ctx.modulePath}/packages/param`);
  return goField(fieldName, `${paramQ}.Opt[${base}]`, tag);
}

/** The params-struct field for one header param: required plain, optional param.Opt. */
function headerFieldLine(h: Param, ctx: GoCtx, imports: Imports): string {
  const tag = `json:"-" header:${JSON.stringify(h.wireName ?? h.name)}`;
  const fieldName = pascalCase(h.name);
  if (h.required) return goField(fieldName, goType(h.type), tag);
  const paramQ = imports.add(`${ctx.modulePath}/packages/param`);
  return goField(fieldName, `${paramQ}.Opt[${goType(h.type)}]`, tag);
}

/** The statement(s) that put one header param on the request. */
function headerParamLines(argName: string, h: Param, imports: Imports): string {
  const fieldName = pascalCase(h.name);
  const wire = JSON.stringify(h.wireName ?? h.name);
  if (h.required) {
    if (goType(h.type) === 'string') return `\tcfg.Header.Set(${wire}, ${argName}.${fieldName})`;
    imports.add('fmt');
    return `\tcfg.Header.Set(${wire}, fmt.Sprintf("%v", ${argName}.${fieldName}))`;
  }
  imports.add('fmt');
  return (
    `\tif ${argName}.${fieldName}.IsPresent() {\n` +
    `\t\tcfg.Header.Set(${wire}, fmt.Sprintf("%v", ${argName}.${fieldName}.Value()))\n` +
    `\t}`
  );
}

/**
 * The statement(s) that put one query param on the request, honoring the wire
 * name and OpenAPI style/explode (see QueryKind).
 */
function queryParamLines(argName: string, q: Param, ctx: GoCtx, imports: Imports): string {
  const fieldName = pascalCase(q.name);
  const field = `${argName}.${fieldName}`;
  const key = q.wireName ?? q.name;
  const wire = JSON.stringify(key);
  const kind = queryKind(q.type, ctx.types);
  const deepObject = q.style === 'deepObject';

  if (kind === 'array') {
    imports.add('fmt');
    if (q.explode === false) {
      // style=form, explode=false: one key with comma-joined values
      imports.add('strings');
      const joined = `${goVar(q.name)}Values`;
      return (
        `\tif len(${field}) > 0 {\n` +
        `\t\t${joined} := make([]string, 0, len(${field}))\n` +
        `\t\tfor _, value := range ${field} {\n` +
        `\t\t\t${joined} = append(${joined}, fmt.Sprintf("%v", value))\n` +
        `\t\t}\n` +
        `\t\tcfg.Query.Set(${wire}, strings.Join(${joined}, ","))\n` +
        `\t}`
      );
    }
    // style=form (default), exploded: the key repeats per value
    return `\tfor _, value := range ${field} {\n\t\tcfg.Query.Add(${wire}, fmt.Sprintf("%v", value))\n\t}`;
  }

  if (kind === 'map') {
    imports.add('fmt');
    if (deepObject) {
      const subKey = JSON.stringify(`${key}[%v]`);
      return (
        `\tfor mapKey, mapValue := range ${field} {\n` +
        `\t\tcfg.Query.Set(fmt.Sprintf(${subKey}, mapKey), fmt.Sprintf("%v", mapValue))\n` +
        `\t}`
      );
    }
    imports.add('encoding/json');
    return (
      `\tif len(${field}) > 0 {\n` +
      `\t\traw, jsonErr := json.Marshal(${field})\n` +
      `\t\tif jsonErr != nil {\n\t\t\terr = jsonErr\n\t\t\treturn\n\t\t}\n` +
      `\t\tcfg.Query.Set(${wire}, string(raw))\n` +
      `\t}`
    );
  }

  if (kind === 'object') {
    imports.add('encoding/json');
    // brace-scoped so several object params never collide on locals; optional
    // (pointer / any) fields get a nil guard instead of a bare block
    const open = q.required && goType(q.type) !== 'any' ? '\t{\n' : `\tif ${field} != nil {\n`;
    if (deepObject) {
      imports.add('fmt');
      const subKey = JSON.stringify(`${key}[%v]`);
      return (
        `${open}` +
        `\t\traw, jsonErr := json.Marshal(${field})\n` +
        `\t\tif jsonErr != nil {\n\t\t\terr = jsonErr\n\t\t\treturn\n\t\t}\n` +
        `\t\tvar pairs map[string]any\n` +
        `\t\tif jsonErr := json.Unmarshal(raw, &pairs); jsonErr != nil {\n\t\t\terr = jsonErr\n\t\t\treturn\n\t\t}\n` +
        `\t\tfor mapKey, mapValue := range pairs {\n` +
        `\t\t\tcfg.Query.Set(fmt.Sprintf(${subKey}, mapKey), fmt.Sprintf("%v", mapValue))\n` +
        `\t\t}\n` +
        `\t}`
      );
    }
    return (
      `${open}` +
      `\t\traw, jsonErr := json.Marshal(${field})\n` +
      `\t\tif jsonErr != nil {\n\t\t\terr = jsonErr\n\t\t\treturn\n\t\t}\n` +
      `\t\tcfg.Query.Set(${wire}, string(raw))\n` +
      `\t}`
    );
  }

  // scalar: required plain field always sent; optional param.Opt present-or-omitted
  imports.add('fmt');
  if (q.required) {
    return `\tcfg.Query.Set(${wire}, fmt.Sprintf("%v", ${field}))`;
  }
  return (
    `\tif ${field}.IsPresent() {\n` +
    `\t\tcfg.Query.Set(${wire}, fmt.Sprintf("%v", ${field}.Value()))\n` +
    `\t}`
  );
}

/** Resolve a request body's fields by following its TypeRef into the symbol table. */
function bodyFields(method: Method, ctx: GoCtx): Field[] {
  const ref = method.requestBody?.type;
  if (ref?.kind === 'ref' && ref.name) {
    const named = ctx.types.get(ref.name);
    if (named?.fields) return named.fields;
  }
  return [];
}

function bodyFieldLine(field: Field, encoding: string, ctx: GoCtx, imports: Imports): string {
  const goName = pascalCase(field.name);
  const required = !!field.required;
  const tag = `json:${JSON.stringify(required ? `${field.name},required` : `${field.name},omitempty`)}`;
  // Multipart binary fields take the file CONTENT as an io.Reader — the runtime
  // writes a file part under the field's wire name (nil reader = omitted).
  if (encoding === 'multipart' && isBinaryRef(field.type)) {
    imports.add('io');
    return goField(goName, 'io.Reader', tag);
  }
  // Const fields keep their plain scalar type even when optional — the params
  // struct's MarshalJSON auto-fills the fixed literal when left zero, so a
  // param.Opt presence wrapper would be dead weight.
  if (isConstField(field)) {
    return goField(goName, goType(field.type), tag);
  }
  // Optional scalars use param.Opt[T] (present-or-omitted); everything else the plain Go type.
  if (!required && isScalarRef(field.type)) {
    const paramQ = imports.add(`${ctx.modulePath}/packages/param`);
    return goField(goName, `${paramQ}.Opt[${goType(field.type)}]`, tag);
  }
  return goField(goName, goType(field.type), tag);
}

/** The named path (leading slash stripped), as a Go string literal or fmt.Sprintf expr. */
function pathExpression(path: string, pathParams: Param[], imports: Imports): string {
  const trimmed = path.replace(/^\//, '');
  if (!trimmed.includes('{')) return JSON.stringify(trimmed);
  imports.add('fmt');
  const args = pathParams.map((p) => goVar(p.name));
  let i = 0;
  const template = trimmed.replace(/\{[^}]+\}/g, () => {
    i += 1;
    return '%v';
  });
  const used = args.slice(0, i);
  return `fmt.Sprintf(${JSON.stringify(template)}, ${used.join(', ')})`;
}

/** The Go return signature, e.g. `(res *Pet, err error)` or `(err error)`. */
function returnSignature(method: Method, op: OperationPlan, pageType: string | null): string {
  if (op.binaryContentType) return '(res *http.Response, err error)'; // binary download: raw response, caller owns Body
  if (pageType) return `(res *${pageType}, err error)`; // paginated list: vendored generic page
  const ref = method.primaryResponse;
  if (!ref || op.primaryResponse === 'none') return '(err error)';
  if (op.primaryResponse === 'struct') return `(res *${goType(ref)}, err error)`;
  return `(res ${goType(ref)}, err error)`; // union/enum/alias/array/scalar -> value, decoded via &res
}

/** The Go statements that allocate the response and execute the request. */
function responseLines(
  method: Method,
  op: OperationPlan,
  ctx: GoCtx,
  pageType: string | null,
  imports: Imports,
): string[] {
  if (op.binaryContentType) return [`\tres, err = cfg.ExecuteRaw()`];
  if (pageType) {
    const lines = [`\tres = &${pageType}{}`, `\terr = cfg.Execute(res)`];
    // Inject the request state GetNextPage re-issues with — only after a
    // successful decode, and only when the method has a continuation param.
    const stateKey = pageStateKey(method, op.pageName);
    if (stateKey) {
      lines.push(`\tif err != nil {\n\t\treturn\n\t}`);
      lines.push(`\tres.SetPageConfig(cfg, ${JSON.stringify(stateKey)})`);
    }
    return lines;
  }
  const ref = method.primaryResponse;
  if (!ref || op.primaryResponse === 'none') return [`\terr = cfg.Execute(nil)`];
  // A mapped discriminated union decodes through its generated helper: fetch
  // the raw JSON, then pick the concrete variant by the discriminator.
  if (op.primaryResponse === 'union-mapped' && ref.kind === 'ref' && ref.name) {
    const union = ctx.types.get(ref.name);
    if (union) {
      imports.add('encoding/json');
      return [
        `\tvar raw json.RawMessage`,
        `\terr = cfg.Execute(&raw)`,
        `\tif err != nil {\n\t\treturn\n\t}`,
        `\tif len(raw) > 0 {\n\t\tres, err = ${unionUnmarshalerName(union)}(raw)\n\t}`,
      ];
    }
  }
  if (op.primaryResponse === 'struct') return [`\tres = &${goType(ref)}{}`, `\terr = cfg.Execute(res)`];
  return [`\terr = cfg.Execute(&res)`];
}
