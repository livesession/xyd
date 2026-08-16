//! SdkBehavior defaults + deep-merge — port of opensdk-core src/behavior.ts.
//! The IR ALWAYS carries the merged behavior block as `spec.sdk`.

use serde_json::{json, Map, Value};

/// The canonical SDK behavior defaults (single source of truth mirrored from
/// opensdk-core `defaultSdkBehavior()` — keep byte-in-sync).
pub fn default_sdk_behavior() -> Value {
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
        "timeout": {
            "defaultTimeoutMs": 60000
        },
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
        "pagination": {
            "autoPageDelayMs": 0
        },
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

/// Deep-merge overrides into the defaults: arrays and primitives replace,
/// plain objects merge recursively. (JS skips `undefined` source values —
/// absent keys in JSON; an explicit `null` replaces, matching JS.)
pub fn merge_sdk_behavior(overrides: Option<&Value>) -> Value {
    let defaults = default_sdk_behavior();
    match overrides {
        Some(over) => deep_merge(&defaults, over),
        None => defaults,
    }
}

fn deep_merge(target: &Value, source: &Value) -> Value {
    let (Some(t), Some(s)) = (target.as_object(), source.as_object()) else {
        return source.clone();
    };
    let mut result: Map<String, Value> = t.clone();
    for (key, source_val) in s {
        let merged = match (t.get(key), source_val) {
            (Some(tv), sv) if tv.is_object() && sv.is_object() => deep_merge(tv, sv),
            (_, sv) => sv.clone(),
        };
        result.insert(key.clone(), merged);
    }
    Value::Object(result)
}
