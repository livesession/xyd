import type { Field, Method, NamedType, Param, Resource, TypeRef } from '@xyd-js/opensdk-core';
import { type OperationPlan, planOperation } from '@xyd-js/opensdk-framework';

import { pascalCase, rustMethodName, snakeCase } from './naming';
import { isBinaryRef, rsType } from './rstype';
import { braced, rsDoc, rsString } from './rswriter';

/** Per-file emit context: crate name + the symbol table. */
export interface RustCtx {
  crate: string;
  types: Map<string, NamedType>;
}

/**
 * The globally-unique Rust struct name for a resource, path-qualified by its FULL
 * segment chain from root (mirrors the Go/Ruby/Python emitters). A nested `roles`
 * under two different parents therefore gets two distinct struct names. Accessor
 * (method) names stay local (`client.pets()`, `pets.inventory()`).
 */
export function resourceClassName(segments: string[]): string {
  return segments.map((s) => pascalCase(s)).join('');
}

/** Emit one top-level resource (and its whole nested subtree) into one file. */
export function renderServiceFile(resource: Resource, ctx: RustCtx): { path: string; content: string } {
  const items: string[] = [];
  emitResource(resource, [resource.name], ctx, items);
  const uses = `use std::sync::Arc;

use crate::error::Error;
use crate::models::*;
use crate::transport::{Page, Transport};`;
  const content = `${uses}\n\n${items.join('\n\n')}\n`;
  return { path: `src/${snakeCase(resource.name)}.rs`, content };
}

function emitResource(resource: Resource, segments: string[], ctx: RustCtx, out: string[]): void {
  const cls = resourceClassName(segments);
  const subs = resource.resources || [];

  const implMembers: string[] = [];
  implMembers.push(
    braced(`pub(crate) fn new(transport: Arc<Transport>) -> Self`, `${cls} { transport }`),
  );
  for (const sub of subs) {
    const subCls = resourceClassName([...segments, sub.name]);
    implMembers.push(
      braced(`pub fn ${snakeCase(sub.name)}(&self) -> ${subCls}`, `${subCls}::new(self.transport.clone())`),
    );
  }

  const paramsStructs: string[] = [];
  for (const method of resource.methods || []) {
    const emitted = emitMethod(method, cls, ctx);
    implMembers.push(emitted.fn);
    if (emitted.paramsStruct) paramsStructs.push(emitted.paramsStruct);
  }

  const doc = rsDoc(resource.description);
  const head = doc ? `${doc}\n` : '';
  out.push(`${head}pub struct ${cls} {\n    transport: Arc<Transport>,\n}`);
  out.push(braced(`impl ${cls}`, implMembers.join('\n\n')));
  for (const s of paramsStructs) out.push(s);

  for (const sub of subs) emitResource(sub, [...segments, sub.name], ctx, out);
}

function emitMethod(method: Method, cls: string, ctx: RustCtx): { fn: string; paramsStruct: string | null } {
  const op = planOperation(method, ctx.types);
  const name = rustMethodName(method.action);
  const pathParams = op.paramGroups.path;
  const queryParams = op.paramGroups.query;
  const headerParams = op.paramGroups.header;
  const bodyFields = bodyFieldList(method, ctx.types);
  const encoding = op.encoding ?? 'json';

  const hasParams = queryParams.length + headerParams.length + bodyFields.length > 0;
  const paramsName = paramsStructName(cls, method.action);
  const willMutate = hasParams || op.injectIdempotencyKey;

  // Signature: positional path args, then a single params struct when present.
  const args = pathParams.map(pathArg);
  if (hasParams) args.push(`params: ${paramsName}`);
  const argList = args.length ? `, ${args.join(', ')}` : '';
  const signature = `pub async fn ${name}(&self${argList}) -> Result<${returnType(method, op)}, Error>`;

  const lines: string[] = [];

  // Guard required string path params: an empty segment silently collapses the URL.
  const guards = pathParams.filter((p) => p.type?.kind === 'scalar' && p.type.scalar === 'string' && p.required !== false);
  for (const p of guards) {
    const local = snakeCase(p.name);
    lines.push(braced(`if ${local}.is_empty()`, `return Err(Error::InvalidArgument(${rsString(local)}.to_string()));`));
  }
  if (guards.length) lines.push('');

  lines.push(
    `let ${willMutate ? 'mut ' : ''}req = self.transport.request(reqwest::Method::${method.httpMethod.toUpperCase()}, ${pathExpr(method.path, pathParams)});`,
  );

  for (const p of queryParams) {
    const key = rsString(p.wireName ?? p.name);
    const local = `params.${snakeCase(p.name)}`;
    const call =
      p.type?.kind === 'array' && p.explode === false
        ? `req = req.query_csv(${key}, serde_json::to_value(value)?);`
        : `req = req.query(${key}, serde_json::to_value(value)?);`;
    lines.push(braced(`if let Some(value) = &${local}`, call));
  }
  for (const p of headerParams) {
    const key = rsString(p.wireName ?? p.name);
    lines.push(braced(`if let Some(value) = &params.${snakeCase(p.name)}`, `req = req.header_json(${key}, serde_json::to_value(value)?);`));
  }
  for (const f of bodyFields) {
    const key = rsString(f.name);
    const local = `params.${snakeCase(f.name)}`;
    let call: string;
    if (encoding === 'multipart') {
      call = isBinaryRef(f.type)
        ? `req = req.multipart_file(${key}, value.clone());`
        : `req = req.multipart_json(${key}, serde_json::to_value(value)?);`;
    } else if (encoding === 'form') {
      call = `req = req.form_json(${key}, serde_json::to_value(value)?);`;
    } else {
      call = `req = req.json_field(${key}, serde_json::to_value(value)?);`;
    }
    lines.push(braced(`if let Some(value) = &${local}`, call));
  }
  if (op.injectIdempotencyKey) lines.push('req = req.idempotency();');

  lines.push(...responseExpr(method, op));

  const doc = rsDoc(method.description);
  const head = doc ? `${doc}\n` : '';
  const fn = `${head}${braced(signature, lines.join('\n'))}`;
  const paramsStruct = hasParams ? emitParamsStruct(paramsName, queryParams, headerParams, bodyFields) : null;
  return { fn, paramsStruct };
}

