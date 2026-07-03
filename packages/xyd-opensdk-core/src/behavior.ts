// SdkBehavior helpers: the canonical runtime-behavior defaults every emitter
// shares, plus the deep-merge machinery for per-API / per-language overrides
// (arrays replace entirely, objects merge recursively — oagen's proven
// ergonomics). Emitters call `sdkBehavior(spec)` and never null-check.
import type {
  BackoffStrategy,
  ErrorPolicy,
  IdempotencyPolicy,
  LoggingPolicy,
  OpensdkSpecJson,
  PaginationPolicy,
  RequestGuardPolicy,
  RetryPolicy,
  SdkBehavior,
  TelemetryPolicy,
  TimeoutPolicy,
  UserAgentPolicy,
} from './types.js';

/**
 * Recursive partial type for deep overrides.
 * Arrays replace entirely (don't concat), so an override like
 * `retry.retryableStatusCodes: [429]` means exactly `[429]`.
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * An `SdkBehavior` with every policy present and every canonical field filled
 * in (fields that have no default — `errors.errorDocUrlTemplate`,
 * `timeout.timeoutEnvVar` — stay optional). What `defaultSdkBehavior()` /
 * `mergeSdkBehavior()` / `sdkBehavior()` return, so emitters never null-check.
 */
export interface ResolvedSdkBehavior extends SdkBehavior {
  retry: RetryPolicy & {
    maxRetries: number;
    retryableStatusCodes: number[];
    retryConnectionErrors: boolean;
    honorRetryAfterHeader: boolean;
    backoff: BackoffStrategy & {
      initialDelayMs: number;
      maxDelayMs: number;
      multiplier: number;
      jitter: number;
    };
  };
  timeout: TimeoutPolicy & { defaultTimeoutMs: number };
  errors: ErrorPolicy & {
    statusCodeMap: Record<string, string>;
    clientErrorKind: string;
    serverErrorKind: string;
  };
  userAgent: UserAgentPolicy & {
    sdkIdentifierTemplate: string;
    includeRuntimeVersion: boolean;
    aiAgentEnvVars: Record<string, string>;
  };
  telemetry: TelemetryPolicy & {
    requestIdHeader: string;
    headerName: string;
    enabledByDefault: boolean;
  };
  logging: LoggingPolicy & { events: string[] };
  idempotency: IdempotencyPolicy & { headerName: string; autoGenerateForPost: boolean };
  pagination: PaginationPolicy & { autoPageDelayMs: number };
  requestGuard: RequestGuardPolicy & { optionKeys: string[] };
}

/**
 * The canonical SDK behavior defaults — the single source of truth for what a
 * generated SDK does at runtime. Every consumer (converter, emitters, ci)
 * MUST read these values from here; never re-hardcode them.
 */
export function defaultSdkBehavior(): ResolvedSdkBehavior {
  return {
    retry: {
      maxRetries: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      retryConnectionErrors: true,
      honorRetryAfterHeader: true,
      backoff: {
        initialDelayMs: 500,
        maxDelayMs: 8000,
        multiplier: 2,
        jitter: 0.25,
      },
    },
    timeout: {
      defaultTimeoutMs: 60000,
    },
    errors: {
      statusCodeMap: {
        '400': 'BadRequest',
        '401': 'Unauthorized',
        '403': 'PermissionDenied',
        '404': 'NotFound',
        '409': 'Conflict',
        '422': 'UnprocessableEntity',
        '429': 'RateLimited',
      },
      clientErrorKind: 'API',
      serverErrorKind: 'Internal',
    },
    userAgent: {
      sdkIdentifierTemplate: '{package}-{language}/{version}',
      includeRuntimeVersion: false,
      aiAgentEnvVars: {
        CLAUDE_CODE: 'claude-code',
        CURSOR_AGENT: 'cursor',
        CLINE_ACTIVE: 'cline',
        WINDSURF_ACTIVE: 'windsurf',
        COPILOT_AGENT: 'copilot',
      },
    },
    telemetry: {
      requestIdHeader: 'X-Request-ID',
      headerName: 'X-Client-Telemetry',
      enabledByDefault: false,
    },
    logging: {
      events: [
        'request.start',
        'request.success',
        'request.retry',
        'request.rate_limited',
        'request.error',
        'request.connection_error',
      ],
    },
    idempotency: {
      headerName: 'Idempotency-Key',
      autoGenerateForPost: true,
    },
    pagination: {
      autoPageDelayMs: 0,
    },
    requestGuard: {
      optionKeys: [
        'api_key',
        'apiKey',
        'idempotency_key',
        'idempotencyKey',
        'extra_headers',
        'extraHeaders',
        'max_retries',
        'maxRetries',
        'base_url',
        'baseUrl',
        'timeout',
      ],
    },
  };
}

/**
 * Deep-merge partial overrides into the canonical defaults.
 * Arrays replace entirely (so `retryableStatusCodes: [429]` replaces the full
 * list rather than appending); plain objects are merged recursively;
 * `undefined` override values are ignored (the default wins).
 */
export function mergeSdkBehavior(overrides?: DeepPartial<SdkBehavior>): ResolvedSdkBehavior {
  if (!overrides) return defaultSdkBehavior();
  return deepMerge(
    defaultSdkBehavior() as unknown as Record<string, unknown>,
    overrides as Record<string, unknown>,
  ) as unknown as ResolvedSdkBehavior;
}

/**
 * The effective runtime behavior of a spec: `spec.sdk` merged over the
 * canonical defaults. Always fully populated — emitters never null-check.
 */
export function sdkBehavior(spec: OpensdkSpecJson): ResolvedSdkBehavior {
  return mergeSdkBehavior(spec.sdk);
}

/**
 * Layer several behavior partials into one (later layers win) — e.g. a global
 * `behavior` then a per-language override. Same semantics as `mergeSdkBehavior`
 * (arrays replace, objects merge, `undefined` skipped) but stays PARTIAL: the
 * result is a `DeepPartial<SdkBehavior>` suitable to pass to `mergeSdkBehavior`
 * / the converter's `sdkBehavior` option (not the canonical defaults). Config
 * layers (sdk.json, future publish profiles) compose through this.
 */
export function mergeBehaviorOverrides(
  ...layers: (DeepPartial<SdkBehavior> | undefined)[]
): DeepPartial<SdkBehavior> {
  let out: Record<string, unknown> = {};
  for (const layer of layers) {
    if (!layer) continue;
    out = deepMerge(out, layer as Record<string, unknown>);
  }
  return out as DeepPartial<SdkBehavior>;
}

/**
 * Self-contained deep merge (opensdk-core is layer 0 — no imports).
 * Arrays and primitives from `source` replace those in `target`;
 * objects merge recursively; `undefined` source values are skipped.
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (sourceVal === undefined) continue;
    if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
