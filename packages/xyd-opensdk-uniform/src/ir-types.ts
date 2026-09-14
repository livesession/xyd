/**
 * Local copies of the OpenSDK IR / docs-render types this package consumes.
 *
 * Copied VERBATIM from `@xyd-js/opensdk-core` (`spec.ts`) and
 * `@xyd-js/opensdk-framework` (`types.ts`), which are being retired. They were imported
 * here as `import type`, which is erased at runtime — but a type-only import still needs
 * the package's `.d.ts` to exist at typecheck time, so it would have kept those packages
 * alive as a build dependency of CORE xyd.
 *
 * These describe the shape of data that crosses the native boundary as JSON, so they are
 * pinned by the same Rust serde structs the goldens already cover. `OpensdkSpecJson` and
 * `NamedType` are intentionally permissive: this module passes the IR through to the
 * native surfaces and only reads `resources`/`types`, so mirroring the full generated
 * schema here would be duplication that could silently drift.
 */

/** The OpenSDK IR document. Passed through to the native surfaces as JSON. */
export interface OpensdkSpecJson {
  resources?: unknown[];
  types?: NamedType[];
  info?: Record<string, unknown>;
  [key: string]: unknown;
}

/** A named type in the IR symbol table. */
export interface NamedType {
  name: string;
  [key: string]: unknown;
}

/** An IR method (an SDK call with its HTTP binding). */
export interface Method {
  action?: string;
  httpMethod?: string;
  path?: string;
  [key: string]: unknown;
}

/** One method flattened out of the resource tree, with its resource CHAIN. */
export interface FlatMethod {
  /** Resource names from the root to the owning resource, e.g. `["chat", "completions"]`. */
  path: string[];
  method: Method;
}

/** The context an emitter capability receives. */
export interface EmitterContext {
  /** The full OpenSDK IR document. */
  spec: OpensdkSpecJson;
  /** Symbol table: every named type in the IR, by name. */
  types: Map<string, NamedType>;
  /** Language-specific options for the active emitter (e.g. modulePath, packageName). */
  emitterOptions: Record<string, unknown>;
}

/** One language-rendered field row of an SDK type (shown in Atlas). */
export interface RenderedTypeField {
  /** Language field name (Go PascalCase, Python snake_case, ...). */
  name: string;
  /** Language type string (Go `param.Opt[string]`, TS `string | null`, ...). */
  langType: string;
  required: boolean;
  description?: string;
  deprecated?: boolean;
  /** When the field type is a named type: the ORIGINAL IR schema name, for a
   * cross-type link (`objects/<name>`). */
  refTypeName?: string;
}

/** One SDK type (request params / a response struct) as rendered field rows. */
export interface RenderedTypeGroup {
  /** Synthesized params-type NAME where the language has one (Go/Node/Java);
   * undefined for languages that flatten params (Python/Ruby/.NET). */
  typeName?: string;
  /** The method-argument name the params type is passed as (`body`/`query`/`params`)
   * — the root label, e.g. `query SessionListParams`. Undefined when the language
   * flattens params into the call (no single argument). */
  argName?: string;
  fields: RenderedTypeField[];
}

/** A per-operation TYPE reference, rendered in one language. */
export interface RenderedTypeReference {
  /** The method signature, e.g. `client.Audio.Transcriptions.New(ctx, body) (*Response, error)`. */
  signature: string;
  request: RenderedTypeGroup;
  response: {
    /** The response type's language name (the "Returns" heading). */
    typeName?: string;
    /** Struct field rows; absent for binary/scalar/open-union responses. */
    fields?: RenderedTypeField[];
    /** Fallback display for a non-struct response (e.g. `[]Pet`, `*http.Response`). */
    langType?: string;
    /** A human note for non-field responses ("binary download (audio/mpeg)"). */
    note?: string;
  };
}
