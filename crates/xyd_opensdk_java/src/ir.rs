//! Thin typed views over the OpenSDK IR (serde_json::Value). The emitter reads
//! fields loosely, so these are convenience accessors, not a full mirror.

use serde_json::Value;
use std::collections::HashMap;

/// The IR symbol table: name -> NamedType Value.
pub type Types = HashMap<String, Value>;

pub fn build_types(spec: &Value) -> Types {
    let mut m = HashMap::new();
    if let Some(arr) = spec.get("types").and_then(|t| t.as_array()) {
        for t in arr {
            if let Some(name) = t.get("name").and_then(|n| n.as_str()) {
                m.insert(name.to_string(), t.clone());
            }
        }
    }
    m
}

pub fn str_field<'a>(v: &'a Value, key: &str) -> Option<&'a str> {
    v.get(key).and_then(|x| x.as_str())
}

pub fn bool_field(v: &Value, key: &str) -> bool {
    v.get(key).and_then(|x| x.as_bool()).unwrap_or(false)
}

pub fn arr_field<'a>(v: &'a Value, key: &str) -> Vec<&'a Value> {
    v.get(key)
        .and_then(|x| x.as_array())
        .map(|a| a.iter().collect())
        .unwrap_or_default()
}
