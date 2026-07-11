import {
  type Field,
  type Method,
  type NamedType,
  type OpensdkSpecJson,
  type Param,
  type ResolvedSdkBehavior,
  type Resource,
  type TypeRef,
  sdkBehavior,
} from '@xyd-js/opensdk-core';
import {
  type NeutralTypeField,
  type NeutralTypeReference,
  type OperationPlan,
  type RenderedTypeField,
  type RenderedTypeReference,
  planOperation,
  planTypeReference,
  refSchemaName,
} from '@xyd-js/opensdk-framework';

import { pyPageName } from './method';
import { pascalCase, pyModuleName, screamingSnakeCase, snakeCase } from './naming';
import { PyUses, isPassthroughType, optionalize, pyType } from './pytype';
import type { OpensdkPythonOptions } from './types';

// Pure per-file renderers for the Python SDK — the second target (after Go),
// proving the IR is language-agnostic. Dependency-free (stdlib urllib
// transport in runtime.ts); mirrors the Go emitter's minimum bar: typed
// signatures, decoded model returns, page containers, structured errors and
// wire-correct query/form/multipart encoding. Driven by the emitter plugin in
// emitter.ts; `opensdkPython()` there wraps it for back-compat.

export interface ResolvedPythonOptions {
  pkg: string;
  baseURL: string;
  envVar: string;
}

export function resolvePythonOptions(spec: OpensdkSpecJson, options: OpensdkPythonOptions): ResolvedPythonOptions {
  const pkg = options.packageName ?? pyModuleName(spec.info.title);
  return {
    pkg,
    baseURL: options.baseURL ?? spec.servers?.[0] ?? '',
    envVar: spec.security?.find((s) => s.envVar)?.envVar ?? `${screamingSnakeCase(pkg)}_API_KEY`,
  };
}

/**
 * The generated `pyproject.toml`: a PEP 621 project table with a `[build-system]`
 * so `python -m build` produces an installable/publishable wheel + sdist. Publish
 * identity (description/authors/license/urls) comes from `spec.info` — the OpenAPI
 * `info` or an sdk.json `publish` override. Dependency-free (stdlib transport).
 */
export function pyproject(pkg: string, spec: OpensdkSpecJson): string {
  const info = spec.info;
  const lines = [
    '[build-system]',
    'requires = ["setuptools>=61"]',
    'build-backend = "setuptools.build_meta"',
    '',
    '[project]',
    `name = ${JSON.stringify(pkg.replace(/_/g, '-'))}`,
    `version = ${JSON.stringify(info.version || '0.0.0')}`,
  ];
  if (info.description) lines.push(`description = ${JSON.stringify(info.description)}`);
  lines.push('requires-python = ">=3.9"');
  if (info.contact?.name) lines.push(`authors = [{ name = ${JSON.stringify(info.contact.name)} }]`);
  if (info.license?.identifier) lines.push(`license = { text = ${JSON.stringify(info.license.identifier)} }`);
  const urls: string[] = [];
  if (info.homepage) urls.push(`Homepage = ${JSON.stringify(info.homepage)}`);
  if (info.repository) urls.push(`Repository = ${JSON.stringify(info.repository)}`);
  if (urls.length) lines.push('', '[project.urls]', ...urls);
  lines.push('', '[tool.setuptools.packages.find]', `include = [${JSON.stringify(pkg)}]`);
  return `${lines.join('\n')}\n`;
}

// ---- models.py -----------------------------------------------------------

interface ModelsCtx {
  uses: PyUses;
  needsField: boolean;
}

