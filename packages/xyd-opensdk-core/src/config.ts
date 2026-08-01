// Language-agnostic configuration schema for SDK generation. These are pure
// data types — the shape of a declarative `sdk.json` (and the grouping/hint
// primitives shared with the converter). They live in core so every consumer
// (the CLI, the converter, future tooling) uses one source of truth.
import type { DeepPartial } from './behavior';
import type { SdkBehavior } from './types';

/**
 * A per-operation mount/action override keyed by `"METHOD /path"`
 * (e.g. `{ 'POST /assistants': { mountOn: 'beta/assistants' } }`).
 */
export interface OperationHint {
  /** Re-mount the operation under this resource path (slash/space-separated segments). */
  mountOn?: string;
  /** Override the derived action verb. */
  action?: string;
}

/**
 * A publish target: how one language's generated SDK is published to its
 * registry, plus package identity threaded onto the IR (`spec.info`).
 *
 * The IR already carries `version`, `contact` (author), and `license` from the
 * OpenAPI `info`; the identity fields here OVERRIDE/fill those before emit so a
 * single `sdk.json` block controls the metadata every manifest renders. The
 * mechanics fields (`registry`, `tokenEnv`, `packageName`) are consumed by the
 * `opensdk publish` command, NOT baked into the manifest (an ephemeral local
 * registry URL must never end up in a committed manifest/golden).
 */
export interface PublishTarget {
  // ── identity → merged onto spec.info (language-agnostic) ──
  /** Package author (`spec.info.contact.name`). */
  author?: string;
  /** SPDX license id (`spec.info.license.identifier`), e.g. `"MIT"`. */
  license?: string;
  /** Source repository URL (`spec.info.repository`). */
  repository?: string;
  /** Project homepage URL (`spec.info.homepage`). */
  homepage?: string;
  /** Package version override (else `spec.info.version`). */
  version?: string;
  // ── mechanics → consumed by `opensdk publish`, not the manifest ──
  /** Registry URL to publish to (npm registry, PyPI repository-url, NuGet source, ...). */
  registry?: string;
  /** Env var name holding the auth token (read at publish time; never stored). */
  tokenEnv?: string;
  /** Registry package name override (else the emitter's derived/`packageName` value). */
  packageName?: string;
}

/**
 * Layer publish targets left-to-right (global first, per-language last); a
 * later layer's defined field wins, `undefined` is skipped. Returns `undefined`
 * when no layer contributes anything (so callers can skip identity threading).
 */
export function mergePublishTargets(
  ...layers: (PublishTarget | undefined)[]
): PublishTarget | undefined {
  let out: PublishTarget | undefined;
  for (const layer of layers) {
    if (!layer) continue;
    for (const [k, v] of Object.entries(layer)) {
      if (v === undefined) continue;
      (out ??= {})[k as keyof PublishTarget] = v as never;
    }
  }
  return out;
}

/** Spec-external resource grouping (Stainless-style beta/admin namespacing). */
export interface SdkGrouping {
  /** Resource-level mount rules, e.g. `{ assistants: 'beta/assistants' }`. */
  mountRules?: Record<string, string>;
  /** Per-operation overrides keyed by `"METHOD /path"`. */
  operationHints?: Record<string, OperationHint>;
}

/**
 * One language section of an `sdk.json`: the emitter's options plus optional
 * `output` (dir) and `behavior` (a per-language override deep-merged over the
 * global `behavior`). The remaining keys are that emitter's options
 * (`packageName`, `modulePath`, `namespace`, ...).
 */
export interface LanguageSection {
  /** Output directory for this language's generated SDK. */
  output?: string;
  /** Per-language behavior override (deep-merged over the global `behavior`). */
  behavior?: DeepPartial<SdkBehavior>;
  /** Per-language publish target (deep-merged over the global `publish`). */
  publish?: PublishTarget;
  [option: string]: unknown;
}

/**
 * The declarative `sdk.json` config: global runtime `behavior` + per-language
 * sections. Language keys accept aliases (`typescript`, `csharp`, ...).
 */
