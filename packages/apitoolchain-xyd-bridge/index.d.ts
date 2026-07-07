/**
 * Hand-authored, self-contained types for the bundled xyd surface. The real
 * `@xyd-js/*` declaration graph can't be bundled into the island (no
 * `@xyd-js/*` in the island's node_modules), so these pragmatic signatures type
 * exactly what the apitoolchain services call. The services thread these values
 * into each other (parse -> IR -> generate), so loose-but-keyed types suffice.
 */

/** An OpenAPI 3.x document (raw or dereferenced). Kept loose on purpose. */
export type OpenApiDocument = Record<string, unknown>;

/** A uniform Reference (from @xyd-js/uniform); opaque here. */
export type Reference = Record<string, unknown>;

/** The OpenSDK intermediate representation produced by `openapi2opensdk`. */
export interface OpensdkSpecJson {
  info: { title: string; version: string; [k: string]: unknown };
  types?: unknown[];
  resources?: unknown[];
  [k: string]: unknown;
}

/** A registered language emitter (opaque plugin object). */
export type Emitter = { language: string; [k: string]: unknown };

/** A generated file entry (writeMode-aware form). */
export interface GeneratedFileEntry {
  content: string;
  writeMode?: string;
}

// ── spec parse / validate ──
export function deferencedOpenAPI(openApiPath: string): Promise<OpenApiDocument>;
export function oapSchemaToReferences(
  doc: OpenApiDocument,
  options?: Record<string, unknown>,
): Reference[];
export function gqlSchemaToReferences(
  sdl: string,
  options?: Record<string, unknown>,
): Reference[];
export function mcpUrlToReferences(
  source: string,
  options?: { token?: string; headers?: Record<string, string>; fetcher?: unknown },
): Promise<Reference[]>;

// ── OpenAPI -> OpenSDK IR ──
export function openapi2opensdk(
  doc: OpenApiDocument,
  options?: Record<string, unknown>,
): OpensdkSpecJson;
export function openapi2opensdkFromSource(
  source: string,
  options?: Record<string, unknown>,
): Promise<OpensdkSpecJson>;

// ── IR -> per-language file map ──
export function registerBuiltinEmitters(): void;
export function getEmitter(language: string): Emitter;
export function resolveLanguage(alias: string): string;
export function generate(
  spec: OpensdkSpecJson,
  emitter: Emitter,
  emitterOptions?: Record<string, unknown>,
): Record<string, string>;
export function generateFileMap(
  spec: OpensdkSpecJson,
  emitter: Emitter,
  emitterOptions?: Record<string, unknown>,
): Record<string, GeneratedFileEntry>;

// ── IR ⇄ IR breaking-change diff ──
/** Impact of a single change on a generated SDK's consumers. */
export type IrSeverity = "breaking" | "risky" | "safe";
export interface IrChange {
  severity: IrSeverity;
  /** Machine-friendly change class, e.g. `method-removed`, `param-type-changed`. */
  kind: string;
  /** Human-readable location, e.g. `pets.list.queryParams.limit`. */
  path: string;
  detail: string;
}
export interface IrDiff {
  changes: IrChange[];
}
/** Diff two OpenSDK IRs (base = published/old, head = new). */
export function diffIR(base: OpensdkSpecJson, head: OpensdkSpecJson): IrDiff;

// ── generated SDK -> package registry ──
/** Per-language publish option bag (from @xyd-js/opensdk-framework). */
export interface EmitterPublishOptions {
  /** Registry URL, or a folder/file feed path (npm registry / PyPI repository-url / NuGet source / Maven repo). */
  registry?: string;
  /** Auth token (undefined for an anonymous/local registry). */
  token?: string;
  /** Version for registries with no manifest version (the Go git tag). Falls back to `0.0.0`. */
  version?: string;
  /** Dist-tag for registries that support one (npm). Omit for the default (`latest`). */
  tag?: string;
  /** Package only (pack/build), never push. */
  dryRun?: boolean;
}
/**
 * Pack + publish an already-generated SDK at `dir` for `lang` via its emitter's
 * publisher (shells out to npm/twine/gem/dotnet/mvn on the host). Throws if the
 * dir is missing or the language toolchain isn't available.
 */
export function publishTarget(
  lang: string,
  dir: string,
  opts: EmitterPublishOptions,
): void;
