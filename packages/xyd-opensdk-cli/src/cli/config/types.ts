import type { DeepPartial, OperationHint, SdkBehavior } from '@xyd-js/opensdk-core';
import type { Emitter } from '@xyd-js/opensdk-framework';

/** Per-language target: an emitter's output dir + optional per-language behavior override. */
export interface ResolvedTarget {
  /** Output directory for this language (per `sdk.json` language section). */
  output?: string;
  /** Behavior override deep-merged OVER the global behavior for this language only. */
  behavior?: DeepPartial<SdkBehavior>;
}

/**
 * The normalized config every config source produces — the single shape the CLI
 * commands consume, regardless of the on-disk schema (sdk.json, opensdk.config.*,
 * a future chain.json). A superset of the historical `OpensdkCliConfig`.
 */
export interface ResolvedConfig {
  /** Extra emitter plugins to register (from a JS/TS plugin bundle). */
  emitters?: Emitter[];
  /** Per-language emitter options, keyed by CANONICAL language id (go|python|node|ruby|java|dotnet). */
  emitterOptions?: Record<string, Record<string, unknown>>;
  /** Default SDK name passed to the converter. */
  sdkName?: string;
  /** Resource-level mount rules (Stainless-style grouping). */
  mountRules?: Record<string, string>;
  /** Per-operation mount/action overrides keyed by "METHOD /path". */
  operationHints?: Record<string, OperationHint>;
  /** Global runtime behavior (deep-merged over defaultSdkBehavior()). */
  sdk?: DeepPartial<SdkBehavior>;
  /** Per-language targets (output + per-language behavior), keyed by canonical language id. */
  targets?: Record<string, ResolvedTarget>;
  /** Provenance of the loaded config (for precedence messages + tests). */
  source?: { kind: string; filePath: string };
}