export interface SdkJson {
  $schema?: string;
  /** Config schema version. */
  version: number | string;
  /**
   * The API this SDK is generated FROM — a registry ref (`apis/<ns>/<api>@<ver>`)
   * or a path to the OpenAPI spec (yaml/json) / pre-parsed OpenSDK IR (.json),
   * relative to this file. Used by `opensdk generate` when `--spec` is omitted;
   * `--spec` overrides it. Supersedes the legacy `spec` key.
   */
  api?: string;
  /** @deprecated Renamed to `api`. Still read as a fallback for old sdk.json files. */
  spec?: string;
  /**
   * This SDK's OWN registry identity (`sdks/<ns>/<sdk>@<ver>`) — informational,
   * mirrors `api`'s shape but for the SDK it produces (not the source spec).
   */
  sdk?: string;
  /** Global runtime behavior (deep-merged over `defaultSdkBehavior()`). */
  behavior?: DeepPartial<SdkBehavior>;
  /** Default SDK name passed to the converter. */
  sdkName?: string;
  /** Spec-external grouping. */
  grouping?: SdkGrouping;
  /** Global publish target (defaults; a language section's `publish` overrides it). */
  publish?: PublishTarget;
  /** Per-language sections, keyed by a language name or alias. */
  [language: string]: LanguageSection | unknown;
}

// ── chain.json — the multi-source/multi-target pipeline (a Speakeasy workflow.yaml
// analog) driven by `opensdk run`. Unlike sdk.json (one API → N language sections),
// a chain declares many named SOURCES (specs, optionally merged + overlaid) and many
// named TARGETS, each binding a source + a language + output + publish. ─────────────

/** One spec/overlay input: a file path or URL. */
export interface ChainInput {
  location: string;
}

/**
 * A named source: one or more OpenAPI `inputs` (merged when >1) with optional
 * OpenAPI `overlays` applied in order, producing a processed spec at `output`
 * (or a temp file). Operates on the RAW doc so `$ref`s survive into the converter.
 */
export interface ChainSource {
  /** Spec inputs; a single input passes through, multiple are merged. */
  inputs: ChainInput[];
  /** OpenAPI Overlay 1.0.0 documents, applied in order after merge. */
  overlays?: ChainInput[];
  /** Where to write the processed spec (json/yaml by extension); a temp file if omitted. */
  output?: string;
}

/**
 * A named target: generate (and optionally publish) one SDK from a source. Reuses
 * the sdk.json per-language knobs (behavior/grouping/options/publish) so a target
 * is effectively a single `opensdk generate --lang <target> --spec <source>` +
 * `opensdk publish`.
 */
export interface ChainTarget {
  /** Emitter language or alias (typescript, go, csharp, ...). */
  target: string;
  /** Name of the `sources` entry this target generates from. */
  source: string;
  /** SDK output directory (default `./sdk/<target-name>`). */
  output?: string;
  /** SDK name passed to the converter. */
  sdkName?: string;
  /** Behavior override, deep-merged over the chain's global `behavior`. */
  behavior?: DeepPartial<SdkBehavior>;
  /** Spec-external grouping (mountRules/operationHints). */
  grouping?: SdkGrouping;
  /** Emitter options for this language (packageName, modulePath, namespace, ...). */
  options?: Record<string, unknown>;
  /** Publish target, merged over the chain's global `publish`. */
  publish?: PublishTarget;
  /** Emit the SDK's own test suite (default true). */
  tests?: boolean;
}

/**
 * The declarative `chain.json`: named `sources` → named `targets`, driven by
 * `opensdk run`. `behavior`/`publish` are global defaults merged into each target.
 */
export interface ChainJson {
  $schema?: string;
  /** Config schema version. */
  version: number | string;
  /** Global behavior default (deep-merged under each target's `behavior`). */
  behavior?: DeepPartial<SdkBehavior>;
  /** Global publish default (merged under each target's `publish`). */
  publish?: PublishTarget;
  /** Named sources, each producing one processed spec. */
  sources: Record<string, ChainSource>;
  /** Named targets, each = source + language + output + publish. */
  targets: Record<string, ChainTarget>;
}