export function modelsPy(spec: OpensdkSpecJson): string {
  const ctx: ModelsCtx = { uses: new PyUses(), needsField: false };
  // Ordering matters: a struct's field annotations are lazy (`from __future__
  // import annotations`), so structs/enums may appear in any order. But an
  // alias/union assignment `X = list[Y]` is evaluated EAGERLY at import, so Y
  // must already be defined. Emit all structs/enums first, then the alias group
  // topologically sorted so an alias that references another alias comes after it.
  const types = spec.types || [];
  const aliasKinds = new Set(['alias', 'union']);
  const structsEnums = types.filter((t) => !aliasKinds.has(t.kind));
  const aliases = orderAliases(types.filter((t) => aliasKinds.has(t.kind)));
  const decls = [...structsEnums, ...aliases].map((t) => namedType(t, ctx)).filter(Boolean);
  const lines = [
    'from __future__ import annotations',
    '',
    `from dataclasses import dataclass${ctx.needsField ? ', field' : ''}`,
    'from enum import Enum',
  ];
  const typingLine = ctx.uses.typingImport();
  if (typingLine) lines.push(typingLine);
  return `${lines.join('\n')}\n\n\n${decls.join('\n\n\n')}\n`;
}

/** All named-type references inside a TypeRef tree (for alias dependency ordering). */
function typeRefNames(ref: TypeRef | undefined, out: Set<string>): void {
  if (!ref) return;
  if (ref.kind === 'ref' && ref.name) out.add(ref.name);
  typeRefNames(ref.items as TypeRef | undefined, out);
  typeRefNames(ref.values as TypeRef | undefined, out);
}

/**
 * Topologically order the alias/union group so an alias whose RHS references
 * another alias is emitted after it (the RHS is eagerly evaluated at import).
 * References to structs/enums are ignored (already emitted above); cycles fall
 * back to input order (unreachable for list/dict/Any alias forms).
 */
function orderAliases(aliases: NamedType[]): NamedType[] {
  const byName = new Map(aliases.map((a) => [a.name, a]));
  const ordered: NamedType[] = [];
  const done = new Set<string>();
  const visiting = new Set<string>();
  const visit = (a: NamedType) => {
    if (done.has(a.name) || visiting.has(a.name)) return;
    visiting.add(a.name);
    const refs = new Set<string>();
    if (a.kind === 'alias') typeRefNames(a.of as TypeRef | undefined, refs);
    for (const r of refs) {
      const dep = byName.get(r);
      if (dep && dep !== a) visit(dep);
    }
    visiting.delete(a.name);
    done.add(a.name);
    ordered.push(a);
  };
  for (const a of aliases) visit(a);
  return ordered;
}

function namedType(type: NamedType, ctx: ModelsCtx): string {
  switch (type.kind) {
    case 'enum':
      return enumType(type);
    case 'alias':
      return `${pascalCase(type.name)} = ${pyType(type.of, ctx.uses)}`;
    case 'union':
      ctx.uses.use('Any');
      return `${pascalCase(type.name)} = Any`;
    default:
      return structType(type, ctx);
  }
}

function structType(type: NamedType, ctx: ModelsCtx): string {
  const name = pascalCase(type.name);
  const fields = type.fields || [];
  if (fields.length === 0) return `@dataclass\nclass ${name}:\n    pass`;
  // Required fields first (no default), then optional (Optional[...] = None).
  const required = fields.filter((f) => f.required);
  const optional = fields.filter((f) => !f.required);
  const lines = [...required, ...optional].map((f) => structFieldLine(f, ctx));
  return `@dataclass\nclass ${name}:\n${lines.join('\n')}`;
}

/**
 * One dataclass field. When the Python name differs from the wire name the
 * raw name is kept in `field(metadata={"wire": ...})` so the runtime's
 * encode/decode stay wire-correct.
 */
function structFieldLine(f: Field, ctx: ModelsCtx): string {
  const py = snakeCase(f.name);
  const type = pyType(f.type, ctx.uses);
  const wire = py === f.name ? null : `metadata={"wire": ${JSON.stringify(f.name)}}`;
  if (f.required) {
    if (!wire) return `    ${py}: ${type}`;
    ctx.needsField = true;
    return `    ${py}: ${type} = field(${wire})`;
  }
  const opt = optionalize(type, ctx.uses);
  if (!wire) return `    ${py}: ${opt} = None`;
  ctx.needsField = true;
  return `    ${py}: ${opt} = field(default=None, ${wire})`;
}

