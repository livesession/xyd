import type { DeepPartial, SdkBehavior } from '@xyd-js/opensdk-core';

// Cross-language behavior-parity probe: ONE distinctive (non-default)
// SdkBehavior override plus the exact substrings every language's emitted
// runtime must contain once it interpolates policy values from `spec.sdk`
// instead of hardcoding them. Policy values flow IR -> every runtime, so any
// drift (a language ignoring the declared policy) is CI-visible as a missing
// marker. Emitter-agnostic on purpose (layering: ci imports core/framework
// only) — tests feed it the generated file maps.

/** One containment probe: a policy value distinctive enough to grep for in any generated SDK. */
export interface ParityMarker {
  /** The `sdk.<policy>` path the marker proves flowed into the runtime. */
  policy: string;
  /**
   * Accepted renderings of the SAME policy value — some generated file must
   * contain at least one (a language may legitimately re-unit a value, e.g.
   * `12345` ms interpolated as `12.345` seconds by the Python runtime).
   */
  anyOf: string[];
}

export interface ParityProbe {
  /** Deep-partial overrides to merge into the IR's sdk block (via `mergeSdkBehavior`). */
  overrides: DeepPartial<SdkBehavior>;
  /** Substrings each language's emitted files must contain. */
  markers: ParityMarker[];
}

/**
 * The canonical parity probe. Marker values are chosen so their literal text
 * cannot occur incidentally in a small generated SDK; where a unit conversion
 * is idiomatic (ms -> seconds), every accepted rendering is listed.
 * `retry.maxRetries: 7` is part of the override but deliberately NOT a marker
 * — a bare `7` is not greppable.
 */
export function parityProbe(): ParityProbe {
  return {
    overrides: {
      retry: { maxRetries: 7, retryableStatusCodes: [408, 429, 500, 599] },
      timeout: { defaultTimeoutMs: 12345 },
      userAgent: { sdkIdentifierTemplate: 'parity-probe-{package}-{language}/{version}' },
      telemetry: { requestIdHeader: 'X-Parity-Request-Id' },
      idempotency: { headerName: 'X-Parity-Idempotency-Key' },
    },
    markers: [
      { policy: 'retry.retryableStatusCodes', anyOf: ['599'] },
      { policy: 'timeout.defaultTimeoutMs', anyOf: ['12345', '12.345'] },
      { policy: 'userAgent.sdkIdentifierTemplate', anyOf: ['parity-probe-'] },
    ],
  };
}

/** The probe markers with NO accepted rendering contained in any file of a generated file map. */
export function missingMarkers(files: Record<string, string>, markers: ParityMarker[]): ParityMarker[] {
  const contents = Object.values(files);
  return markers.filter((m) => !m.anyOf.some((marker) => contents.some((c) => c.includes(marker))));
}
