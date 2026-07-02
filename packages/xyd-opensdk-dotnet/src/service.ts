import type { Field, Method, NamedType, Param, ResolvedSdkBehavior, Resource, TypeRef } from '@xyd-js/opensdk-core';
import { type OperationPlan, planOperation } from '@xyd-js/opensdk-framework';

import { csType, isBinaryTypeRef, nullable } from './cstype';
import { csDoc, csFile, indent } from './cswriter';
import { unionDecoderName, unionMapping } from './model';
import { camelCase, methodName, pascalCase, structPropertyNames } from './naming';
import { dotnetPageName } from './pagination';

/** Per-file emit context: root namespace, the IR symbol table, the SDK behavior policy. */
export interface DotnetServiceCtx {
  namespace: string;
  types: Map<string, NamedType>;
  behavior: ResolvedSdkBehavior;
}

const HTTP_METHOD: Record<string, string> = {
  get: 'HttpMethod.Get',
  post: 'HttpMethod.Post',
  put: 'HttpMethod.Put',
  patch: 'HttpMethod.Patch',
  delete: 'HttpMethod.Delete',
  head: 'HttpMethod.Head',
  options: 'HttpMethod.Options',
};

/** HTTP methods an auto-generated idempotency key makes sense for (mutating, replayable). */
const IDEMPOTENT_POST_LIKE = new Set(['post', 'put', 'patch']);

/**
 * Whether the runtime injects a generated idempotency key for this method: the
 * spec declared it, the method is POST-like, and the policy both auto-generates
 * keys and retries at all (retrying a POST without a key is the corruption bug
 * the retry story hinges on). Mirrors the Go/Python emitters.
 */
function methodInjectsIdempotency(method: Method, behavior: ResolvedSdkBehavior): boolean {
  if (!method.injectIdempotencyKey) return false;
  if (!IDEMPOTENT_POST_LIKE.has(method.httpMethod)) return false;
  return behavior.idempotency.autoGenerateForPost && behavior.retry.maxRetries > 0;
}

/**
 * The globally-unique service class name for a resource, PATH-QUALIFIED by the
 * FULL segment chain from root (mirrors the Go/Python emitters): two `roles`
 * resources under different parents get distinct class names
 * (`ProjectsRolesService` vs `ProjectsGroupsRolesService`) instead of one
 * shadowing the other. Property (field) names on the parent stay local
 * (`client.Pets`).
 */
export function serviceClassName(segments: string[]): string {
  return `${segments.map(pascalCase).join('')}Service`;
}

/** Emit one top-level resource (and its whole subtree) into a single C# file. */
export function renderServiceFile(resource: Resource, ctx: DotnetServiceCtx): { path: string; content: string } {
  const usings = new Set<string>([
    'System',
    'System.Collections.Generic',
    'System.Net.Http',
    'System.Threading',
    'System.Threading.Tasks',
  ]);
  const decls: string[] = [];
  emitService(resource, [resource.name], ctx, usings, decls);
  const className = serviceClassName([resource.name]);
  return { path: `${className}.cs`, content: csFile([...usings], ctx.namespace, decls) };
}

function emitService(
  resource: Resource,
  segments: string[],
  ctx: DotnetServiceCtx,
  usings: Set<string>,
  decls: string[],
): void {
  const cls = serviceClassName(segments);
  const subs = resource.resources || [];

  const members: string[] = ['private readonly Transport _transport;'];
  // Sub-resource accessor properties (path-qualified class, local property name).
  for (const sub of subs) {
    members.push(`public ${serviceClassName([...segments, sub.name])} ${pascalCase(sub.name)} { get; }`);
  }

  const ctorAssignments = ['_transport = transport;'];
  for (const sub of subs) {
    ctorAssignments.push(`${pascalCase(sub.name)} = new ${serviceClassName([...segments, sub.name])}(transport);`);
  }
  const ctor = `internal ${cls}(Transport transport)\n{\n${indent(ctorAssignments.join('\n'))}\n}`;

  const methods = (resource.methods || []).map((m) => emitMethod(m, ctx));

  const body = [members.join('\n'), ctor, ...methods].join('\n\n');
  const doc = csDoc(resource.description);
  const head = doc ? `${doc}\n` : '';
  decls.push(`${head}public sealed class ${cls}\n{\n${indent(body)}\n}`);

  for (const sub of subs) emitService(sub, [...segments, sub.name], ctx, usings, decls);
}

