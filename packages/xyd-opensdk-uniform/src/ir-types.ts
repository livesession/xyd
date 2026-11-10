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
  /** When the field type is (or wraps, through arrays and maps) a named type:
   * the ORIGINAL IR type name — the key into {@link RenderedTypeReference.nested}. */
  refTypeName?: string;
  /** The OpenAPI component schema that IR type came from
   * (`#/components/schemas/<Name>`); absent when the type was hoisted from an
   * inline schema, whatever name it carries. */
  schemaRef?: string;
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
  /** The IR type behind the request body (the key into `nested`); absent when
   * there is no body or it is not a named type. */
  refTypeName?: string;
  /** That type's OpenAPI component schema, when it came from one. */
  schemaRef?: string;
  fields: RenderedTypeField[];
}

/** The response half of a type reference. */
export interface RenderedTypeResponse {
  /** The response type's language name (the "Returns" heading). */
  typeName?: string;
  /** The IR type behind the response (the paginated ITEM type for a list;
   * through arrays and maps) — the key into `nested`. Absent for a binary,
   * scalar or empty response. */
  refTypeName?: string;
  /** That type's OpenAPI component schema, when it came from one. */
  schemaRef?: string;
  /** Struct field rows; absent for binary/scalar/open-union responses. */
  fields?: RenderedTypeField[];
  /** Fallback display for a non-struct response (e.g. `[]Pet`, `*http.Response`). */
  langType?: string;
  /** A human note for non-field responses ("binary download (audio/mpeg)"). */
  note?: string;
}

/** A rendered type expression: the language type string plus the IR type it
 * names (through arrays and maps), when it names one — a union variant, an
 * alias target. */
export interface RenderedTypeExpr {
  langType: string;
  refTypeName?: string;
  schemaRef?: string;
}

/** One IR type reachable from an operation's request or response, rendered in
 * one language: a `nested` entry, keyed by the IR type name. The body is
 * kind-specific: `fields` for a struct, `values` for an enum, `variants` for a
 * union, `of` for an alias. */
export interface RenderedNestedType {
  /** The language's name for the type (what a field of this type shows). */
  typeName: string;
  kind: 'struct' | 'enum' | 'union' | 'alias';
  /** The OpenAPI component schema the type came from; absent for a type
   * hoisted from an inline schema (a synthesized envelope, a nested block). */
  schemaRef?: string;
  description?: string;
  /** A struct's field rows, rendered as the language's MODEL declares them. */
  fields?: RenderedTypeField[];
  /** An enum's values, as the IR carries them. */
  values?: unknown[];
  /** A union's variants. */
  variants?: RenderedTypeExpr[];
  /** An alias's target. */
  of?: RenderedTypeExpr;
}

/** A per-operation TYPE reference, rendered in one language.
 *
 * `request` and `response` are ONE level deep; `nested` is the lookup table
 * behind them — every IR type reachable from either (the request body and the
 * response type included), keyed by the IR type name a row's `refTypeName`
 * carries. Absent (or empty) when nothing is referenced, and on an `x-sdk`
 * written before it existed. */
export interface RenderedTypeReference {
  /** The method signature, e.g. `client.Audio.Transcriptions.New(ctx, body) (*Response, error)`. */
  signature: string;
  request: RenderedTypeGroup;
  response: RenderedTypeResponse;
  nested?: Record<string, RenderedNestedType>;
}
