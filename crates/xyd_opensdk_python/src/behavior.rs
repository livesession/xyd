//! The subset of `SdkBehavior` the emit-scope files need: the `errors` policy
//! that names the generated exception classes (runtime.ts `errorClassNames`,
//! resolved against opensdk-core's `defaultSdkBehavior().errors`).

use std::collections::{BTreeMap, BTreeSet};

use serde_json::Value;

/// The Python exception class for a policy error kind: `NotFound` ->
/// `NotFoundError`; the canonical client kind `API` IS the `APIError` base.
fn error_class_name(kind: &str) -> String {
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
