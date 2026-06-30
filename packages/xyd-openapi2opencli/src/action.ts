import type { OpenAPIV3 } from 'openapi-types';

import { kebabCase, splitWords } from './naming';
import type { OpenApi2OpenCliOptions, VerbMap } from './types';
import { DEFAULT_CUSTOM_ACTION_VERBS } from './types';

export interface PathSegment {
  kind: 'static' | 'param';
  value: string;
}

/** Parse `/chat/completions/{completion_id}` into ordered segments. */
export function parsePath(path: string): PathSegment[] {
  return path
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      const m = seg.match(/^\{(.+)\}$/);
      return m ? { kind: 'param' as const, value: m[1] } : { kind: 'static' as const, value: seg };
    });
}

export interface DerivedTarget {
  /** kebab-cased resource command path, e.g. ["chat","completions"] */
  resourcePath: string[];
  /** kebab-cased leaf action, e.g. "create" / "retrieve" / "cancel" */
  action: string;
  /** optional aliases for the leaf command, e.g. ["get"] for retrieve */
  aliases: string[];
  /** wire names of path parameters in order (positional arguments) */
  pathParamNames: string[];
}

const DEFAULT_VERBS: Required<VerbMap> = {
  listCollection: 'list',
  getItem: 'retrieve',
  createCollection: 'create',
  updateItem: 'update',
  deleteItem: 'delete',
};

function leadingVerb(operationId?: string): string | undefined {
  if (!operationId) return undefined;
  return splitWords(operationId)[0];
}

/**
 * Derive the command-tree placement of an operation from its method + path
 * (the default "path" grouping). See the mapping table in the package README.
 */
export function deriveTarget(
  method: string,
  path: string,
  operation: OpenAPIV3.OperationObject,
  options: OpenApi2OpenCliOptions,
): DerivedTarget {
  const verbs: Required<VerbMap> = { ...DEFAULT_VERBS, ...(options.verbMap || {}) };
  const customVerbs = new Set(
    (options.customActionVerbs ?? DEFAULT_CUSTOM_ACTION_VERBS).map((v) => v.toLowerCase()),
  );
  const actionAliases = options.actionAliases !== false;

  const segments = parsePath(path);
  const staticSegs = segments.filter((s) => s.kind === 'static').map((s) => s.value);
  const pathParamNames = segments.filter((s) => s.kind === 'param').map((s) => s.value);
  const hasParams = pathParamNames.length > 0;
  const last = segments[segments.length - 1];
  const m = method.toLowerCase();

  let resourceSegs: string[];
  let action: string;
  const aliases: string[] = [];

  if (last && last.kind === 'param') {
    // Item operation: /resource/{id}
    resourceSegs = staticSegs;
    if (m === 'get') {
      action = verbs.getItem;
      if (actionAliases && action === 'retrieve') aliases.push('get');
    } else if (m === 'put' || m === 'patch') {
      action = verbs.updateItem;
    } else if (m === 'delete') {
      action = verbs.deleteItem;
    } else {
      // POST on an item — uncommon; prefer the operationId verb.
      action = leadingVerb(operation.operationId) || verbs.createCollection;
    }
  } else {
    // Last segment is static.
    const lastStatic = staticSegs[staticSegs.length - 1];
    const isCustomAction = hasParams && lastStatic && customVerbs.has(lastStatic.toLowerCase());

    if (isCustomAction) {
      action = kebabCase(lastStatic);
      resourceSegs = staticSegs.slice(0, -1);
    } else {
      resourceSegs = staticSegs;
      if (m === 'get') {
        action = verbs.listCollection;
      } else if (m === 'post') {
        action = verbs.createCollection;
      } else if (m === 'put' || m === 'patch') {
        action = verbs.updateItem;
      } else if (m === 'delete') {
        action = verbs.deleteItem;
      } else {
        action = leadingVerb(operation.operationId) || m;
      }
    }
  }

  return {
    resourcePath: resourceSegs.map(kebabCase),
    action: kebabCase(action),
    aliases,
    pathParamNames,
  };
}
