//! CLI-mode runtime behavior defaults + deep-merge. Deliberately NOT the
//! HTTP `default_sdk_behavior()` — retry/userAgent/idempotency/pagination are
//! HTTP-shaped and would invite emitters to generate dead code. The IR ALWAYS
//! carries the merged behavior block as `spec.sdk`; `"mode": "cli"` is the
//! discriminator emitters branch on (HTTP specs carry no `mode`).

use serde_json::{json, Map, Value};

/// The canonical CLI-mode behavior defaults (emitters read policy values,
/// never re-hardcode them).
pub fn default_cli_behavior() -> Value {
    json!({
        "mode": "cli",
        "timeout": {
            "defaultTimeoutMs": 60000,
            "onTimeout": "kill"
        },
        "errors": {
            "nonZeroExit": "raise",
            "errorName": "CliError"
        },
        "result": {
            "typeName": "CommandResult",
            "jsonHelper": true
        },
        "process": {
            "inheritEnv": true,
            "stdin": "null"
        },
        "clientOptions": {
            "optionKeys": ["binPath", "cwd", "env", "timeout"]
        }
    })
}

/// Deep-merge overrides into the defaults: arrays and primitives replace,
/// plain objects merge recursively (same semantics as the HTTP converter's
/// `merge_sdk_behavior`).
pub fn merge_cli_behavior(overrides: Option<&Value>) -> Value {
    let defaults = default_cli_behavior();
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_carry_cli_mode() {
        let d = default_cli_behavior();
        assert_eq!(d["mode"], "cli");
        assert_eq!(d["timeout"]["defaultTimeoutMs"], 60000);
    }

    #[test]
    fn merge_replaces_scalars_and_merges_objects() {
        let over = json!({ "timeout": { "defaultTimeoutMs": 5 }, "extra": [1] });
        let merged = merge_cli_behavior(Some(&over));
        assert_eq!(merged["timeout"]["defaultTimeoutMs"], 5);
        assert_eq!(merged["timeout"]["onTimeout"], "kill"); // sibling key kept
        assert_eq!(merged["extra"], json!([1]));
        assert_eq!(merged["mode"], "cli");
    }
}
