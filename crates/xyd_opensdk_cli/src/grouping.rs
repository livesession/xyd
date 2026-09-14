//! `src/cli/grouping.ts` — the converter-option bag shared by `parse`,
//! `generate` and `diff`, plus the `--grouping` file loader.

use std::path::Path;

use serde_json::{Map, Value};

use crate::error::{Error, Result};
use crate::paths;

/// JS truthiness, because the TS gates every field with `if (value)`:
/// `""`, `0`, `false`, `null`/`undefined` and `NaN` are falsy; `{}` and `[]`
/// are TRUTHY (an empty `mountRules` object is still set on the options).
pub fn js_truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0 && !f.is_nan()),
        Some(_) => true,
    }
}

/// A `{mountRules, operationHints}` grouping file. Extra keys (`_note`) are
/// ignored — the TS reads exactly these two fields off the parsed document.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct GroupingOverrides {
    pub mount_rules: Option<Value>,
    pub operation_hints: Option<Value>,
}

/// Converter-feeding inputs shared by `parse`, `generate` and `diff`.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct ConverterInputs {
    pub sdk_name: Option<String>,
    pub mount_rules: Option<Value>,
    pub operation_hints: Option<Value>,
    /// Path to a `{mountRules, operationHints}` JSON file; wins over the fields
    /// above, FIELD BY FIELD (a file with only `mountRules` leaves the config's
    /// `operationHints` in place).
    pub grouping: Option<String>,
    /// Runtime-behavior overrides (config `sdk`) → the converter's `sdkBehavior`.
    pub sdk: Option<Value>,
}

/// Load a `{mountRules, operationHints}` grouping JSON file.
pub fn load_grouping(grouping_path: &str, cwd: &Path) -> Result<GroupingOverrides> {
    let resolved = paths::resolve_str(cwd, grouping_path);
    if !Path::new(&resolved).exists() {
        return Err(Error::msg(format!(
            "Grouping file not found: {resolved}. Check the path passed to --grouping."
        )));
    }
    let raw = std::fs::read_to_string(&resolved)
        .map_err(|e| Error::msg(format!("Failed to load grouping file {resolved}: {e}")))?;
    // The TS interpolates Node's own `JSON.parse` message here; the Rust parser
    // has its own wording. Only the prefix is contract (and oracle-pinned).
    let doc: Value = serde_json::from_str(&raw)
        .map_err(|e| Error::msg(format!("Failed to load grouping file {resolved}: {e}")))?;
    Ok(GroupingOverrides {
        mount_rules: doc.get("mountRules").cloned(),
        operation_hints: doc.get("operationHints").cloned(),
    })
}

/// Resolve the converter options for a command: a `--grouping` file's rules
/// override the config-level ones, field by field.
///
/// Returns the raw options OBJECT (not a typed struct) so the key set and key
/// ORDER are exactly the TypeScript's — that is what the oracle compares, and
/// what `xyd_openapi2opensdk::Options` deserializes from.
pub fn converter_options(inputs: &ConverterInputs, cwd: &Path) -> Result<Map<String, Value>> {
    let grouping = match inputs.grouping.as_deref() {
        Some(p) => Some(load_grouping(p, cwd)?),
        None => None,
    };
    let mut options = Map::new();
    if inputs.sdk_name.as_deref().is_some_and(|s| !s.is_empty()) {
        options.insert(
            "sdkName".into(),
            Value::String(inputs.sdk_name.clone().unwrap()),
        );
    }
    let mount_rules = grouping
        .as_ref()
        .and_then(|g| g.mount_rules.as_ref())
        .or(inputs.mount_rules.as_ref());
    if js_truthy(mount_rules) {
        options.insert("mountRules".into(), mount_rules.unwrap().clone());
    }
    let operation_hints = grouping
        .as_ref()
        .and_then(|g| g.operation_hints.as_ref())
        .or(inputs.operation_hints.as_ref());
    if js_truthy(operation_hints) {
        options.insert("operationHints".into(), operation_hints.unwrap().clone());
    }
    if js_truthy(inputs.sdk.as_ref()) {
        options.insert("sdkBehavior".into(), inputs.sdk.clone().unwrap());
    }
    Ok(options)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn empty_inputs_produce_an_empty_bag() {
        let opts = converter_options(&ConverterInputs::default(), Path::new("/tmp")).unwrap();
        assert!(opts.is_empty());
    }

    #[test]
    fn falsy_scalars_are_skipped_but_empty_objects_are_kept() {
        let inputs = ConverterInputs {
            sdk_name: Some(String::new()),
            mount_rules: Some(json!({})),
            sdk: Some(json!({})),
            ..Default::default()
        };
        let opts = converter_options(&inputs, Path::new("/tmp")).unwrap();
        assert!(!opts.contains_key("sdkName"), "empty string is falsy in JS");
        assert_eq!(opts.get("mountRules"), Some(&json!({})));
        assert_eq!(opts.get("sdkBehavior"), Some(&json!({})));
    }

    #[test]
    fn key_order_matches_the_typescript_insertion_order() {
        let inputs = ConverterInputs {
            sdk_name: Some("acme".into()),
            mount_rules: Some(json!({ "a": "b/a" })),
            operation_hints: Some(json!({ "POST /x": { "mountOn": "y" } })),
            sdk: Some(json!({ "retry": { "maxRetries": 3 } })),
            grouping: None,
        };
        let opts = converter_options(&inputs, Path::new("/tmp")).unwrap();
        let keys: Vec<&str> = opts.keys().map(String::as_str).collect();
        assert_eq!(
            keys,
            ["sdkName", "mountRules", "operationHints", "sdkBehavior"]
        );
    }

    #[test]
    fn missing_grouping_file_reports_the_resolved_path() {
        let err = load_grouping("nope.grouping.json", Path::new("/tmp/work")).unwrap_err();
        assert_eq!(
            err.0,
            "Grouping file not found: /tmp/work/nope.grouping.json. Check the path passed to --grouping."
        );
    }
}
