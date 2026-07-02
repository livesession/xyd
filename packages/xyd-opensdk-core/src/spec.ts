import type { Method, NamedType, OpensdkSpecJson, Resource } from './types.js';

export interface LoadOpensdkSpecOptions {
  /**
   * Base directory used to resolve a relative file `source`.
   * Defaults to `process.cwd()`.
   */
  cwd?: string;
}

/**
 * Load an OpenSDK spec from a file path or an HTTP(S) URL.
 * Returns `null` (and logs) on any failure.
 */
export async function loadOpensdkSpec(
  source: string,
  opts?: LoadOpensdkSpecOptions,
): Promise<OpensdkSpecJson | null> {
  try {
    let content: string;

    if (source.startsWith('http://') || source.startsWith('https://')) {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch OpenSDK spec: ${response.statusText}`);
      }
      content = await response.text();
    } else {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const base = opts?.cwd ?? process.cwd();
      const resolvedPath = path.isAbsolute(source) ? source : path.resolve(base, source);
      content = await fs.readFile(resolvedPath, 'utf-8');
    }

    return JSON.parse(content) as OpensdkSpecJson;
  } catch (error) {
    console.error(`Error loading OpenSDK spec from ${source}:`, error);
    return null;
  }
}

/** Look up a named type in the symbol table. */
export function findType(spec: OpensdkSpecJson, name: string): NamedType | undefined {
  return (spec.types || []).find((t) => t.name === name);
}

/** A method paired with the resource path (from the client root) that reaches it. */
export interface FlatMethod {
  /** Resource names from the root to the owning resource, e.g. `["chat", "completions"]`. */
  path: string[];
  resource: Resource;
  method: Method;
}

/**
 * Depth-first flatten of the resource tree into `(resourcePath, resource, method)`
 * triples — the shape emitters and the oracle surface both walk.
 */
export function walkMethods(spec: OpensdkSpecJson): FlatMethod[] {
  const out: FlatMethod[] = [];
  const visit = (resources: Resource[] | undefined, parentPath: string[]) => {
    for (const resource of resources || []) {
      const resourcePath = [...parentPath, resource.name];
      for (const method of resource.methods || []) {
        out.push({ path: resourcePath, resource, method });
      }
      if (resource.resources?.length) visit(resource.resources, resourcePath);
    }
  };
  visit(spec.resources, []);
  return out;
}
