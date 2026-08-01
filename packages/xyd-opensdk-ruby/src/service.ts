import type { Field, Method, NamedType, Param, Resource, TypeRef } from '@xyd-js/opensdk-core';
import type {
  NeutralTypeField,
  NeutralTypeReference,
  OperationPlan,
  RenderedTypeField,
  RenderedTypeReference,
} from '@xyd-js/opensdk-framework';
import { planOperation, planTypeReference, refSchemaName } from '@xyd-js/opensdk-framework';

import { unionDecoderRef, unionMapping } from './model';
import { pascalCase, rubyMethodName, snakeCase } from './naming';
import { rbDocType } from './rbtype';
import { block, indent, rbComment, rbString } from './rbwriter';

/** Per-file emit context: module namespace, gem name, symbol table. */
export interface RubyCtx {
  moduleName: string;
  pkg: string;
  types: Map<string, NamedType>;
}

/**
 * The globally-unique Ruby class name for a resource, path-qualified by its
 * FULL segment chain from root (mirrors the Go emitter's serviceTypeName and
 * the Python emitter's resourceClassName). A nested `roles` under two different
 * parents therefore gets two distinct class names instead of one shadowing the
 * other in the single generated resources file. Accessor (attr) names stay
 * local (`client.pets`, `pets.inventory`).
 */
export function resourceClassName(segments: string[]): string {
  return segments.map((s) => pascalCase(s)).join('');
}

/** Emit one top-level resource (and its whole nested subtree) into one file. */
export function renderServiceFile(resource: Resource, ctx: RubyCtx): { path: string; content: string } {
  const classes: string[] = [];
  emitResource(resource, [resource.name], ctx, classes);
  const body = classes.join('\n\n');
  const content = `${block(`module ${ctx.moduleName}`, block('module Resources', body))}\n`;
  return { path: `lib/${ctx.pkg}/resources/${snakeCase(resource.name)}.rb`, content };
}

function emitResource(resource: Resource, segments: string[], ctx: RubyCtx, out: string[]): void {
  const cls = resourceClassName(segments);
  const subs = resource.resources || [];

  const members: string[] = [];
  // attr_reader for each nested sub-resource (local, plural accessor name).
  if (subs.length > 0) {
    members.push(`attr_reader ${subs.map((s) => `:${snakeCase(s.name)}`).join(', ')}`);
  }

  // @api private constructor: shares the client's transport, wires sub-resources.
  const ctorLines = ['# @api private', 'def initialize(transport)', indent('@transport = transport')];
  for (const sub of subs) {
    ctorLines.push(indent(`@${snakeCase(sub.name)} = ${resourceClassName([...segments, sub.name])}.new(transport)`));
  }
  ctorLines.push('end');
  members.push(ctorLines.join('\n'));

  for (const method of resource.methods || []) members.push(emitMethod(method, ctx));

  const doc = rbComment(resource.description);
  const head = doc ? `${doc}\n` : '';
  out.push(`${head}${block(`class ${cls}`, members.join('\n\n'))}`);

  for (const sub of subs) emitResource(sub, [...segments, sub.name], ctx, out);
}

function emitMethod(method: Method, ctx: RubyCtx): string {
  const op = planOperation(method, ctx.types);
  const name = rubyMethodName(method.action);
  const pathParams = op.paramGroups.path;
  const queryParams = op.paramGroups.query;
  const headerParams = op.paramGroups.header;
  const bodyFields = bodyFieldList(method, ctx.types);

  // Signature: positional path params, then keyword args (query, header, body).
  const positional = pathParams.map((p) => snakeCase(p.name));
  const kwargs: string[] = [];
  for (const p of [...queryParams, ...headerParams]) kwargs.push(kwArg(p.name, p.required));
  for (const f of bodyFields) kwargs.push(kwArg(f.name, f.required));
  const params = [...positional, ...kwargs];
  const signature = params.length ? `def ${name}(${params.join(', ')})` : `def ${name}`;

  // Transport call keyword arguments.
  const callArgs = [`method: :${method.httpMethod}`, `path: ${pathLiteral(method.path, pathParams)}`];
  if (queryParams.length) {
    callArgs.push(`query: { ${queryParams.map((p) => queryEntry(p, ctx.moduleName)).join(', ')} }`);
  }
  if (bodyFields.length) {
    callArgs.push(`body: { ${bodyFields.map((f) => `${rbString(f.name)} => ${snakeCase(f.name)}`).join(', ')} }`);
  }
  const headerEntries = headerParams.map(wireEntry);
  if (op.binaryContentType) headerEntries.unshift(`"Accept" => ${rbString(op.binaryContentType)}`);
  if (headerEntries.length) callArgs.push(`headers: { ${headerEntries.join(', ')} }`);
  const encoding = op.encoding ?? 'json';
  if (op.hasBody && encoding !== 'json') callArgs.push(`encoding: ${rbString(encoding)}`);
  if (op.binaryContentType) callArgs.push('raw: true');
  if (op.injectIdempotencyKey) callArgs.push('idempotency: true');

  const call = `@transport.request(\n${indent(callArgs.join(',\n'))}\n)`;

  const bodyLines: string[] = [...pathParamGuards(pathParams), ...responseLines(method, op, ctx, call)];

  const doc = methodDoc(method, op, pathParams, queryParams, headerParams, bodyFields);
  const head = doc ? `${doc}\n` : '';
  return `${head}${block(signature, bodyLines.join('\n'))}`;
}