function enumType(type: NamedType): string {
  const name = pascalCase(type.name);
  const base = type.base === 'integer' ? 'int' : 'str';
  const values = type.values || [];
  if (values.length === 0) return `class ${name}(${base}, Enum):\n    pass`;
  const members = values.map((v) => {
    const member = screamingSnakeCase(String(v.name ?? v.value)) || 'VALUE';
    const lit = base === 'int' ? String(v.value) : JSON.stringify(String(v.value));
    return `    ${member} = ${lit}`;
  });
  return `class ${name}(${base}, Enum):\n${members.join('\n')}`;
}

// ---- resources.py --------------------------------------------------------

interface ResourcesCtx {
  types: Map<string, NamedType>;
  /** The resolved runtime-behavior policies (sdk block over canonical defaults). */
  behavior: ResolvedSdkBehavior;
  uses: PyUses;
  /** Extra names imported from ._transport (decode, join_csv). */
  transportImports: Set<string>;
  /** Page containers imported from ._pagination. */
  pages: Set<'CursorPage' | 'Page'>;
}

export function resourcesPy(spec: OpensdkSpecJson, types: Map<string, NamedType>): string {
  const ctx: ResourcesCtx = {
    types,
    behavior: sdkBehavior(spec),
    uses: new PyUses(),
    transportImports: new Set(),
    pages: new Set(),
  };
  const classes: string[] = [];
  const emit = (resources: Resource[], parent: string[]) => {
    for (const r of resources) {
      const segments = [...parent, r.name];
      classes.push(resourceClass(r, segments, ctx));
      if (r.resources?.length) emit(r.resources, segments);
    }
  };
  emit(spec.resources || [], []);

  const lines = ['from __future__ import annotations', ''];
  const typingLine = ctx.uses.typingImport();
  if (typingLine) lines.push(typingLine, '');
  if (ctx.pages.size > 0) {
    const pageNames = (['CursorPage', 'Page'] as const).filter((n) => ctx.pages.has(n));
    lines.push(`from ._pagination import ${pageNames.join(', ')}`);
  }
  const transportNames = ['Transport', ...['decode', 'join_csv'].filter((n) => ctx.transportImports.has(n))];
  lines.push(`from ._transport import ${transportNames.join(', ')}`);
  lines.push('from .models import *  # noqa: F401,F403');
  return `${lines.join('\n')}\n\n\n${classes.join('\n\n\n')}\n`;
}

/**
 * The globally-unique resource class name, path-qualified by the FULL segment
 * chain from root (mirrors the Go emitter's `serviceTypeName`). Two different
 * `roles` resources under different parents (`projects.roles` vs
 * `projects.groups.roles`) therefore get distinct class names
 * (`ProjectsRolesResource` vs `ProjectsGroupsRolesResource`) instead of one
 * shadowing the other in the single generated `resources.py` module. Attribute
 * (field) names stay local (`self.roles`), like the Go emitter.
 */
function resourceClassName(segments: string[]): string {
  return `${segments.map((s) => pascalCase(s)).join('')}Resource`;
}

function resourceClass(resource: Resource, segments: string[], ctx: ResourcesCtx): string {
  const cls = resourceClassName(segments);
  const subs = resource.resources || [];
  const ctorLines = ['        self._transport = transport'];
  for (const sub of subs)
    ctorLines.push(`        self.${snakeCase(sub.name)} = ${resourceClassName([...segments, sub.name])}(transport)`);
  const ctor = `    def __init__(self, transport: Transport) -> None:\n${ctorLines.join('\n')}`;
  const methods = (resource.methods || []).map((m) => methodDef(m, ctx));
  return `class ${cls}:\n${[ctor, ...methods].join('\n\n')}`;
}

