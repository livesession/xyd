// IR-to-IR breaking-change differ: compares two OpenSDK specs (typically the
// IR of two spec versions) and classifies every change by SDK-consumer impact.
// Pure functions, no IO — the `opensdk diff` CLI wires parsing around this.
import { walkMethods } from './spec.js';
import type { Field, Method, NamedType, OpensdkSpecJson, Param, TypeRef } from './types.js';

/** How badly a change can break a generated SDK's consumers. */
export type IrSeverity = 'breaking' | 'risky' | 'safe';

export interface IrChange {
  severity: IrSeverity;
  /** Machine-friendly change class, e.g. `method-removed`, `param-type-changed`. */
  kind: string;
  /** Human-readable location, e.g. `pets.list.queryParams.limit`, `types.Pet.fields.name`. */
  path: string;
  detail: string;
}

export interface IrDiff {
  changes: IrChange[];
}

/** Stable structural key for a TypeRef (nullable excluded — tracked separately). */
function typeKey(ref: TypeRef | undefined): string {
  if (!ref) return 'none';
  switch (ref.kind) {
    case 'scalar':
      return `scalar:${ref.scalar ?? ''}${ref.format ? `/${ref.format}` : ''}${ref.const !== undefined ? `=${JSON.stringify(ref.const)}` : ''}`;
    case 'ref':
      return `ref:${ref.name ?? ''}`;
    case 'array':
      return `array<${typeKey(ref.items)}>`;
    case 'map':
      return `map<${typeKey(ref.values)}>`;
    default:
      return ref.kind ?? 'any';
  }
}

function methodKey(resourcePath: string[], method: Method): string {
  return [...resourcePath, method.action].join('.');
}

/**
 * Diff two OpenSDK IRs. `base` is the published/old surface, `head` the new
 * one; severities describe the impact on consumers of the generated SDK.
 */
export function diffIR(base: OpensdkSpecJson, head: OpensdkSpecJson): IrDiff {
  const changes: IrChange[] = [];
  const add = (severity: IrSeverity, kind: string, path: string, detail: string) =>
    changes.push({ severity, kind, path, detail });

  // ---- methods (keyed by resource path + action) --------------------------
  const baseMethods = new Map(walkMethods(base).map((m) => [methodKey(m.path, m.method), m]));
  const headMethods = new Map(walkMethods(head).map((m) => [methodKey(m.path, m.method), m]));

  for (const [key, b] of baseMethods) {
    const h = headMethods.get(key);
    if (!h) {
      add('breaking', 'method-removed', key, 'method no longer exists');
      continue;
    }
    diffMethod(key, b.method, h.method, add);
  }
  for (const key of headMethods.keys()) {
    if (!baseMethods.has(key)) add('safe', 'method-added', key, 'new method');
  }

  // ---- named types ---------------------------------------------------------
  const baseTypes = new Map((base.types || []).map((t) => [t.name, t]));
  const headTypes = new Map((head.types || []).map((t) => [t.name, t]));

  for (const [name, b] of baseTypes) {
    const h = headTypes.get(name);
    const path = `types.${name}`;
    if (!h) {
      add('breaking', 'type-removed', path, 'named type no longer exists');
      continue;
    }
    diffType(path, b, h, add);
  }
  for (const name of headTypes.keys()) {
    if (!baseTypes.has(name)) add('safe', 'type-added', `types.${name}`, 'new named type');
  }

  // ---- security ------------------------------------------------------------
  const secKey = (s: OpensdkSpecJson['security']) =>
    JSON.stringify((s || []).map((x) => ({ kind: x.kind, name: x.name, in: x.in, scheme: x.scheme })));
  if (secKey(base.security) !== secKey(head.security)) {
    add('breaking', 'security-changed', 'security', 'default security requirements changed');
  }

  // ---- sdk behavior (runtime policy, not API surface) ----------------------
  if (JSON.stringify(base.sdk ?? null) !== JSON.stringify(head.sdk ?? null)) {
    add('safe', 'sdk-behavior-changed', 'sdk', 'declared runtime behavior changed');
  }

  return { changes };
}

type AddFn = (severity: IrSeverity, kind: string, path: string, detail: string) => void;

function diffMethod(key: string, b: Method, h: Method, add: AddFn): void {
  if (b.httpMethod !== h.httpMethod || b.path !== h.path) {
    add('breaking', 'binding-changed', key, `${b.httpMethod.toUpperCase()} ${b.path} -> ${h.httpMethod.toUpperCase()} ${h.path}`);
  }

  for (const group of ['pathParams', 'queryParams', 'headerParams'] as const) {
    diffParams(`${key}.${group}`, b[group] || [], h[group] || [], add);
  }

  const bBody = b.requestBody;
  const hBody = h.requestBody;
  if (bBody && !hBody) add('breaking', 'body-removed', `${key}.requestBody`, 'request body removed');
  else if (!bBody && hBody) {
    add(hBody.required ? 'breaking' : 'safe', 'body-added', `${key}.requestBody`, hBody.required ? 'new required request body' : 'new optional request body');
  } else if (bBody && hBody) {
    if (typeKey(bBody.type) !== typeKey(hBody.type)) {
      add('breaking', 'body-type-changed', `${key}.requestBody`, `${typeKey(bBody.type)} -> ${typeKey(hBody.type)}`);
    }
    if (!bBody.required && hBody.required) add('breaking', 'body-required-flip', `${key}.requestBody`, 'optional -> required');
    if (bBody.encoding !== hBody.encoding) add('breaking', 'body-encoding-changed', `${key}.requestBody`, `${bBody.encoding} -> ${hBody.encoding}`);
  }

  if (typeKey(b.primaryResponse) !== typeKey(h.primaryResponse)) {
    add('breaking', 'response-type-changed', `${key}.primaryResponse`, `${typeKey(b.primaryResponse)} -> ${typeKey(h.primaryResponse)}`);
  }

  if (b.pagination && !h.pagination) add('breaking', 'pagination-removed', `${key}.pagination`, 'method no longer paginates');
  else if (b.pagination && h.pagination && b.pagination.style !== h.pagination.style) {
    add('breaking', 'pagination-style-changed', `${key}.pagination`, `${b.pagination.style} -> ${h.pagination.style}`);
  }

  if (!b.deprecated && h.deprecated) add('risky', 'deprecated-added', key, 'method marked deprecated');

  const bSec = JSON.stringify(b.security ?? null);
  const hSec = JSON.stringify(h.security ?? null);
  if (bSec !== hSec) add('breaking', 'security-changed', `${key}.security`, 'per-operation security changed');
}

