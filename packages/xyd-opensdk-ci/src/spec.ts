import type { Method, OpensdkSpecJson, Resource } from '@xyd-js/opensdk-core';

// Per-operation spec scoping shared by the per-method fixture generators.

export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch'] as const;

/** Collect the transitive `#/components/schemas/*` closure reachable from a value. */
export function collectRefs(node: unknown, schemas: Record<string, unknown>, out: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectRefs(item, schemas, out);
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === '$ref' && typeof value === 'string') {
      const m = value.match(/^#\/components\/schemas\/(.+)$/);
      if (m && !out.has(m[1])) {
        out.add(m[1]);
        collectRefs(schemas[m[1]], schemas, out); // transitive
      }
      continue;
    }
    collectRefs(value, schemas, out);
  }
}

/** A minimal, self-contained RAW OpenAPI doc for a single operation + its type closure. */
// biome-ignore lint/suspicious/noExplicitAny: raw OpenAPI documents are untyped here
export function miniDoc(spec: any, method: string, p: string): any {
  const op = spec.paths[p][method];
  const schemas = spec.components?.schemas || {};
  const used = new Set<string>();
  collectRefs(op, schemas, used);
  const scoped: Record<string, unknown> = {};
  for (const name of used) scoped[name] = schemas[name];
  return {
    openapi: spec.openapi || '3.1.0',
    info: { title: 'openai', version: spec.info?.version || '1.0.0' },
    servers: spec.servers,
    security: spec.security,
    components: { schemas: scoped, securitySchemes: spec.components?.securitySchemes },
    paths: { [p]: { [method]: op } },
  };
}

/** Iterate every (path, httpMethod, operation) in a raw OpenAPI doc. */
export function* eachOperation(
  // biome-ignore lint/suspicious/noExplicitAny: raw OpenAPI documents are untyped here
  spec: any,
  // biome-ignore lint/suspicious/noExplicitAny: raw OpenAPI documents are untyped here
): Generator<{ path: string; method: string; operation: any }> {
  for (const [p, item] of Object.entries(spec.paths as Record<string, Record<string, unknown>>)) {
    for (const method of HTTP_METHODS) {
      const operation = item[method];
      if (operation && typeof operation === 'object') yield { path: p, method, operation };
    }
  }
}

export interface LeafMethod {
  /** Resource path segments, root..leaf. */
  segments: string[];
  method: Method;
}

/** The first (segments, method) in an IR's resource tree (a per-method IR's single operation). */
export function firstMethod(resources: Resource[] | undefined, prefix: string[] = []): LeafMethod | null {
  for (const r of resources || []) {
    const seg = [...prefix, r.name];
    if (r.methods?.length) return { segments: seg, method: r.methods[0] };
    const nested = firstMethod(r.resources, seg);
    if (nested) return nested;
  }
  return null;
}
