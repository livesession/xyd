// @xyd-js/openapi2opensdk public API (S6+ W2 rider shim): the CONVERSION
// dispatches to the Rust core (crates/xyd_openapi2opensdk via @xyd-js/native)
// when present. The raw (un-dereferenced) doc is acyclic, so the transport is
// plain JSON both ways — no handles. The conformance-surface utilities
// (surface.ts) and SymbolTable stay JS tooling. Everything else re-exports
// the FROZEN impl in ./impl-js (bugfix-only until reap).
import type { OpenAPIV3 } from 'openapi-types';
import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { native } from './native';
import { openapi2opensdk as jsOpenapi2opensdk } from './impl-js/openapi2opensdk';
import type { OpenApi2OpenSdkOptions } from './impl-js/types';

export type { OpenApi2OpenSdkOptions, OperationHint, VerbMap } from './impl-js/types';
export { DEFAULT_CUSTOM_ACTION_VERBS } from './impl-js/types';

export { SymbolTable } from './impl-js/nominal';
export type { SchemaOrRef } from './impl-js/nominal';

// The language-agnostic conformance surface (diffed against real SDKs).
export { opensdkToSurface, diffSurfaces, neutralType, segment } from './impl-js/surface';
export type {
  SdkSurface,
  SurfaceMethod,
  SurfaceParam,
  ParamKind,
  SurfaceDiff,
  MethodDiff,
  SdkAllowlist,
} from './impl-js/surface';

/**
 * Convert a RAW (un-dereferenced) OpenAPI 3.x document into an OpenSDK IR.
 * Rust-backed when the native core is present; the frozen JS impl otherwise.
 */
export function openapi2opensdk(
  doc: OpenAPIV3.Document,
  options: OpenApi2OpenSdkOptions = {},
): OpensdkSpecJson {
  if (native?.openapi2opensdk) {
    return JSON.parse(
      native.openapi2opensdk(JSON.stringify(doc), JSON.stringify(options)),
    ) as OpensdkSpecJson;
  }
  return jsOpenapi2opensdk(doc, options);
}

/**
 * Read a RAW OpenAPI spec from a file path or URL (YAML or JSON — NOT
 * dereferenced, so `$ref`s survive into named types) then convert it.
 * IO + YAML parsing stay JS; the conversion dispatches above.
 */
export async function openapi2opensdkFromSource(
  source: string,
  options: OpenApi2OpenSdkOptions = {},
): Promise<OpensdkSpecJson> {
  let content: string;
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch OpenAPI spec from ${source}: ${res.statusText}`);
    content = await res.text();
  } else {
    const fs = await import('node:fs/promises');
    content = await fs.readFile(source, 'utf-8');
  }

  let doc: OpenAPIV3.Document;
  if (source.endsWith('.json') || content.trimStart().startsWith('{')) {
    doc = JSON.parse(content) as OpenAPIV3.Document;
  } else {
    const yaml = await import('js-yaml');
    doc = yaml.load(content) as OpenAPIV3.Document;
  }
  return openapi2opensdk(doc, options);
}
