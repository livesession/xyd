import type { DeepPartial, SdkBehavior } from '@xyd-js/opensdk-core';

/** Overrides for the action verb an operation maps to (per HTTP shape). */
export interface VerbMap {
  listCollection?: string;
  getItem?: string;
  createCollection?: string;
  updateItem?: string;
  deleteItem?: string;
}

/** Default trailing static path segments treated as a custom action verb. */
export const DEFAULT_CUSTOM_ACTION_VERBS = [
  'cancel',
  'submit',
  'complete',
  'archive',
  'unarchive',
  'restore',
  'verify',
  'confirm',
  'start',
  'stop',
  'pause',
  'resume',
];

/**
 * Per-operation overrides, keyed by `"METHOD /path"` (uppercase method), e.g.
 * `"POST /assistants": { mountOn: "beta/assistants" }` (oagen's OperationHint).
 * This is the seam for SDK-config-driven grouping that isn't in the spec paths
 * (openai-go's beta/admin namespacing).
 */
export interface OperationHint {
  /** Re-mount the operation under this resource path (slash/space-separated segments). */
  mountOn?: string;
  /** Override the derived action verb. */
  action?: string;
}

export interface OpenApi2OpenSdkOptions {
  /** SDK / package name (defaults to the slugified spec title). */
  sdkName?: string;
  /** SDK version (defaults to the spec's info.version). */
  version?: string;
  /** HTTP methods to include (defaults to get/put/patch/post/delete). */
  includeMethods?: string[];
  /** Restrict to operations whose path starts with one of these (test scoping). */
  includePaths?: string[];
  /** Override the action verb mapping. */
  verbMap?: VerbMap;
  /** Trailing static segments treated as a custom action verb. */
  customActionVerbs?: string[];
  /** Emit `get` as an alias of `retrieve` (default true). */
  actionAliases?: boolean;
  /** Env var a generated SDK reads the credential from (default `<SDK>_API_KEY`). */
  authEnvVar?: string;
  /** Per-operation mount/action overrides keyed by `"METHOD /path"`. */
  operationHints?: Record<string, OperationHint>;
  /**
   * Resource-level mount rules: longest-prefix match on the derived resource
   * path (kebab segments joined by `/`) -> replacement prefix. e.g.
   * `{ "organization": "admin/organization", "assistants": "beta/assistants" }`.
   * Per-operation `mountOn` takes priority.
   */
  mountRules?: Record<string, string>;
  /**
   * Per-API overrides deep-merged over opensdk-core's canonical
   * `defaultSdkBehavior()` (arrays replace entirely). The merged result is
   * ALWAYS stamped on the produced IR as `spec.sdk` (oagen-style: emitters
   * never null-check runtime policy).
   */
  sdkBehavior?: DeepPartial<SdkBehavior>;
}
