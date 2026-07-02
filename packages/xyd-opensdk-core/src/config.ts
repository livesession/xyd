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
  /** Global runtime behavior (deep-merged over `defaultSdkBehavior()`). */
  behavior?: DeepPartial<SdkBehavior>;
  /** Default SDK name passed to the converter. */
  sdkName?: string;
  /** Spec-external grouping. */
  grouping?: SdkGrouping;
  /** Per-language sections, keyed by a language name or alias. */
  [language: string]: LanguageSection | unknown;
}
