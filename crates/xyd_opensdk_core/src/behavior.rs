//! Port of opensdk-core `behavior.ts` `sdkBehavior(spec)`: the canonical runtime
//! -behavior defaults deep-merged with the spec's `sdk` overrides (arrays
//! replace, objects merge). Each emitter's vendored runtime reads its constants
//! from the resolved block so one policy is encoded everywhere.
//!
//! THE SINGLE SOURCE OF TRUTH. This file was `xyd_opensdk_go/src/behavior.rs`,
//! copied verbatim so the `json!` literal could not drift in transit. Before the
//! move it existed in 9 crates; the 8 non-CLI copies were proven equal by
//! extracting each `json!({…})` body and comparing the parsed values **in
//! declaration order** (not just canonically — `preserve_order` makes key order
//! observable in generated source). `xyd_opencli2opensdk::default_cli_behavior`
//! is deliberately NOT merged in: it is a disjoint value set (`"mode":"cli"`,
//! `process`, `result`, `clientOptions`; no retry/userAgent/pagination) whose
//! only overlap is `timeout.defaultTimeoutMs`.

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
///
/// NOT expressible as `*target = deep_merge(target, source)`. The two differ on
/// every non-object input: this one leaves `target` untouched, [`deep_merge`]
/// returns `source`. Measured: `target={"a":1}, source=null` → `{"a":1}` here vs
/// `null` there. Today [`resolve_behavior`]'s `is_object` filter makes the case
/// unreachable, but collapsing them would turn that filter into a load-bearing
/// invariant. Both are kept, each matching the call sites it already had.
pub fn deep_merge_in_place(target: &mut Value, source: &Value) {
    let (Some(t), Some(s)) = (target.as_object_mut(), source.as_object()) else {
        return;
    };
    for (key, sval) in s {
        match (t.get_mut(key), sval) {
            (Some(tval), Value::Object(_)) if tval.is_object() => deep_merge_in_place(tval, sval),
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
        deep_merge_in_place(&mut behavior, sdk);
    }
    behavior
}

/// Pure deep merge: plain objects merge recursively; arrays and scalars replace.
///
/// The CONVERTER flavour (`xyd_openapi2opensdk::merge_sdk_behavior`,
/// `xyd_opencli2opensdk::merge_cli_behavior`). Differs from
/// [`deep_merge_in_place`] when either side is not an object: this returns
/// `source`, that one keeps the target. Neither guards its input, so the two are
/// NOT interchangeable — see the note on [`deep_merge_in_place`].
pub fn deep_merge(target: &Value, source: &Value) -> Value {
    let (Some(t), Some(s)) = (target.as_object(), source.as_object()) else {
        return source.clone();
    };
    let mut result = t.clone();
    for (key, source_val) in s {
        let merged = match (t.get(key), source_val) {
            (Some(tv), sv) if tv.is_object() && sv.is_object() => deep_merge(tv, sv),
            (_, sv) => sv.clone(),
        };
        result.insert(key.clone(), merged);
    }
    Value::Object(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// `preserve_order` pin. Six generated runtimes iterate these maps straight
    /// into emitted source, so declaration order is part of the artifact. If
    /// serde_json ever resolves without `preserve_order` this becomes a
    /// BTreeMap, silently alphabetises, and moves bytes in ~2,300 goldens.
    #[test]
    fn defaults_preserve_declaration_key_order() {
        let d = default_behavior();
        let agents: Vec<&str> = d["userAgent"]["aiAgentEnvVars"]
            .as_object()
            .unwrap()
            .keys()
            .map(String::as_str)
            .collect();
        assert_eq!(
            agents,
            [
                "CLAUDE_CODE",
                "CURSOR_AGENT",
                "CLINE_ACTIVE",
                "WINDSURF_ACTIVE",
                "COPILOT_AGENT"
            ],
            "preserve_order lost: generated runtimes bake this exact order"
        );
        let statuses: Vec<&str> = d["errors"]["statusCodeMap"]
            .as_object()
            .unwrap()
            .keys()
            .map(String::as_str)
            .collect();
        assert_eq!(statuses, ["400", "401", "403", "404", "409", "422", "429"]);
    }

    #[test]
    fn resolve_merges_objects_and_replaces_arrays() {
        let spec = json!({
            "sdk": {
                "retry": { "maxRetries": 5, "retryableStatusCodes": [429] },
                "errors": { "statusCodeMap": { "404": "Missing" } }
            }
        });
        let b = resolve_behavior(&spec);
        // scalar overridden, sibling default kept
        assert_eq!(b["retry"]["maxRetries"], 5);
        assert_eq!(b["retry"]["honorRetryAfterHeader"], true);
        // array REPLACES (not unioned)
        assert_eq!(b["retry"]["retryableStatusCodes"], json!([429]));
        // object MERGES: 404 flips in place, the other six defaults survive.
        // This is the semantics the TS emitters rely on — a port that replaced
        // the map would drop BadRequest/Unauthorized/... and change every
        // generated error hierarchy.
        assert_eq!(b["errors"]["statusCodeMap"]["404"], "Missing");
        assert_eq!(b["errors"]["statusCodeMap"]["400"], "BadRequest");
        assert_eq!(b["errors"]["statusCodeMap"].as_object().unwrap().len(), 7);
    }

    #[test]
    fn resolve_ignores_a_non_object_sdk() {
        assert_eq!(resolve_behavior(&json!({ "sdk": 42 })), default_behavior());
        assert_eq!(resolve_behavior(&json!({})), default_behavior());
    }

    /// The two merges are deliberately different functions; pin the divergence
    /// so nobody "simplifies" one into the other.
    #[test]
    fn the_two_merge_flavours_differ_on_non_objects() {
        let mut target = json!({ "a": 1 });
        deep_merge_in_place(&mut target, &Value::Null);
        assert_eq!(target, json!({ "a": 1 }), "in-place keeps the target");
        assert_eq!(
            deep_merge(&json!({ "a": 1 }), &Value::Null),
            Value::Null,
            "pure returns the source"
        );
    }

    #[test]
    fn deep_merge_is_recursive_and_replaces_scalars() {
        let merged = deep_merge(
            &json!({ "timeout": { "ms": 60000, "onTimeout": "kill" } }),
            &json!({ "timeout": { "ms": 5 }, "extra": [1] }),
        );
        assert_eq!(merged["timeout"]["ms"], 5);
        assert_eq!(merged["timeout"]["onTimeout"], "kill");
        assert_eq!(merged["extra"], json!([1]));
    }
}
