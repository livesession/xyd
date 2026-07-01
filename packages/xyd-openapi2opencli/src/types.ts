export type Grouping = 'path' | 'tag' | 'operationId';
export type BodyStrategy = 'flatten' | 'json' | 'hybrid';
export type FlagCase = 'kebab' | 'camel';

/**
 * The five canonical action buckets derived from HTTP method + path shape.
 * Override any of them via {@link OpenApi2OpenCliOptions.verbMap}.
 */
export interface VerbMap {
  /** GET on a collection (path ends in a static segment). Default: "list". */
  listCollection?: string;
  /** GET on an item (path ends in `{param}`). Default: "retrieve". */
  getItem?: string;
  /** POST on a collection. Default: "create". */
  createCollection?: string;
  /** PUT/PATCH (and PUT on collection) on an item. Default: "update". */
  updateItem?: string;
  /** DELETE on an item. Default: "delete". */
  deleteItem?: string;
}

export interface OpenApi2OpenCliOptions {
  /** CLI name → `info.title`. Default: slug(doc.info.title). */
  cliName?: string;
  /** CLI version → `info.version`. Default: doc.info.version. */
  version?: string;
  /** Primary grouping signal. Only "path" is implemented in Stage A. Default: "path". */
  grouping?: Grouping;
  /** How request bodies become flags. Default: "hybrid". */
  bodyStrategy?: BodyStrategy;
  /** HTTP methods to include. Default: SUPPORTED_HTTP_METHODS from @xyd-js/openapi. */
  includeMethods?: string[];
  /** Map header (and cookie) params to options. Default: false. */
  includeHeaders?: boolean;
  /** Flag name casing. Default: "kebab". */
  flagCase?: FlagCase;
  /** Emit action aliases (e.g. "get" for "retrieve"). Default: true. */
  actionAliases?: boolean;
  /** Override the canonical action verbs. */
  verbMap?: VerbMap;
  /**
   * Trailing static path segments (after a `{param}`) treated as custom actions
   * rather than sub-resources, e.g. `/batches/{id}/cancel` → `batches cancel`.
   * Provided as wire segments (matched case-insensitively, before kebab-casing).
   * Defaults to a common set (see DEFAULT_CUSTOM_ACTION_VERBS).
   */
  customActionVerbs?: string[];
  /** Only include operations whose path starts with one of these prefixes (test scoping). */
  includePaths?: string[];
  /**
   * How deep to flatten nested body objects before falling back to a JSON-string flag.
   * Default: 1 (only top-level scalar properties flatten).
   */
  maxBodyDepth?: number;
  /**
   * Environment variable a generated CLI reads the API credential from.
   * Default: `${SCREAMING_SNAKE(cliName)}_API_KEY` (e.g. OPENAI_API_KEY).
   */
  authEnvVar?: string;
}

export const DEFAULT_CUSTOM_ACTION_VERBS = [
  'cancel',
  'submit',
  'complete',
  'expire',
  'archive',
  'unarchive',
  'restore',
  'validate',
  'verify',
  'refund',
  'capture',
  'void',
  'pause',
  'resume',
  'start',
  'stop',
  'retry',
  'finalize',
  'confirm',
  'approve',
  'reject',
  'publish',
  'unpublish',
];
