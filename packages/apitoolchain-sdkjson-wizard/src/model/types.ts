/**
 * Browser-safe mirror of the opensdk `sdk.json` config shape + the preview
 * request/result contract. This file is imported by BOTH the UI (browser) and
 * the preview backend (Node), so it MUST NOT import any `@xyd-js/*` package.
 *
 * Source of truth (do not import — mirror): `@xyd-js/opensdk-core`
 * `src/config.ts` (`SdkJson`/`LanguageSection`/`PublishTarget`/`SdkGrouping`) +
 * `src/behavior.ts` (`defaultSdkBehavior()`), and the per-language option
 * interfaces in `@xyd-js/opensdk-<lang>/src/types.ts`.
 */

/** The canonical languages, keyed by the emitter's canonical id. */
export type SdkLanguage = "node" | "go" | "python" | "ruby" | "java" | "dotnet";

export const SDK_LANGUAGES: readonly SdkLanguage[] = [
  "node",
  "go",
  "python",
  "ruby",
  "java",
  "dotnet",
] as const;

/** Display + the section key the emitter accepts (its primary alias). */
export const LANGUAGE_META: Record<
  SdkLanguage,
  { label: string; sectionKey: string; highlight: string }
> = {
  node: {
    label: "TypeScript",
    sectionKey: "typescript",
    highlight: "typescript",
  },
  go: { label: "Go", sectionKey: "go", highlight: "go" },
  python: { label: "Python", sectionKey: "python", highlight: "python" },
  ruby: { label: "Ruby", sectionKey: "ruby", highlight: "ruby" },
  java: { label: "Java", sectionKey: "java", highlight: "java" },
  dotnet: { label: "C#", sectionKey: "csharp", highlight: "csharp" },
};

/** Every opensdk language-section key alias → the wizard's CANONICAL section key
 * (the emitter's primary alias). Mirrors the sdk.schema.json patternProperties.
 * A built sdk.json can key the section by the language id (e.g. `node`, from an
 * auto-generated build); the wizard reads/edits/validates the canonical key. */
export const SECTION_KEY_ALIASES: Record<string, string> = {
  typescript: "typescript",
  ts: "typescript",
  javascript: "typescript",
  js: "typescript",
  node: "typescript",
  go: "go",
  golang: "go",
  python: "python",
  py: "python",
  ruby: "ruby",
  rb: "ruby",
  java: "java",
  csharp: "csharp",
  cs: "csharp",
  "c#": "csharp",
  dotnet: "csharp",
  ".net": "csharp",
};

/** Rename any aliased language section (e.g. `node` → `typescript`) to its
 * canonical key so the wizard's form/preview/schema all read it consistently.
 * Global keys ($schema/version/api/…) are untouched. */
export function normalizeSdkJsonSections(sdk: SdkJson): SdkJson {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(sdk)) {
    const canonical = SECTION_KEY_ALIASES[k.toLowerCase()];
    out[canonical ?? k] = v;
  }
  return out as SdkJson;
}

// ── behavior (the 9 runtime policies, all optional — deep-merged over defaults) ──

export interface RetryPolicy {
  maxRetries?: number;
  retryableStatusCodes?: number[];
  retryConnectionErrors?: boolean;
  honorRetryAfterHeader?: boolean;
  backoff?: {
    initialDelayMs?: number;
    maxDelayMs?: number;
    multiplier?: number;
    jitter?: number;
  };
}

export interface TimeoutPolicy {
  defaultTimeoutMs?: number;
  timeoutEnvVar?: string;
}

export interface ErrorPolicy {
  statusCodeMap?: Record<string, string>;
  clientErrorKind?: string;
  serverErrorKind?: string;
  errorDocUrlTemplate?: string;
}

export interface UserAgentPolicy {
  sdkIdentifierTemplate?: string;
  includeRuntimeVersion?: boolean;
  aiAgentEnvVars?: Record<string, string>;
}

export interface TelemetryPolicy {
  requestIdHeader?: string;
  headerName?: string;
  enabledByDefault?: boolean;
}

export interface LoggingPolicy {
  events?: string[];
}

export interface IdempotencyPolicy {
  headerName?: string;
  autoGenerateForPost?: boolean;
}

export interface PaginationPolicy {
  autoPageDelayMs?: number;
}

export interface RequestGuardPolicy {
  optionKeys?: string[];
}

