import type { Method, NamedType, Param, ResolvedSdkBehavior, Resource, TypeRef } from '@xyd-js/opensdk-core';
import { type OperationPlan, type PageName, planOperation } from '@xyd-js/opensdk-framework';

import { jsDoc, propKey, unionDecodeName } from './model';
import { camelCase, nodeMethodName, pascalCase, singularPascalCase, slug } from './naming';
import { ModelRefs, bodyFields, isBinaryTypeRef, nodeType } from './nodetype';

/** Per-file render context: the IR symbol table + resolved runtime behavior. */
export interface NodeCtx {
  types: Map<string, NamedType>;
  behavior: ResolvedSdkBehavior;
}

/** Per-file import trackers (model types, decode fns, page containers, joinCsv). */
interface FileUses {
  refs: ModelRefs;
  decodeNames: Set<string>;
  pages: Set<PageName>;
  needsJoinCsv: boolean;
  hasNested: boolean;
}

/**
 * The globally-unique resource CLASS name, path-qualified by the FULL segment
 * chain (openai-node keeps the plural: `Pets`, `Batches`). Two `photos`
 * resources under different parents get distinct names (`PetsPhotos` vs
 * `UsersPhotos`) so one never shadows the other in the single generated file.
 */
export function resourceClassName(segments: string[]): string {
  return segments.map(pascalCase).join('');
}

/** The params-type qualifier (SINGULARIZED, openai-node's `PetCreateParams` shape). */
function paramsQualifier(segments: string[]): string {
  return segments.map(singularPascalCase).join('');
}

/** Emit `src/resources/index.ts`: the barrel re-exporting every top-level resource file. */
export function renderResourcesIndexFile(resources: Resource[]): string {
  const lines = resources.map((r) => `export * from './${slug(r.name) || 'resource'}';`);
  return `${lines.join('\n')}\n`;
}

/** Emit one top-level resource (and its whole subtree) into a single file. */
export function renderResourceFile(resource: Resource, ctx: NodeCtx): { path: string; content: string } {
  const uses: FileUses = {
    refs: new ModelRefs(),
    decodeNames: new Set(),
    pages: new Set(),
    needsJoinCsv: false,
    hasNested: false,
  };
  const classes: string[] = [];
  const paramInterfaces: string[] = [];

  const emit = (res: Resource, segments: string[]) => {
    if (res.resources?.length) uses.hasNested = true;
    classes.push(emitClass(res, segments, ctx, uses, paramInterfaces));
    for (const sub of res.resources || []) emit(sub, [...segments, sub.name]);
  };
  emit(resource, [resource.name]);

  const coreImports = ['RequestOptions', ...(uses.hasNested ? ['APIClient'] : [])].sort();
  const lines = [
    `import { APIResource } from '../core/resource';`,
    `import type { ${coreImports.join(', ')} } from '../core/request';`,
  ];
  if (uses.needsJoinCsv) lines.push(`import { joinCsv } from '../core/request';`);
  if (uses.pages.size) {
    const names = (['CursorPage', 'OffsetPage', 'Page'] as const).filter((n) => uses.pages.has(n));
    lines.push(`import { ${names.join(', ')} } from '../core/pagination';`);
  }
  const modelNames = uses.refs.sorted();
  if (modelNames.length) lines.push(`import type { ${modelNames.join(', ')} } from '../models';`);
  if (uses.decodeNames.size) lines.push(`import { ${[...uses.decodeNames].sort().join(', ')} } from '../models';`);

  const blocks = [lines.join('\n'), ...classes, ...paramInterfaces];
  return { path: `src/resources/${slug(resource.name) || 'resource'}.ts`, content: `${blocks.join('\n\n')}\n` };
}

function emitClass(
  resource: Resource,
  segments: string[],
  ctx: NodeCtx,
  uses: FileUses,
  paramInterfaces: string[],
): string {
  const cls = resourceClassName(segments);
  const subs = resource.resources || [];
  const members: string[] = [];

  // sub-resource fields + a constructor that wires them (openai-node's shape).
  if (subs.length) {
    for (const sub of subs) {
      members.push(`  readonly ${camelCase(sub.name)}: ${resourceClassName([...segments, sub.name])};`);
    }
    const ctorLines = ['    super(client);'];
    for (const sub of subs) {
      ctorLines.push(`    this.${camelCase(sub.name)} = new ${resourceClassName([...segments, sub.name])}(client);`);
    }
    members.push(`  constructor(client: APIClient) {\n${ctorLines.join('\n')}\n  }`);
  }

  for (const method of resource.methods || []) {
    members.push(emitMethod(segments, method, ctx, uses, paramInterfaces));
  }

  const doc = jsDoc(resource.description);
  const body = members.length ? `\n${members.join('\n\n')}\n` : '';
  return `${doc}export class ${cls} extends APIResource {${body}}`;
}