/** One positional path argument: `&str` for a string, else the mapped Rust type. */
function pathArg(p: Param): string {
  const local = snakeCase(p.name);
  if (p.type?.kind === 'scalar' && p.type.scalar === 'string') return `${local}: &str`;
  return `${local}: ${rsType(p.type)}`;
}

/** The request path expression: a string literal, or `format!` interpolating path params. */
function pathExpr(path: string, _pathParams: Param[]): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!normalized.includes('{')) return rsString(normalized);
  const args: string[] = [];
  const fmt = normalized.replace(/\{([^}]+)\}/g, (_, n) => {
    args.push(snakeCase(n));
    return '{}';
  });
  return `format!(${rsString(fmt)}, ${args.join(', ')})`;
}

/** The trailing response expression lines (page wrap / binary / decode / empty). */
function responseExpr(method: Method, op: OperationPlan): string[] {
  if (op.binaryContentType) return ['req.send_bytes().await'];
  if (op.pageName) {
    const itemsField = method.pagination?.itemsField ?? 'data';
    const nextField = method.pagination?.nextField;
    const next = nextField ? `Some(${rsString(nextField)})` : 'None';
    return ['let value = req.send_value().await?;', `Page::from_value(value, ${rsString(itemsField)}, ${next})`];
  }
  if (method.primaryResponse) return ['req.send().await'];
  return ['req.send_empty().await'];
}

/** The method's return type: raw bytes, a Page, the decoded response, or unit. */
function returnType(method: Method, op: OperationPlan): string {
  if (op.binaryContentType) return 'Vec<u8>';
  if (op.pageName) return `Page<${rsType(method.pagination?.itemType as TypeRef | undefined)}>`;
  if (method.primaryResponse) return rsType(method.primaryResponse as TypeRef);
  return '()';
}

/** The per-method params struct name, e.g. `PetsCreateParams`. */
export function paramsStructName(cls: string, action: string): string {
  return `${cls}${pascalCase(action)}Params`;
}

/** Whether a method carries any query/header/body params (so it takes a params struct). */
export function methodHasParams(method: Method, types: Map<string, NamedType>): boolean {
  const op = planOperation(method, types);
  return op.paramGroups.query.length + op.paramGroups.header.length + bodyFieldList(method, types).length > 0;
}

/** Resolve a request body's fields by following its TypeRef into the symbol table. */
export function bodyFieldList(method: Method, types: Map<string, NamedType>): Field[] {
  const ref = method.requestBody?.type;
  if (ref?.kind === 'ref' && ref.name) {
    const named = types.get(ref.name);
    if (named?.fields) return named.fields;
  }
  return [];
}

/** The per-method params struct: query ∪ header ∪ body fields, each `Option<T>`. */
function emitParamsStruct(name: string, queryParams: Param[], headerParams: Param[], bodyFields: Field[]): string {
  const seen = new Set<string>();
  const rows: string[] = [];
  const add = (rawName: string, type: TypeRef | undefined, description?: string) => {
    const rustName = snakeCase(rawName);
    if (seen.has(rustName)) return;
    seen.add(rustName);
    const doc = rsDoc(description);
    const head = doc ? `${doc}\n` : '';
    rows.push(`${head}pub ${rustName}: Option<${rsType(type)}>,`);
  };
  for (const p of queryParams) add(p.name, p.type, p.description);
  for (const p of headerParams) add(p.name, p.type, p.description);
  for (const f of bodyFields) add(f.name, f.type, f.description);
  const body = rows.join('\n');
  return `#[derive(Debug, Clone, Default)]\n${braced(`pub struct ${name}`, body)}`;
}
