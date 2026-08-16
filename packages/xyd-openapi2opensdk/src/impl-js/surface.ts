import type { Method, OpensdkSpecJson, Param, Resource, TypeRef } from '@xyd-js/opensdk-core';

import { kebabCase } from './naming';

// A canonical, language-agnostic "SDK surface" both our OpenSDK IR and the real
// openai-go source reduce to, so they can be diffed method-by-method. It is the
// SDK analog of the CLI oracle's CliSurface (methods+params instead of
// commands+flags), so it lives in the converter and is reusable by every
// language target (go, python).

export type ParamKind = 'path' | 'query' | 'body' | 'header' | 'unknown';

export interface SurfaceParam {
  name: string; // identifier-safe name (what an SDK surface shows; the raw wire name may differ via Param.wireName)
  kind: ParamKind;
  required: boolean;
  typeName: string; // coarse neutral type label (string|integer|number|boolean|array|map|object|any)
}

export interface SurfaceMethod {
  path: string[]; // resource path + action verb, e.g. ["chat","completions","create"]
  params: SurfaceParam[];
  responseType: string; // coarse neutral label (object|array|page|string|...) or ''
}

export interface SdkSurface {
  methods: SurfaceMethod[];
}

/** Normalize a resource/action name to a comparable segment slug (kebab of words). */
export function segment(name: string): string {
  return kebabCase(name) || name;
}

/** Coarse, cross-SDK-comparable label for a type reference. */
export function neutralType(ref: TypeRef | undefined): string {
  if (!ref) return 'any';
  switch (ref.kind) {
    case 'scalar':
      return ref.scalar || 'any';
    case 'array':
      return 'array';
    case 'map':
      return 'map';
    case 'ref':
      return 'object';
    default:
      return 'any';
  }
}

function sortParams(params: SurfaceParam[]): SurfaceParam[] {
  return [...params].sort((a, b) => a.name.localeCompare(b.name));
}

const paramOf = (p: Param, kind: ParamKind): SurfaceParam => ({
  name: p.name,
  kind,
  required: p.required === true,
  typeName: neutralType(p.type),
});

/** Reduce a method's typed request binding to canonical surface params. */
function methodParams(method: Method, types: Map<string, NamedTypeLike>): SurfaceParam[] {
  const params: SurfaceParam[] = [];
  for (const p of method.pathParams || []) params.push(paramOf(p, 'path'));
  for (const p of method.queryParams || []) params.push(paramOf(p, 'query'));
  for (const p of method.headerParams || []) params.push(paramOf(p, 'header'));

  const bodyRef = method.requestBody?.type;
  if (bodyRef?.kind === 'ref' && bodyRef.name) {
    const named = types.get(bodyRef.name);
    for (const f of named?.fields || []) {
      params.push({ name: f.name, kind: 'body', required: f.required === true, typeName: neutralType(f.type) });
    }
  }
  return sortParams(params);
}

interface NamedTypeLike {
  fields?: Array<{ name: string; type?: TypeRef; required?: boolean }>;
}

function responseLabel(method: Method): string {
  if (method.pagination) return 'page';
  return method.primaryResponse ? neutralType(method.primaryResponse) : '';
}

/** Reduce an OpenSDK IR document to the canonical surface. */
export function opensdkToSurface(spec: OpensdkSpecJson): SdkSurface {
  const types = new Map<string, NamedTypeLike>();
  for (const t of spec.types || []) types.set(t.name, t as NamedTypeLike);

  const methods: SurfaceMethod[] = [];
  const walk = (resources: Resource[], prefix: string[]) => {
    for (const r of resources) {
      const path = [...prefix, segment(r.name)];
      for (const m of r.methods || []) {
        methods.push({ path: [...path, segment(m.action)], params: methodParams(m, types), responseType: responseLabel(m) });
      }
      if (r.resources?.length) walk(r.resources, path);
    }
  };
  walk(spec.resources || [], []);
  methods.sort((a, b) => a.path.join(' ').localeCompare(b.path.join(' ')));
  return { methods };
}

// ---- Diff ----------------------------------------------------------------

const key = (path: string[]) => path.join(' ');