function methodDef(method: Method, ctx: ResourcesCtx): string {
  const plan = planOperation(method, ctx.types);
  const name = snakeCase(method.action);
  const { path: pathParams, query: queryParams, header: headerParams } = plan.paramGroups;
  const rawContentType = plan.binaryContentType;

  // Signature: positional path args, then keyword-only query/header/body params.
  const positional = pathParams.map((p) => `${snakeCase(p.name)}: ${pyType(p.type, ctx.uses)}`);
  const kwArgs: string[] = [];
  for (const p of [...queryParams, ...headerParams]) kwArgs.push(paramArg(p, ctx));
  const bodyParams = bodyFieldList(method, ctx.types);
  for (const b of bodyParams) {
    const type = pyType(b.type, ctx.uses);
    kwArgs.push(
      b.required ? `${snakeCase(b.name)}: ${type}` : `${snakeCase(b.name)}: ${optionalize(type, ctx.uses)} = None`,
    );
  }
  const params = ['self', ...positional, ...(kwArgs.length ? ['*', ...kwArgs] : [])].join(', ');

  const httpMethod = method.httpMethod.toUpperCase();
  const callArgs = [JSON.stringify(httpMethod), pathExpr(method.path, pathParams.length > 0)];
  if (queryParams.length) {
    callArgs.push(`query={${queryParams.map((q) => queryEntry(q, ctx)).join(', ')}}`);
  }
  if (bodyParams.length) {
    const entries = bodyParams.map((b) => `${JSON.stringify(b.name)}: ${snakeCase(b.name)}`).join(', ');
    callArgs.push(`body={${entries}}`);
  }
  // Header params go on the wire under their raw names; binary downloads also
  // send an Accept header for the primary content type (user params win).
  const headerEntries = headerParams.map((h) => `${JSON.stringify(h.wireName ?? h.name)}: ${snakeCase(h.name)}`);
  if (rawContentType) headerEntries.unshift(`"Accept": ${JSON.stringify(rawContentType)}`);
  if (headerEntries.length) callArgs.push(`headers={${headerEntries.join(', ')}}`);
  // Body encoding: the IR encoding (json|multipart|form) normally decides, but a
  // body that carries a binary field (bytes / file-like) must NOT be json.dumps'd
  // even when the spec labels it application/json — some specs (e.g. OpenAI's
  // `skills` upload) declare a json content type over a `format: binary` field.
  // Route those through the multipart encoder, mirroring the Go apiform encoder.
  let encoding = plan.encoding ?? 'json';
  if (bodyParams.length && encoding === 'json' && bodyParams.some((b) => isBinaryTypeRef(b.type, ctx.types))) {
    encoding = 'multipart';
  }
  if (bodyParams.length && encoding !== 'json') callArgs.push(`encoding=${JSON.stringify(encoding)}`);
  if (rawContentType) callArgs.push('raw=True');
  // sdk.idempotency: flagged methods get a transport-generated key (one per
  // logical call, stable across retries) under the policy header name.
  if (plan.injectIdempotencyKey && ctx.behavior.idempotency.autoGenerateForPost) {
    callArgs.push('idempotency=True');
  }

  const call = `self._transport.request(${callArgs.join(', ')})`;
  const { annotation, body } = returnPlan(plan, call, ctx);
  const guards = pathParamGuards(pathParams);
  const fullBody = guards ? `${guards}\n${body}` : body;
  return `    def ${name}(${params}) -> ${annotation}:\n${fullBody}`;
}

/**
 * Guard statements raised at the top of a method for each required string path
 * param: reject the empty string BEFORE building the path (an empty segment
 * would otherwise silently collapse `/pets/{id}` to the collection endpoint).
 * Matches openai-python and the Go emitter's guard; the generated test suite's
 * test_path_params_* variant asserts it fires.
 */
function pathParamGuards(pathParams: Param[]): string {
  const lines: string[] = [];
  for (const p of pathParams) {
    if (p.type?.kind !== 'scalar' || p.type.scalar !== 'string' || p.required === false) continue;
    const n = snakeCase(p.name);
    lines.push(`        if not ${n}:`);
    lines.push(`            raise ValueError(f"Expected a non-empty value for \`${n}\` but received {${n}!r}")`);
  }
  return lines.join('\n');
}

function paramArg(p: Param, ctx: ResourcesCtx): string {
  const type = pyType(p.type, ctx.uses);
  if (p.required) return `${snakeCase(p.name)}: ${type}`;
  return `${snakeCase(p.name)}: ${optionalize(type, ctx.uses)} = None`;
}