/** One keyword-arg fragment: required (`name:`) or optional (`name: nil`). */
function kwArg(wireName: string, required: boolean | undefined): string {
  const local = snakeCase(wireName);
  return required ? `${local}:` : `${local}: nil`;
}

/** A `"wire" => local` hash entry (header), honoring the wire name. */
function wireEntry(p: Param): string {
  return `${rbString(p.wireName ?? p.name)} => ${snakeCase(p.name)}`;
}

/**
 * One query `"wire" => value` entry, honoring the wire name and OpenAPI
 * explode. An exploded array repeats its key (handled by the transport, which
 * expands array values); a non-exploded (`explode: false`) array comma-joins
 * into a single value via the runtime's `join_csv`. Mirrors the Go/Python
 * emitters' explode routing.
 */
function queryEntry(p: Param, moduleName: string): string {
  const key = rbString(p.wireName ?? p.name);
  const local = snakeCase(p.name);
  if (p.type?.kind === 'array' && p.explode === false) {
    return `${key} => ${moduleName}.join_csv(${local})`;
  }
  return `${key} => ${local}`;
}

/**
 * Guard each required string path param before building the path: an empty
 * segment would silently collapse `/pets/{id}` to the collection endpoint.
 * Mirrors the Go/Python emitters (and openai-ruby's own empty-value guard).
 */
function pathParamGuards(pathParams: Param[]): string[] {
  const lines: string[] = [];
  for (const p of pathParams) {
    if (p.type?.kind !== 'scalar' || p.type.scalar !== 'string' || p.required === false) continue;
    const local = snakeCase(p.name);
    lines.push(
      `raise ArgumentError, "Expected a non-empty value for \`${local}\`" if ${local}.nil? || ${local}.to_s.empty?`,
      '',
    );
  }
  return lines;
}

/** The method body's response handling: page wrap, union decode, raw bytes, or plain return. */
function responseLines(method: Method, op: ReturnType<typeof planOperation>, ctx: RubyCtx, call: string): string[] {
  if (op.binaryContentType) return [call];
  if (op.pageName) {
    const itemsField = method.pagination?.itemsField ?? 'data';
    const nextField = method.pagination?.nextField ?? 'has_more';
    return [
      `response = ${call}`,
      `${ctx.moduleName}::Page.new(data: (response || {})[:${snakeCase(itemsField)}], has_more: (response || {})[:${snakeCase(nextField)}])`,
    ];
  }
  // A mapped discriminated union response decodes through its generated helper:
  // peek the discriminator, build the concrete variant (raw fallback on miss).
  if (op.primaryResponse === 'union-mapped') {
    const ref = method.primaryResponse;
    if (ref?.kind === 'ref' && ref.name) {
      const named = ctx.types.get(ref.name);
      if (named && unionMapping(named)) {
        return [`response = ${call}`, `${unionDecoderRef(ctx.moduleName, named)}.decode(response)`];
      }
    }
  }
  return [call];
}

/** Resolve a request body's fields by following its TypeRef into the symbol table. */
function bodyFieldList(method: Method, types: Map<string, NamedType>): Field[] {
  const ref = method.requestBody?.type;
  if (ref?.kind === 'ref' && ref.name) {
    const named = types.get(ref.name);
    if (named?.fields) return named.fields;
  }
  return [];
}

/** The path as a Ruby string literal, interpolating `{param}` -> `#{local}`. */
function pathLiteral(path: string, pathParams: Param[]): string {
  const trimmed = path.startsWith('/') ? path : `/${path}`;
  if (!trimmed.includes('{')) return rbString(trimmed);
  const interpolated = trimmed.replace(/\{([^}]+)\}/g, (_, name) => `#{${snakeCase(name)}}`);
  return `"${interpolated}"`;
}