function diffParams(pathPrefix: string, base: Param[], head: Param[], add: AddFn): void {
  const baseByName = new Map(base.map((p) => [p.name, p]));
  const headByName = new Map(head.map((p) => [p.name, p]));

  for (const [name, b] of baseByName) {
    const h = headByName.get(name);
    const path = `${pathPrefix}.${name}`;
    if (!h) {
      add('breaking', 'param-removed', path, 'parameter no longer exists');
      continue;
    }
    if (typeKey(b.type) !== typeKey(h.type)) add('breaking', 'param-type-changed', path, `${typeKey(b.type)} -> ${typeKey(h.type)}`);
    if (!b.required && h.required) add('breaking', 'param-required-flip', path, 'optional -> required');
    if ((b.wireName ?? b.name) !== (h.wireName ?? h.name)) {
      add('risky', 'param-wire-name-changed', path, `${b.wireName ?? b.name} -> ${h.wireName ?? h.name}`);
    }
    if (!b.deprecated && h.deprecated) add('risky', 'deprecated-added', path, 'parameter marked deprecated');
  }
  for (const [name, h] of headByName) {
    if (baseByName.has(name)) continue;
    const path = `${pathPrefix}.${name}`;
    add(h.required ? 'breaking' : 'safe', 'param-added', path, h.required ? 'new REQUIRED parameter' : 'new optional parameter');
  }
}

function diffType(path: string, b: NamedType, h: NamedType, add: AddFn): void {
  if (b.kind !== h.kind) {
    add('breaking', 'type-kind-changed', path, `${b.kind} -> ${h.kind}`);
    return;
  }

  if (b.kind === 'struct') {
    diffFields(path, b.fields || [], h.fields || [], add);
    return;
  }

  if (b.kind === 'enum') {
    const bVals = new Set((b.values || []).map((v) => JSON.stringify(v.value)));
    const hVals = new Set((h.values || []).map((v) => JSON.stringify(v.value)));
    for (const v of bVals) {
      if (!hVals.has(v)) add('breaking', 'enum-value-removed', `${path}.${v}`, 'enum value removed');
    }
    for (const v of hVals) {
      // risky: consumers may switch exhaustively over a closed set
      if (!bVals.has(v)) add('risky', 'enum-value-added', `${path}.${v}`, 'enum value added');
    }
    return;
  }

  if (b.kind === 'union') {
    const bVariants = new Set((b.variants || []).map((v) => typeKey(v as TypeRef)));
    const hVariants = new Set((h.variants || []).map((v) => typeKey(v as TypeRef)));
    for (const v of bVariants) {
      if (!hVariants.has(v)) add('breaking', 'union-variant-removed', `${path}.${v}`, 'union variant removed');
    }
    for (const v of hVariants) {
      if (!bVariants.has(v)) add('safe', 'union-variant-added', `${path}.${v}`, 'union variant added');
    }
    return;
  }

  if (b.kind === 'alias') {
    const bOf = typeKey(b.of as TypeRef | undefined);
    const hOf = typeKey(h.of as TypeRef | undefined);
    if (bOf !== hOf) add('breaking', 'alias-target-changed', path, `${bOf} -> ${hOf}`);
  }
}

function diffFields(typePath: string, base: Field[], head: Field[], add: AddFn): void {
  const baseByName = new Map(base.map((f) => [f.name, f]));
  const headByName = new Map(head.map((f) => [f.name, f]));

  for (const [name, b] of baseByName) {
    const h = headByName.get(name);
    const path = `${typePath}.fields.${name}`;
    if (!h) {
      add('breaking', 'field-removed', path, 'field no longer exists');
      continue;
    }
    if (typeKey(b.type) !== typeKey(h.type)) add('breaking', 'field-type-changed', path, `${typeKey(b.type)} -> ${typeKey(h.type)}`);
    if (!!b.required !== !!h.required) {
      add('breaking', 'field-required-flip', path, b.required ? 'required -> optional' : 'optional -> required');
    }
    if (!!b.nullable !== !!h.nullable) add('risky', 'field-nullable-flip', path, b.nullable ? 'nullable -> non-null' : 'non-null -> nullable');
    if (!b.deprecated && h.deprecated) add('risky', 'deprecated-added', path, 'field marked deprecated');
  }
  for (const [name, h] of headByName) {
    if (baseByName.has(name)) continue;
    const path = `${typePath}.fields.${name}`;
    add(h.required ? 'breaking' : 'safe', 'field-added', path, h.required ? 'new REQUIRED field' : 'new optional field');
  }
}