export interface SdkBehavior {
  retry?: RetryPolicy;
  timeout?: TimeoutPolicy;
  errors?: ErrorPolicy;
  userAgent?: UserAgentPolicy;
  telemetry?: TelemetryPolicy;
  logging?: LoggingPolicy;
  idempotency?: IdempotencyPolicy;
  pagination?: PaginationPolicy;
  requestGuard?: RequestGuardPolicy;
}

// ── publish / grouping ──

export interface PublishTarget {
  author?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  version?: string;
  registry?: string;
  tokenEnv?: string;
  packageName?: string;
}

export interface OperationHint {
  mountOn?: string;
  action?: string;
}

export interface SdkGrouping {
  mountRules?: Record<string, string>;
  operationHints?: Record<string, OperationHint>;
}

// ── per-language sections (emitter options live directly on the section) ──

export interface LanguageSection {
  output?: string;
  baseURL?: string;
  tests?: boolean;
  behavior?: SdkBehavior;
  publish?: PublishTarget;
  // node
  packageName?: string;
  /** Default export: `true`/unset → derived name (`import Acme from 'acme'`); a
   * string → a custom name (`import Abc from 'acme'`). */
  exportDefault?: boolean | string;
  /** Named export instead: `true` → derived (`import { Acme } from 'acme'`); a
   * string → a custom name (`import { Abc } from 'acme'`). */
  exportPackage?: boolean | string;
  envVar?: string;
  busybox?:
    | boolean
    | "static"
    | "flat"
    | "namespace"
    | { style?: string; name?: string };
  // go
  modulePath?: string;
  goVersion?: string;
  // ruby
  moduleName?: string;
  // java
  basePackage?: string;
  // dotnet
  sdkName?: string;
  namespace?: string;
  targetFramework?: string;
  [option: string]: unknown;
}

/** The document the wizard builds (its state IS this object). */
export interface SdkJson {
  $schema?: string;
  version: number | string;
  api?: string;
  spec?: string;
  sdk?: string;
  sdkName?: string;
  behavior?: SdkBehavior;
  publish?: PublishTarget;
  grouping?: SdkGrouping;
  // per-language sections, keyed by the language section key (typescript/go/…)
  [language: string]:
    | LanguageSection
    | SdkBehavior
    | PublishTarget
    | SdkGrouping
    | string
    | number
    | undefined;
}

// ── preview contract (the injected `generatePreview` prop) ──

export interface PreviewRequest {
  language: SdkLanguage;
  sdkJson: SdkJson;
  /** which bundled sample spec to generate from (default: the first). */
  specId?: string;
  /**
   * The REAL OpenAPI document to generate against — the actual API the SDK is
   * for. When present it wins over `specId`/the bundled samples, so the wizard
   * shows the true API's SDK code + endpoints. Left unset (e.g. in Storybook) →
   * the bundled petstore sample. Raw (un-dereferenced) — `openapi2opensdk` needs
   * `$ref` identity to build nominal types.
   */
  doc?: Record<string, unknown>;
}

export interface PreviewFile {
  path: string;
  /** highlight language id (typescript/go/python/ruby/java/csharp/json/…). */
  language: string;
  code: string;
}

/** One operation's real SDK usage snippet — a row in the endpoint switcher. */
export interface PreviewOperation {
  /** Stable id `${resourceChain}.${action}` (e.g. `pets.list`) — the switcher
   * key AND the per-operation diff key (so switching shows that op's own diff). */
  id: string;
  /** Semantic verb: list | retrieve | create | update | delete | <custom>. */
  action: string;
  /** HTTP method, upper-cased for display (GET / POST / …). */
  httpMethod: string;
  /** HTTP path template (e.g. `/pets/{petId}`). */
  path: string;
  /** The emitter's real `generateUsage` snippet for this op (active language). */
  code: string;
}

export interface PreviewResult {
  /** the real generated project files (in-memory, from the emitter). */
  files: PreviewFile[];
  /** the active/hero operation's `generateUsage` snippet — kept for the diff
   * baseline + back-compat (mirrors `operations`' default entry). */
  usage?: string;
  /** real `generateUsage` per operation (active language) — drives the endpoint
   * switcher so usage can be viewed for EVERY operation, not just the hero. Empty
   * when the emitter has no `generateUsage`. */
  operations?: PreviewOperation[];
  /** the operation the switcher opens on (the hero — a list, else retrieve, else
   * the first walked). */
  defaultOperationId?: string;
  /** set when generation failed (mid-edit invalid state) — surfaced, not thrown. */
  error?: string;
}

/** The async boundary the UI calls; provided by the host (SB middleware / web route). */
export type GeneratePreview = (req: PreviewRequest) => Promise<PreviewResult>;
