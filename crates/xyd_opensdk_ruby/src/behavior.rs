//! Port of opensdk-core `behavior.ts` `sdkBehavior(spec)`: the canonical runtime
//! -behavior defaults deep-merged with the spec's `sdk` overrides (arrays
//! replace, objects merge). The vendored transport (`runtime.rs`) reads its
//! constants from the resolved block so the three runtimes encode one policy.

use serde_json::{json, Value};

/// The canonical SDK behavior defaults — the single source of truth for what a
/// generated SDK does at runtime (mirrors `defaultSdkBehavior()`).
pub fn default_behavior() -> Value {
    json!({
        "retry": {
            "maxRetries": 2,
            "retryableStatusCodes": [408, 429, 500, 502, 503, 504],
            "retryConnectionErrors": true,
            "honorRetryAfterHeader": true,
            "backoff": {
                "initialDelayMs": 500,
                "maxDelayMs": 8000,
                "multiplier": 2,
                "jitter": 0.25
            }
        },
        "timeout": { "defaultTimeoutMs": 60000 },
        "errors": {
            "statusCodeMap": {
                "400": "BadRequest",
                "401": "Unauthorized",
                "403": "PermissionDenied",
                "404": "NotFound",
                "409": "Conflict",
                "422": "UnprocessableEntity",
                "429": "RateLimited"
            },
            "clientErrorKind": "API",
            "serverErrorKind": "Internal"
        },
        "userAgent": {
            "sdkIdentifierTemplate": "{package}-{language}/{version}",
            "includeRuntimeVersion": false,
            "aiAgentEnvVars": {
                "CLAUDE_CODE": "claude-code",
                "CURSOR_AGENT": "cursor",
                "CLINE_ACTIVE": "cline",
                "WINDSURF_ACTIVE": "windsurf",
                "COPILOT_AGENT": "copilot"
            }
        },
        "telemetry": {
            "requestIdHeader": "X-Request-ID",
            "headerName": "X-Client-Telemetry",
            "enabledByDefault": false
        },
        "logging": {
            "events": [
                "request.start",
                "request.success",
                "request.retry",
                "request.rate_limited",
                "request.error",
                "request.connection_error"
            ]
        },
        "idempotency": {
            "headerName": "Idempotency-Key",
            "autoGenerateForPost": true
        },
        "pagination": { "autoPageDelayMs": 0 },
        "requestGuard": {
            "optionKeys": [
                "api_key",
                "apiKey",
                "idempotency_key",
                "idempotencyKey",
                "extra_headers",
                "extraHeaders",
                "max_retries",
                "maxRetries",
                "base_url",
                "baseUrl",
                "timeout"
            ]
        }
    })
}

/// Deep-merge `source` into `target` in place: plain objects merge recursively;
/// arrays and scalars replace entirely (mirrors opensdk-core `deepMerge`, minus
/// the JS `undefined` skip — JSON has no `undefined`).
fn deep_merge(target: &mut Value, source: &Value) {
    let (Some(t), Some(s)) = (target.as_object_mut(), source.as_object()) else {
        return;
    };
    for (key, sval) in s {
        match (t.get_mut(key), sval) {
            (Some(tval), Value::Object(_)) if tval.is_object() => deep_merge(tval, sval),
            _ => {
                t.insert(key.clone(), sval.clone());
            }
        }
    }
}

/// The effective runtime behavior of a spec: `spec.sdk` merged over the
/// canonical defaults. Always fully populated — callers never null-check.
pub fn resolve_behavior(spec: &Value) -> Value {
    let mut behavior = default_behavior();
    if let Some(sdk) = spec.get("sdk").filter(|v| v.is_object()) {
        deep_merge(&mut behavior, sdk);
    }
    behavior
}