function emitMethod(method: Method, ctx: DotnetServiceCtx): string {
  const op = planOperation(method, ctx.types);
  const name = methodName(method.action);
  const pathParams = op.paramGroups.path;
  const queryParams = op.paramGroups.query;
  const headerParams = op.paramGroups.header;

  // --- signature: required args, then optional args, then CancellationToken ---
  const required: string[] = [];
  const optional: string[] = [];
  for (const p of pathParams) required.push(`${csType(p.type as TypeRef, ctx.types)} ${camelCase(p.name)}`);

  const bodyType = bodyModelType(method, ctx);
  if (bodyType) {
    if (op.bodyRequired) required.push(`${bodyType} body`);
    else optional.push(`${nullable(bodyType)} body = null`);
  }
  for (const q of [...queryParams, ...headerParams]) {
    const t = csType(q.type as TypeRef, ctx.types);
    if (q.required) required.push(`${t} ${camelCase(q.name)}`);
    else optional.push(`${nullable(t)} ${camelCase(q.name)} = null`);
  }
  const args = [...required, ...optional, 'CancellationToken cancellationToken = default'];

  // --- body statements ------------------------------------------------------
  const lines: string[] = [];
  for (const p of pathParams) {
    if (csType(p.type as TypeRef, ctx.types) !== 'string') continue;
    const arg = camelCase(p.name);
    lines.push(
      `if (string.IsNullOrEmpty(${arg}))\n{\n` +
        indent(`throw new ArgumentException("Expected a non-empty value for ${arg}.", nameof(${arg}));`) +
        `\n}`,
    );
  }

  const httpMethod = HTTP_METHOD[method.httpMethod] || `new HttpMethod(${JSON.stringify(method.httpMethod.toUpperCase())})`;
  const callArgs = [httpMethod, pathExpr(method.path, pathParams)];

  if (queryParams.length > 0) {
    lines.push(...queryLines(queryParams, ctx));
    callArgs.push('query: query');
  }

  // Body encoding: the IR encoding decides, but a json body carrying a binary
  // field is routed through multipart (some specs mislabel binary uploads as
  // application/json) — mirrors the Python emitter's override.
  let encoding = op.encoding ?? 'json';
  const bFields = bodyFields(method, ctx.types);
  if (bodyType && encoding === 'json' && bFields.some((f) => isBinaryTypeRef(f.type as TypeRef, ctx.types))) {
    encoding = 'multipart';
  }
  if (bodyType) {
    if (encoding === 'json') {
      callArgs.push('body: body');
    } else {
      // `body.<Prop>` must use the collision-resolved property identifier (CS0542/
      // CS0102) that the model declaration emitted — reuse the same allocator.
      const bodyIdents = structPropertyNames(bodyType as string, bFields.map((f) => f.name));
      const entries = bFields
        .map((f) => `[${JSON.stringify(f.name)}] = body.${bodyIdents.get(f.name) ?? pascalCase(f.name)},`)
        .join('\n');
      lines.push(`var bodyMap = new Dictionary<string, object?>\n{\n${indent(entries)}\n};`);
      callArgs.push('body: bodyMap');
      callArgs.push(`encoding: ${JSON.stringify(encoding)}`);
    }
  }

  const headerEntries = headerParams.map((h) => `[${JSON.stringify(h.wireName ?? h.name)}] = ${camelCase(h.name)},`);
  if (headerEntries.length > 0) {
    lines.push(`var headers = new Dictionary<string, string?>\n{\n${indent(headerEntries.join('\n'))}\n};`);
    callArgs.push('headers: headers');
  }

  if (methodInjectsIdempotency(method, ctx.behavior)) {
    callArgs.push('idempotency: true');
  }

  // --- return / dispatch ----------------------------------------------------
  const { returnType, statements } = returnPlan(method, op, ctx, callArgs);
  lines.push(...statements);

  const doc = csDoc(method.description);
  const head = doc ? `${doc}\n` : '';
  const signature = `public async ${returnType} ${name}(${args.join(', ')})`;
  return `${head}${signature}\n{\n${indent(lines.join('\n'))}\n}`;
}

/** How a query param serializes, by resolved type shape (mirrors the Go emitter's queryKind). */
type QueryKind = 'scalar' | 'array' | 'map' | 'object';

