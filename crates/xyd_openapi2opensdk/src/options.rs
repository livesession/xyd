//! Converter options — port of src/types.ts `OpenApi2OpenSdkOptions`.
//! Deserialized from the JSON options bag the shim stringifies across the
//! napi boundary.

use serde::Deserialize;
use serde_json::{Map, Value};
use std::collections::HashMap;

/// Default trailing static path segments treated as a custom action verb.
pub const DEFAULT_CUSTOM_ACTION_VERBS: [&str; 12] = [
    "cancel",
    "submit",
    "complete",
    "archive",
    "unarchive",
    "restore",
    "verify",
    "confirm",
    "start",
    "stop",
    "pause",
    "resume",
];

#[derive(Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase", default)]
pub struct VerbMap {
    pub list_collection: Option<String>,
    pub get_item: Option<String>,
    pub create_collection: Option<String>,
    pub update_item: Option<String>,
    pub delete_item: Option<String>,
}

#[derive(Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase", default)]
pub struct OperationHint {
    pub mount_on: Option<String>,
    pub action: Option<String>,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct Options {
    pub sdk_name: Option<String>,
    pub version: Option<String>,
    pub include_methods: Option<Vec<String>>,
    pub include_paths: Option<Vec<String>>,
    pub verb_map: Option<VerbMap>,
    pub custom_action_verbs: Option<Vec<String>>,
    pub action_aliases: Option<bool>,
    pub auth_env_var: Option<String>,
    pub operation_hints: Option<HashMap<String, OperationHint>>,
    /// Longest-prefix mount rules; entry ORDER matters (strictly-longer wins,
    /// first of equal length sticks) — keep the JSON insertion order.
    pub mount_rules: Option<Map<String, Value>>,
    pub sdk_behavior: Option<Value>,
}