/** A YARD-style `@overload` / `@param` / `@return` doc block for the method. */
function methodDoc(
  method: Method,
  op: ReturnType<typeof planOperation>,
  pathParams: Param[],
  queryParams: Param[],
  headerParams: Param[],
  bodyFields: Field[],
): string {
  const lines: string[] = [];
  if (method.description) lines.push(method.description.trim(), '');
  for (const p of pathParams) lines.push(`@param ${snakeCase(p.name)} [${rbDocType(p.type)}]`);
  for (const p of [...queryParams, ...headerParams]) lines.push(`@param ${snakeCase(p.name)} [${rbDocType(p.type)}]`);
  for (const f of bodyFields) lines.push(`@param ${snakeCase(f.name)} [${rbDocType(f.type)}]`);
  lines.push(`@return [${returnDoc(method, op)}]`);
  return rbComment(lines.join('\n'));
}

function returnDoc(method: Method, op: ReturnType<typeof planOperation>): string {
  if (op.binaryContentType) return 'String';
  if (op.pageName) return `Page<${rbDocType(method.pagination?.itemType as TypeRef | undefined)}>`;
  if (!method.primaryResponse) return 'nil';
  return rbDocType(method.primaryResponse);
}

// ---- type reference (Atlas SDK-types view) -------------------------------

/**
 * The kwarg YARD type of a request field — mirrors methodDoc's `@param` type
 * (a plain `rbDocType`). Ruby flattens the params struct to keyword args and is
 * duck-typed, so location (body/query/header) and optionality don't change the
 * documented type (a `nil` default rides on the arg, not the type).
 */
function rbFieldTypeDisplay(f: NeutralTypeField): string {
  return rbDocType(f.typeRef);
}

/** One neutral field → a rendered row: snake_case name + its YARD type string. */
function rbRenderField(f: NeutralTypeField): RenderedTypeField {
  return {
    name: snakeCase(f.logicalName),
    langType: rbFieldTypeDisplay(f),
    required: f.required,
    description: f.description,
    deprecated: f.deprecated,
    refTypeName: refSchemaName(f.typeRef),
  };
}

function rbResponse(
  method: Method,
  op: OperationPlan,
  neutral: NeutralTypeReference,
): RenderedTypeReference['response'] {
  const langType = returnDoc(method, op);
  if (op.binaryContentType) return { langType, note: `binary download (${op.binaryContentType})` };
  const ref = neutral.response.typeRef;
  if (!ref || op.primaryResponse === 'none') return { langType: 'nil', note: 'no response body' };
  const note = op.pageName ? `paginated (Page)` : undefined;
  if (neutral.response.fields) {
    return {
      typeName: langType,
      note,
      fields: neutral.response.fields.map((f) => ({
        name: snakeCase(f.logicalName),
        langType: rbDocType(f.typeRef),
        required: f.required,
        description: f.description,
        deprecated: f.deprecated,
        refTypeName: refSchemaName(f.typeRef),
      })),
    };
  }
  return { typeName: langType, langType, note };
}

/**
 * The per-operation TYPE REFERENCE for Ruby: the idiomatic call signature, the
 * request kwargs' field rows, and the response type — the SDK-native view Atlas
 * renders in place of the REST param definitions. Ruby flattens the params
 * struct to keyword args, so `request.typeName` is left undefined (mirrors the
 * Go/Python emitters, using Ruby's primitives). `segments` is the resource-name
 * path (root→owner) the method hangs off.
 */
export function generateRubyTypeReference(method: Method, segments: string[], ctx: RubyCtx): RenderedTypeReference {
  const op = planOperation(method, ctx.types);
  const neutral = planTypeReference(method, ctx.types);

  const requestFields = neutral.request.fields.map(rbRenderField);

  // The call signature: `client.<attr>.<action>(<path args>, <kwargs>) -> <return>`.
  // Positional path params (snake), then each request field as a keyword
  // (required → `name:`, optional → `name: nil`), mirroring emitMethod's arg order.
  const attrs = segments.map((s) => snakeCase(s));
  const action = rubyMethodName(method.action);
  const callChain = `client.${[...attrs, action].join('.')}`;
  const args = [...op.paramGroups.path.map((p) => snakeCase(p.name))];
  for (const f of neutral.request.fields) {
    const n = snakeCase(f.logicalName);
    args.push(f.required ? `${n}:` : `${n}: nil`);
  }
  const signature = `${callChain}(${args.join(', ')}) -> ${returnDoc(method, op)}`;

  return {
    signature,
    request: { typeName: undefined, fields: requestFields },
    response: rbResponse(method, op, neutral),
  };
}