function emitMethod(
  segments: string[],
  method: Method,
  ctx: NodeCtx,
  uses: FileUses,
  paramInterfaces: string[],
): string {
  const op = planOperation(method, ctx.types);
  const name = nodeMethodName(method.action);
  const pathParams = op.paramGroups.path;
  const queryParams = op.paramGroups.query;
  const headerParams = op.paramGroups.header;
  const hasBody = op.hasBody;
  const rawContentType = op.binaryContentType;
  const bodyList = bodyFields(method.requestBody?.type, ctx.types);

  // The params object argument (body/query/header), openai-node's `PetCreateParams`.
  const hasParams = hasBody || queryParams.length > 0 || headerParams.length > 0;
  const argName = paramsArgName(hasBody, queryParams.length, headerParams.length);
  const paramsType = `${paramsQualifier(segments)}${pascalCase(method.action)}Params`;
  if (hasParams) {
    paramInterfaces.push(
      renderParamsInterface(paramsType, hasBody, bodyList, queryParams, headerParams, uses.refs),
    );
  }

  // signature: positional path args, then the params arg, then options.
  const args = pathParams.map((p) => `${camelCase(p.name)}: ${nodeType(p.type, uses.refs)}`);
  if (hasParams) {
    const optional = paramsRequired(hasBody, op.bodyRequired, queryParams, headerParams) ? '' : '?';
    args.push(`${argName}${optional}: ${paramsType}`);
  }
  args.push('options?: RequestOptions');

  // Whether the params argument is optional — expanded member accesses must then
  // use optional chaining (`query?.tags`) to stay strict-null safe.
  const argOptional = hasParams && !paramsRequired(hasBody, op.bodyRequired, queryParams, headerParams);

  // The request({ ... }) argument object (object-shorthand when the value is the arg itself).
  const entries = [`method: ${JSON.stringify(method.httpMethod.toUpperCase())}`, `path: ${pathExpr(method.path)}`];
  if (queryParams.length) {
    const qv = queryValue(argName, queryParams, uses, argOptional);
    entries.push(qv === 'query' ? 'query' : `query: ${qv}`);
  }
  const encoding = bodyEncoding(op, bodyList, ctx.types);
  if (hasBody) {
    const bv = bodyValue(argName, bodyList, queryParams.length + headerParams.length > 0, argOptional);
    entries.push(bv === 'body' ? 'body' : `body: ${bv}`);
  }
  const headerEntries = headerObjectEntries(rawContentType, argName, headerParams, argOptional);
  if (headerEntries) entries.push(`headers: ${headerEntries}`);
  if (hasBody && encoding !== 'json') entries.push(`encoding: ${JSON.stringify(encoding)}`);
  if (rawContentType) entries.push('raw: true');
  if (op.injectIdempotencyKey && ctx.behavior.idempotency.autoGenerateForPost) entries.push('idempotency: true');

  const argObject = `{ ${entries.join(', ')} }`;
  const { returnType, call } = returnPlan(op, argObject, uses, ctx);

  const guards = pathParamGuards(pathParams);
  const rawDoc = method.description ? jsDoc(method.description).trimEnd() : '';
  const docBlock = rawDoc ? `  ${rawDoc.replace(/\n/g, '\n  ')}\n` : '';
  return (
    `${docBlock}  ${name}(${args.join(', ')}): Promise<${returnType}> {\n` +
    guards +
    `${call}\n` +
    `  }`
  );
}

/**
 * The return type + the `return this._client.request(...)` statement. Binary
 * downloads return the raw Response; a paginated list wraps the envelope in its
 * vendored page container; a discriminator-mapped union routes through its
 * `decode<Union>` helper; everything else decodes to the primary response type.
 */
function returnPlan(
  op: OperationPlan,
  argObject: string,
  uses: FileUses,
  ctx: NodeCtx,
): { returnType: string; call: string } {
  const method = op.method;
  if (op.binaryContentType) {
    return { returnType: 'Response', call: `    return this._client.request<Response>(${argObject}, options);` };
  }
  if (op.pageName) {
    uses.pages.add(op.pageName);
    const item = nodeType(method.pagination?.itemType as TypeRef | undefined, uses.refs);
    return {
      returnType: `${op.pageName}<${item}>`,
      call:
        `    return this._client\n` +
        `      .request<unknown>(${argObject}, options)\n` +
        `      .then((raw) => ${op.pageName}.fromResponse<${item}>(raw));`,
    };
  }
  if (op.primaryResponse === 'none') {
    return { returnType: 'void', call: `    return this._client.request<void>(${argObject}, options);` };
  }
  const returnType = nodeType(method.primaryResponse, uses.refs);
  const decode = op.primaryResponse === 'union-mapped' ? unionDecodeFor(method.primaryResponse, ctx) : null;
  if (decode) {
    uses.decodeNames.add(decode);
    return {
      returnType,
      call:
        `    return this._client\n` +
        `      .request<unknown>(${argObject}, options)\n` +
        `      .then(${decode});`,
    };
  }
  return { returnType, call: `    return this._client.request<${returnType}>(${argObject}, options);` };
}

/** The `decode<Union>` helper name for a union-mapped primary-response ref, or null. */
function unionDecodeFor(ref: TypeRef | undefined, ctx: NodeCtx): string | null {
  if (ref?.kind !== 'ref' || !ref.name) return null;
  const named = ctx.types.get(ref.name);
  return named ? unionDecodeName(named) : null;
}