/**
 * One `wire-name: value` query entry. Exploded arrays are sent as repeated
 * keys by the transport (urlencode doseq); explode=false arrays comma-join.
 */
function queryEntry(q: Param, ctx: ResourcesCtx): string {
  const wire = JSON.stringify(q.wireName ?? q.name);
  const value = snakeCase(q.name);
  if (q.type?.kind === 'array' && q.explode === false) {
    ctx.transportImports.add('join_csv');
    return `${wire}: join_csv(${value})`;
  }
  return `${wire}: ${value}`;
}

/** The return annotation plus the method body (indented statement lines). */
function returnPlan(plan: OperationPlan, call: string, ctx: ResourcesCtx): { annotation: string; body: string } {
  const { method } = plan;
  if (plan.binaryContentType) return { annotation: 'bytes', body: `        return ${call}` };
  const page = pyPageName(plan);
  if (page) {
    ctx.pages.add(page);
    const item = pyType(method.pagination?.itemType as TypeRef | undefined, ctx.uses);
    return { annotation: `${page}[${item}]`, body: `        return ${page}.from_response(${item}, ${call})` };
  }
  const primary = method.primaryResponse as TypeRef | undefined;
  if (!primary) return { annotation: 'None', body: `        ${call}` };
  const type = pyType(primary, ctx.uses);
  if (isPassthroughType(type)) return { annotation: type, body: `        return ${call}` };
  ctx.transportImports.add('decode');
  return { annotation: type, body: `        return decode(${type}, ${call})` };
}

interface BodyField {
  name: string;
  type: TypeRef;
  required: boolean;
}

/**
 * Whether a TypeRef ultimately carries binary bytes (`format: binary`),
 * following array items and named union/alias refs. Struct/enum refs are never
 * binary. A `seen` set guards recursive/self-referential unions.
 */
function isBinaryTypeRef(ref: TypeRef | undefined, types: Map<string, NamedType>, seen = new Set<string>()): boolean {
  if (!ref) return false;
  if (ref.kind === 'scalar') return ref.scalar === 'string' && ref.format === 'binary';
  if (ref.kind === 'array') return isBinaryTypeRef(ref.items as TypeRef | undefined, types, seen);
  if (ref.kind === 'ref' && ref.name) {
    if (seen.has(ref.name)) return false;
    seen.add(ref.name);
    const named = types.get(ref.name);
    if (!named) return false;
    if (named.kind === 'union') {
      return (named.variants || []).some((v) => isBinaryTypeRef(v as TypeRef, types, seen));
    }
    if (named.kind === 'alias') return isBinaryTypeRef(named.of as TypeRef | undefined, types, seen);
  }
  return false;
}

function bodyFieldList(method: Method, types: Map<string, NamedType>): BodyField[] {
  const ref = method.requestBody?.type;
  if (ref?.kind !== 'ref' || !ref.name) return [];
  const named = types.get(ref.name);
  return (named?.fields || []).map((f) => ({ name: f.name, type: f.type, required: f.required === true }));
}

function pathExpr(path: string, hasParams: boolean): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!hasParams) return JSON.stringify(p);
  // Replace {wire} with {snake} and emit an f-string.
  const fstr = p.replace(/\{([^}]+)\}/g, (_, name) => `{${snakeCase(name)}}`);
  return `f${JSON.stringify(fstr)}`;
}

// ---- _client.py ----------------------------------------------------------

export function clientPy(spec: OpensdkSpecJson, envVar: string): string {
  const resources = spec.resources || [];
  const attrLines = resources.map(
    (r) => `        self.${snakeCase(r.name)} = ${resourceClassName([r.name])}(self._transport)`,
  );
  const imports = resources.map((r) => resourceClassName([r.name])).join(', ');
  return `from __future__ import annotations

import os
from typing import Optional

from ._transport import Transport
from .resources import ${imports}


class Client:
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> None:
        key = api_key if api_key is not None else os.environ.get(${JSON.stringify(envVar)})
        self._transport = Transport(base_url=base_url, api_key=key, timeout=timeout)
${attrLines.join('\n')}
`;
}