function queryKind(ref: TypeRef | undefined, types: Map<string, NamedType>): QueryKind {
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

/**
 * The `var query = new Dictionary<string, object?> {...};` declaration plus any
 * deepObject expansions. Scalars and exploded arrays are single dict entries;
 * explode=false arrays comma-join; non-exploded maps/objects JSON-encode; a
 * deepObject map expands to `key[sub]=value` entries after the literal.
 */
function queryLines(queryParams: Param[], ctx: DotnetServiceCtx): string[] {
  const literalEntries: string[] = [];
  const expansions: string[] = [];
  for (const q of queryParams) {
    const arg = camelCase(q.name);
    const wire = q.wireName ?? q.name;
    const kind = queryKind(q.type as TypeRef, ctx.types);
    const deepObject = q.style === 'deepObject';

    if (kind === 'map' && deepObject) {
      expansions.push(
        `if (${arg} != null)\n{\n` +
          indent(`foreach (var entry in ${arg})\n{\n` + indent(`query[$"${wire}[{entry.Key}]"] = entry.Value;`) + `\n}`) +
          `\n}`,
      );
      continue;
    }

    let value = arg;
    if (kind === 'array' && q.explode === false) value = `Transport.JoinCsv(${arg})`;
    else if (kind === 'map' || kind === 'object') value = `Transport.JsonQuery(${arg})`;
    literalEntries.push(`[${JSON.stringify(wire)}] = ${value},`);
  }

  const decl = literalEntries.length
    ? `var query = new Dictionary<string, object?>\n{\n${indent(literalEntries.join('\n'))}\n};`
    : 'var query = new Dictionary<string, object?>();';
  return [decl, ...expansions];
}

/** The request-body model type, or null when the method has no body. */
function bodyModelType(method: Method, ctx: DotnetServiceCtx): string | null {
  const ref = method.requestBody?.type as TypeRef | undefined;
  if (!ref) return null;
  return csType(ref, ctx.types);
}

/** Resolve a request body's fields by following its TypeRef into the symbol table. */
function bodyFields(method: Method, types: Map<string, NamedType>): Field[] {
  const ref = method.requestBody?.type as TypeRef | undefined;
  if (ref?.kind === 'ref' && ref.name) {
    const named = types.get(ref.name);
    if (named?.fields) return named.fields;
  }
  return [];
}

/** The `Task<T>` return type + the transport statement(s) for a method. */
function returnPlan(
  method: Method,
  op: OperationPlan,
  ctx: DotnetServiceCtx,
  callArgs: string[],
): { returnType: string; statements: string[] } {
  const tail = 'cancellationToken: cancellationToken';
  if (op.binaryContentType) {
    const accept = `accept: ${JSON.stringify(op.binaryContentType)}`;
    return {
      returnType: 'Task<byte[]>',
      statements: [
        `return await _transport.RequestRawAsync(${[...callArgs, accept, tail].join(', ')}).ConfigureAwait(false);`,
      ],
    };
  }

  // Paginated list: a typed page container decoded from the {data, has_more} envelope.
  const page = dotnetPageName(op);
  if (page) {
    const item = csType(method.pagination?.itemType as TypeRef | undefined, ctx.types);
    const type = `${page}<${item}>`;
    return {
      returnType: `Task<${type}>`,
      statements: [
        `return await _transport.RequestAsync<${type}>(${[...callArgs, tail].join(', ')}).ConfigureAwait(false);`,
      ],
    };
  }

  const ref = method.primaryResponse as TypeRef | undefined;
  if (!ref || op.primaryResponse === 'none') {
    return {
      returnType: 'Task',
      statements: [`await _transport.RequestAsync(${[...callArgs, tail].join(', ')}).ConfigureAwait(false);`],
    };
  }

  // A mapped discriminated union decodes through its generated helper: fetch the
  // raw JSON, then pick the concrete variant by the discriminator.
  if (op.primaryResponse === 'union-mapped' && ref.kind === 'ref' && ref.name) {
    const union = ctx.types.get(ref.name);
    if (union && unionMapping(union)) {
      return {
        returnType: 'Task<object?>',
        statements: [
          `string content = await _transport.RequestStringAsync(${[...callArgs, tail].join(', ')}).ConfigureAwait(false);`,
          `return ${unionDecoderName(union.name)}.Decode(content);`,
        ],
      };
    }
  }

  const type = csType(ref, ctx.types);
  return {
    returnType: `Task<${type}>`,
    statements: [
      `return await _transport.RequestAsync<${type}>(${[...callArgs, tail].join(', ')}).ConfigureAwait(false);`,
    ],
  };
}

/** The path as a C# string literal, or an interpolated string when it has params. */
function pathExpr(path: string, pathParams: Param[]): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!p.includes('{')) return JSON.stringify(p);
  const byWire = new Map(pathParams.map((param) => [param.wireName ?? param.name, camelCase(param.name)]));
  const interpolated = p.replace(/\{([^}]+)\}/g, (_, wire) => `{${byWire.get(wire) ?? camelCase(wire)}}`);
  return `$${JSON.stringify(interpolated)}`;
}
