//! The subset of `SdkBehavior` the emit-scope files need: the `errors` policy
//! that names the generated exception classes (runtime.ts `errorClassNames`,
//! resolved against opensdk-core's `defaultSdkBehavior().errors`), plus the full
//! `sdkBehavior(spec)` resolution the vendored `_transport.py` runtime reads.

use std::collections::{BTreeMap, BTreeSet};

use serde_json::{json, Value};

/// The Python exception class for a policy error kind: `NotFound` ->
/// `NotFoundError`; the canonical client kind `API` IS the `APIError` base.
pub(crate) fn error_class_name(kind: &str) -> String {
    if kind == "API" {
        return "APIError".to_string();
    }
    if kind.ends_with("Error") {
        kind.to_string()
    } else {
        format!("{kind}Error")
    }
}

/// opensdk-core `defaultSdkBehavior().errors.statusCodeMap`.
fn default_status_code_map() -> [(&'static str, &'static str); 7] {
    [
        ("400", "BadRequest"),
        ("401", "Unauthorized"),
        ("403", "PermissionDenied"),
        ("404", "NotFound"),
        ("409", "Conflict"),
        ("422", "UnprocessableEntity"),
        ("429", "RateLimited"),
    ]
}

/// The generated `APIError` subclass names (sorted), for the package `__init__`
/// exports. `APIError` itself is not included. `spec.sdk.errors` overrides the
/// canonical defaults (statusCodeMap merges per key; kinds replace).
pub fn error_class_names(spec: &Value) -> Vec<String> {
    let errors = spec.get("sdk").and_then(|s| s.get("errors"));

    let mut map: BTreeMap<String, String> = default_status_code_map()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();
    if let Some(scm) = errors
        .and_then(|e| e.get("statusCodeMap"))
        .and_then(Value::as_object)
    {
        for (k, v) in scm {
            if let Some(s) = v.as_str() {
                map.insert(k.clone(), s.to_string());
            }
        }
    }
    let server_kind = errors
        .and_then(|e| e.get("serverErrorKind"))
        .and_then(Value::as_str)
        .unwrap_or("Internal");
    let client_kind = errors
        .and_then(|e| e.get("clientErrorKind"))
        .and_then(Value::as_str)
        .unwrap_or("API");

    let mut set: BTreeSet<String> = BTreeSet::new();
    for kind in map.values() {
        set.insert(error_class_name(kind));
    }
    set.insert(error_class_name(server_kind));
    set.insert(error_class_name(client_kind));
    set.remove("APIError");
    set.into_iter().collect()
}

/// opensdk-core `defaultSdkBehavior()` — the canonical runtime-behavior defaults
/// the vendored `_transport.py` interpolates its constants from. Object key order
/// is meaningful (serde `preserve_order`): e.g. `aiAgentEnvVars` renders in this
/// order into `AI_AGENT_ENV_VARS`.
pub(crate) fn default_behavior() -> Value {
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

/// The effective runtime behavior of a spec: `spec.sdk` merged over the canonical
/// defaults. Always fully populated — callers never null-check.
pub(crate) fn resolve_behavior(spec: &Value) -> Value {
    let mut behavior = default_behavior();
    if let Some(sdk) = spec.get("sdk").filter(|v| v.is_object()) {
        deep_merge(&mut behavior, sdk);
    }
    behavior
}