export interface MethodDiff {
  path: string[];
  paramsOnlyOurs: string[]; // "name:kind"
  paramsOnlyOracle: string[];
  kindMismatch: string[]; // params on both whose kind differs
  responseMismatch?: { ours: string; oracle: string };
}

export interface SurfaceDiff {
  oracleMethodCount: number;
  oursMethodCount: number;
  methodsMatched: string[];
  methodsOnlyOracle: string[];
  methodsOnlyOurs: string[];
  perMethod: MethodDiff[]; // matched methods with param/response differences
  l0Coverage: number; // |matched| / oracleCount  (method-path coverage)
  l1Coverage: number; // matched methods whose params fully agree / oracleCount
}

export interface SdkAllowlist {
  /** Method paths (space-joined) to skip entirely (e.g. Stainless admin/beta namespacing). */
  skipMethods?: string[];
  /** Param names expected only on the oracle side, for any method (e.g. pagination cursors). */
  oracleOnlyParams?: string[];
  /** Param names expected only on our side, for any method. */
  oursOnlyParams?: string[];
  /** If true, response-type mismatches are reported but never fail L1. */
  ignoreResponseType?: boolean;
}

/** Diff two SDK surfaces method-by-method, applying an allowlist of known divergences. */
export function diffSurfaces(ours: SdkSurface, oracle: SdkSurface, allow: SdkAllowlist = {}): SurfaceDiff {
  const skip = new Set(allow.skipMethods || []);
  const oracleOnlyOk = new Set(allow.oracleOnlyParams || []);
  const oursOnlyOk = new Set(allow.oursOnlyParams || []);

  const oursByKey = new Map(ours.methods.map((m) => [key(m.path), m]));
  const oracleByKey = new Map(oracle.methods.map((m) => [key(m.path), m]));

  const oracleKeys = [...oracleByKey.keys()].filter((k) => !skip.has(k));
  const matched: string[] = [];
  const onlyOracle: string[] = [];
  const onlyOurs: string[] = [];
  const perMethod: MethodDiff[] = [];
  let l1Clean = 0;

  for (const k of oracleKeys) {
    if (oursByKey.has(k)) matched.push(k);
    else onlyOracle.push(k);
  }
  for (const k of oursByKey.keys()) {
    if (!skip.has(k) && !oracleByKey.has(k)) onlyOurs.push(k);
  }

  for (const k of matched) {
    const o = oursByKey.get(k)!;
    const r = oracleByKey.get(k)!;
    const oNames = new Map(o.params.map((p) => [p.name, p]));
    const rNames = new Map(r.params.map((p) => [p.name, p]));

    const paramsOnlyOurs = [...oNames.keys()]
      .filter((n) => !rNames.has(n) && !oursOnlyOk.has(n))
      .map((n) => `${n}:${oNames.get(n)!.kind}`);
    const paramsOnlyOracle = [...rNames.keys()]
      .filter((n) => !oNames.has(n) && !oracleOnlyOk.has(n))
      .map((n) => `${n}:${rNames.get(n)!.kind}`);
    const kindMismatch = [...oNames.keys()]
      .filter((n) => rNames.has(n) && oNames.get(n)!.kind !== rNames.get(n)!.kind)
      .map((n) => `${n}:${oNames.get(n)!.kind}!=${rNames.get(n)!.kind}`);

    const responseMismatch =
      !allow.ignoreResponseType && o.responseType && r.responseType && o.responseType !== r.responseType
        ? { ours: o.responseType, oracle: r.responseType }
        : undefined;

    if (paramsOnlyOurs.length || paramsOnlyOracle.length || kindMismatch.length || responseMismatch) {
      perMethod.push({ path: o.path, paramsOnlyOurs, paramsOnlyOracle, kindMismatch, responseMismatch });
    } else {
      l1Clean++;
    }
  }

  const oracleCount = oracleKeys.length || 1;
  return {
    oracleMethodCount: oracleKeys.length,
    oursMethodCount: ours.methods.length,
    methodsMatched: matched.sort(),
    methodsOnlyOracle: onlyOracle.sort(),
    methodsOnlyOurs: onlyOurs.sort(),
    perMethod: perMethod.sort((a, b) => key(a.path).localeCompare(key(b.path))),
    l0Coverage: matched.length / oracleCount,
    l1Coverage: l1Clean / oracleCount,
  };
}