// ---- type reference (Atlas SDK-types view) -------------------------------

/** A throwaway ResourcesCtx for the type-reference renderers: only `uses`,
 * `pages` and `transportImports` are read by returnPlan, and the display
 * string discards those collected import sets (behavior is unused here). */
function typeRefCtx(types: Map<string, NamedType>): ResourcesCtx {
  return {
    types,
    behavior: sdkBehavior({} as OpensdkSpecJson),
    uses: new PyUses(),
    transportImports: new Set(),
    pages: new Set(),
  };
}

/** The params-KWARG Python type — mirrors methodDef's param/body field types:
 * `pyType(...)` when required, `Optional[...]` otherwise (Python flattens the
 * params struct to keyword args, so location — body/query/header — is irrelevant
 * to the rendered type). Display string: the Imports/uses tracking is discarded. */
function pyFieldTypeDisplay(f: NeutralTypeField): string {
  const uses = new PyUses();
  const base = pyType(f.typeRef, uses);
  return f.required ? base : optionalize(base, uses);
}

function pyRenderField(f: NeutralTypeField): RenderedTypeField {
  return {
    name: snakeCase(f.logicalName),
    langType: pyFieldTypeDisplay(f),
    required: f.required,
    description: f.description,
    deprecated: f.deprecated,
    refTypeName: refSchemaName(f.typeRef),
  };
}

/** The Python "Returns" display type — mirrors returnPlan's annotation
 * (bytes / <Page>[<Item>] / decoded model / None), minus the body. */
function pyReturnDisplay(plan: OperationPlan, ctx: ResourcesCtx): string {
  return returnPlan(plan, '', ctx).annotation;
}

function pyResponse(
  plan: OperationPlan,
  neutral: NeutralTypeReference,
  ctx: ResourcesCtx,
): RenderedTypeReference['response'] {
  const langType = pyReturnDisplay(plan, ctx);
  if (plan.binaryContentType) return { langType, note: `binary download (${plan.binaryContentType})` };
  const ref = neutral.response.typeRef;
  if (!ref || plan.primaryResponse === 'none') return { langType: 'None', note: 'no response body' };
  const page = pyPageName(plan);
  const note = page ? `paginated (${page})` : undefined;
  if (neutral.response.fields) {
    return {
      typeName: langType,
      note,
      fields: neutral.response.fields.map((f) => ({
        name: snakeCase(f.logicalName),
        langType: pyType(f.typeRef, new PyUses()),
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
 * The per-operation TYPE REFERENCE for Python: the idiomatic call signature, the
 * request kwargs' field rows, and the response type — the SDK-native view Atlas
 * renders in place of the REST param definitions. Python flattens the params
 * struct to keyword args, so `request.typeName` is left undefined (mirrors the
 * Go emitter's `generateGoTypeReference`, using Python's primitives).
 */
export function generatePythonTypeReference(
  method: Method,
  chain: string[],
  types: Map<string, NamedType>,
): RenderedTypeReference {
  const plan = planOperation(method, types);
  const neutral = planTypeReference(method, types);
  const ctx = typeRefCtx(types);

  const requestFields = neutral.request.fields.map(pyRenderField);

  // The call signature: `client.<attr>.<action>(<path args>, <kwargs>) -> <return>`.
  // Positional path params by snake name, then each request field as a keyword
  // (required → `name`, optional → `name=...`), mirroring methodDef's arg order.
  const attrs = chain.map((s) => snakeCase(s));
  const action = snakeCase(method.action);
  const callChain = `client.${[...attrs, action].join('.')}`;
  const args = [...plan.paramGroups.path.map((p) => snakeCase(p.name))];
  for (const f of neutral.request.fields) {
    const n = snakeCase(f.logicalName);
    args.push(f.required ? n : `${n}=...`);
  }
  const signature = `${callChain}(${args.join(', ')}) -> ${pyReturnDisplay(plan, ctx)}`;

  return {
    signature,
    request: { typeName: undefined, fields: requestFields },
    response: pyResponse(plan, neutral, ctx),
  };
}
