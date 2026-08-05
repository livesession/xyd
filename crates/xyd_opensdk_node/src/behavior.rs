//! Error-class names for `src/index.ts`. Ports `errorClassNames` (from the Node
//! emitter's runtime module) + the `errors` slice of `sdkBehavior` defaults
//! (`@xyd-js/opensdk-core`). The runtime FILE emission itself is out of scope;
//! only the class-name list the index re-exports is needed here.

use std::collections::BTreeSet;

use crate::ir::Spec;

/// Default `errors.statusCodeMap` from `sdkBehavior` (status -> error kind).
const DEFAULT_STATUS_CODE_MAP: &[(&str, &str)] = &[
    ("400", "BadRequest"),
    ("401", "Unauthorized"),
    ("403", "PermissionDenied"),
    ("404", "NotFound"),
    ("409", "Conflict"),
    ("422", "UnprocessableEntity"),
    ("429", "RateLimited"),
];
const DEFAULT_CLIENT_ERROR_KIND: &str = "API";
const DEFAULT_SERVER_ERROR_KIND: &str = "Internal";

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

/// Sorted error-subclass names (APIError excluded — it is emitted separately).
pub fn error_class_names(spec: &Spec) -> Vec<String> {
    // Resolve the errors behavior: defaults, deep-merged with any spec override
    // (map keys override per-key; kinds override if present). Arrays/objects
    // follow `sdkBehavior`'s merge — for every fixture this equals the default.
    let mut status_map: Vec<(String, String)> = DEFAULT_STATUS_CODE_MAP
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();
    let mut client_kind = DEFAULT_CLIENT_ERROR_KIND.to_string();
    let mut server_kind = DEFAULT_SERVER_ERROR_KIND.to_string();

    if let Some(errors) = spec.sdk.as_ref().and_then(|s| s.errors.as_ref()) {
        for (k, v) in &errors.status_code_map {
            if let Some(entry) = status_map.iter_mut().find(|(ek, _)| ek == k) {
                entry.1 = v.clone();
            } else {
                status_map.push((k.clone(), v.clone()));
            }
        }
        if let Some(c) = errors.client_error_kind.as_deref() {
            client_kind = c.to_string();
        }
        if let Some(s) = errors.server_error_kind.as_deref() {
            server_kind = s.to_string();
        }
    }

    let mut names: BTreeSet<String> = BTreeSet::new();
    for (_, kind) in &status_map {
        names.insert(error_class_name(kind));
    }
    names.insert(error_class_name(&server_kind));
    names.insert(error_class_name(&client_kind));
    names.remove("APIError");
    names.into_iter().collect()
}