/** The params argument name, mirroring the Go emitter's planParams. */
function paramsArgName(hasBody: boolean, queryCount: number, headerCount: number): string {
  if (hasBody) return queryCount + headerCount > 0 ? 'params' : 'body';
  return queryCount > 0 ? 'query' : 'params';
}

function paramsRequired(hasBody: boolean, bodyRequired: boolean, query: Param[], header: Param[]): boolean {
  if (hasBody) return bodyRequired;
  return query.some((p) => p.required) || header.some((p) => p.required);
}

/** The body wire encoding: the IR encoding, upgraded to multipart for a json body carrying a binary field. */
function bodyEncoding(
  op: OperationPlan,
  bodyList: ReturnType<typeof bodyFields>,
  types: Map<string, NamedType>,
): 'json' | 'multipart' | 'form' {
  const encoding = op.encoding ?? 'json';
  if (encoding === 'json' && bodyList.some((f) => isBinaryTypeRef(f.type, types))) return 'multipart';
  return encoding;
}

function renderParamsInterface(
  typeName: string,
  hasBody: boolean,
  bodyList: ReturnType<typeof bodyFields>,
  queryParams: Param[],
  headerParams: Param[],
  refs: ModelRefs,
): string {
  const lines: string[] = [];
  if (hasBody) {
    for (const f of bodyList) {
      lines.push(`  ${propKey(f.name)}${f.required ? '' : '?'}: ${nodeType(f.type, refs)};`);
    }
  }
  // query/header params keyed by their LOGICAL name (mapped to the wire name at
  // request time), so a param like `tags` reads nicely even when its wire key is `tags[]`.
  for (const p of [...queryParams, ...headerParams]) {
    lines.push(`  ${propKey(p.name)}${p.required ? '' : '?'}: ${nodeType(p.type, refs)};`);
  }
  const body = lines.length ? `\n${lines.join('\n')}\n` : '';
  return `export interface ${typeName} {${body}}`;
}

/** The query value: the whole params object (query-only, no wire remapping), else a picked literal. */
function queryValue(argName: string, queryParams: Param[], uses: FileUses, optional: boolean): string {
  const needsExplicit = queryParams.some(
    (q) => (q.wireName && q.wireName !== q.name) || (q.type?.kind === 'array' && q.explode === false),
  );
  if (argName === 'query' && !needsExplicit) return 'query';
  const entries = queryParams.map((q) => {
    const wire = q.wireName ?? q.name;
    if (q.type?.kind === 'array' && q.explode === false) {
      uses.needsJoinCsv = true;
      return `${propKey(wire)}: joinCsv(${memberAccess(argName, q.name, optional)})`;
    }
    return `${propKey(wire)}: ${memberAccess(argName, q.name, optional)}`;
  });
  return `{ ${entries.join(', ')} }`;
}

/** The body value: the whole params object (body-only), else a picked literal (body fields). */
function bodyValue(
  argName: string,
  bodyList: ReturnType<typeof bodyFields>,
  mixed: boolean,
  optional: boolean,
): string {
  if (!mixed) return argName;
  const entries = bodyList.map((f) => `${propKey(f.name)}: ${memberAccess(argName, f.name, optional)}`);
  return `{ ${entries.join(', ')} }`;
}

/** The headers object literal (Accept for binary downloads + header params by wire name), or ''. */
function headerObjectEntries(
  rawContentType: string | null,
  argName: string,
  headerParams: Param[],
  optional: boolean,
): string {
  const entries: string[] = [];
  if (rawContentType) entries.push(`Accept: ${JSON.stringify(rawContentType)}`);
  for (const h of headerParams) {
    const wire = h.wireName ?? h.name;
    entries.push(`${propKey(wire)}: ${memberAccess(argName, h.name, optional)}`);
  }
  return entries.length ? `{ ${entries.join(', ')} }` : '';
}

/** `obj.key` (or `obj?.key` when the params arg is optional), quoting non-identifier keys. */
function memberAccess(obj: string, key: string, optional: boolean): string {
  const ident = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
  if (optional) return ident ? `${obj}?.${key}` : `${obj}?.[${JSON.stringify(key)}]`;
  return ident ? `${obj}.${key}` : `${obj}[${JSON.stringify(key)}]`;
}

/** Reject an empty string for each required string path param before building the path. */
function pathParamGuards(pathParams: Param[]): string {
  let out = '';
  for (const p of pathParams) {
    if (p.type?.kind !== 'scalar' || p.type.scalar !== 'string' || p.required === false) continue;
    const name = camelCase(p.name);
    out += `    if (!${name}) {\n      throw new Error(${JSON.stringify(`missing required ${p.name} parameter`)});\n    }\n`;
  }
  return out;
}

/** The path as a string literal, or a template literal when it has params. */
function pathExpr(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!p.includes('{')) return JSON.stringify(p);
  const tmpl = p.replace(/\{([^}]+)\}/g, (_, w) => `\${${camelCase(w)}}`);
  return `\`${tmpl}\``;
}
