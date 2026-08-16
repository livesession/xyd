//! OpenAPI 3.x → OpenSDK IR converter — Rust port of `@xyd-js/openapi2opensdk`
//! (S6+ W2 rider). Works on the RAW (un-dereferenced) document so component
//! identity survives into named types. Pure and synchronous; the parity oracle
//! is `packages/xyd-openapi2opensdk/__fixtures__/*/output.json`.

mod action;
mod behavior;
mod jsrt;
mod method;
mod model;
mod nominal;
mod options;
mod resource_tree;
mod schema;
mod security;

use serde_json::{Map, Value};

use action::{derive_target, DerivedTarget};
use jsrt::{js_object_keys, kebab_case, slug};
use method::build_method;
use model::{Info, Spec};
use nominal::SymbolTable;
use resource_tree::ResourceTree;
use security::security_schemes;

pub use behavior::{default_sdk_behavior, merge_sdk_behavior};
pub use model::Spec as OpensdkSpec;
pub use options::Options;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("openapi2opensdk: not an OpenAPI 3.x document — missing or unsupported \"openapi\" version field (got {0})")]
    NotOpenApi3(String),
    #[error(
        "openapi2opensdk: the document has no \"paths\" — nothing to convert into SDK methods"
    )]
    NoPaths,
    #[error("openapi2opensdk: {0}")]
    Io(String),
}

const DEFAULT_HTTP_METHODS: [&str; 5] = ["get", "put", "patch", "post", "delete"];

fn build_info(doc: &Value, sdk_name: &str, version: &str) -> Info {
    let src = doc.get("info");
    let title = src
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .filter(|t| !t.is_empty())
        .unwrap_or(sdk_name);
    let mut info = Info {
        title: title.to_string(),
        version: version.to_string(),
        description: None,
        summary: None,
        contact: None,
        license: None,
    };
    let truthy_str = |v: Option<&Value>| -> Option<String> {
        v.and_then(|s| s.as_str())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
    };
    info.description = truthy_str(src.and_then(|i| i.get("description")));
    info.summary = truthy_str(src.and_then(|i| i.get("summary")));

    if let Some(contact) = src.and_then(|i| i.get("contact")) {
        let mut out = Map::new();
        for key in ["name", "url", "email"] {
            if let Some(v) = truthy_str(contact.get(key)) {
                out.insert(key.to_string(), Value::String(v));
            }
        }
        if !out.is_empty() {
            info.contact = Some(out);
        }
    }
    if let Some(license) = src.and_then(|i| i.get("license")) {
        let mut out = Map::new();
        for key in ["name", "identifier", "url"] {
            if let Some(v) = truthy_str(license.get(key)) {
                out.insert(key.to_string(), Value::String(v));
            }
        }
        if !out.is_empty() {
            info.license = Some(out);
        }
    }
    info
}

fn split_segments(s: &str) -> Vec<String> {
    // split on /[/\s.]+/ then kebab each surviving segment
    s.split(|c: char| c == '/' || c == '.' || c.is_whitespace())
        .filter(|seg| !seg.is_empty())
        .map(kebab_case)
        .collect()
}

/// `x-open-sdk-method-name`: a verbatim SDK method-name override.
fn x_method_name(operation: &Value) -> Option<String> {
    operation
        .get("x-open-sdk-method-name")
        .and_then(|v| v.as_str())
        .filter(|v| !v.trim().is_empty())
        .map(|v| v.to_string())
}

/// `x-open-sdk-group-name`: the namespace the method nests under.
fn x_group_name(operation: &Value) -> Option<Vec<String>> {
    match operation.get("x-open-sdk-group-name") {
        Some(Value::String(s)) if !s.trim().is_empty() => Some(split_segments(s)),
        Some(Value::Array(arr)) => {
            let segs: Vec<String> = arr
                .iter()
                .filter_map(|v| v.as_str())
                .filter(|s| !s.trim().is_empty())
                .flat_map(split_segments)
                .collect();
            if segs.is_empty() {
                None
            } else {
                Some(segs)
            }
        }
        _ => None,
    }
}

/// Grouping/naming not in the spec paths. Precedence, lowest → highest:
/// derived path/action → operationHints/mountRules → the operation's own
/// x-open-sdk-* extensions.
fn apply_mounts(
    mut target: DerivedTarget,
    method: &str,
    path: &str,
    options: &Options,
    operation: &Value,
) -> DerivedTarget {
    let x_group = x_group_name(operation);
    let x_name = x_method_name(operation);

    let hint = options
        .operation_hints
        .as_ref()
        .and_then(|h| h.get(&format!("{} {}", method.to_uppercase(), path)));
    if let Some(mount_on) = hint.and_then(|h| h.mount_on.as_deref()) {
        target.resource_path = split_segments(mount_on);
    }
    if let Some(action) = hint.and_then(|h| h.action.as_deref()) {
        target.action = kebab_case(action);
    }

    // A spec-level group override supersedes config remapping entirely.
    let hint_mounted = hint.map(|h| h.mount_on.is_some()).unwrap_or(false);
    if let Some(rules) = options.mount_rules.as_ref() {
        if !hint_mounted && x_group.is_none() {
            let mut from_segs: Option<Vec<String>> = None;
            let mut to_segs: Option<Vec<String>> = None;
            for (from, to) in rules {
                let f = split_segments(from);
                let longer = f.len() > from_segs.as_ref().map(|s| s.len()).unwrap_or(0);
                let prefix_match = f
                    .iter()
                    .enumerate()
                    .all(|(i, seg)| target.resource_path.get(i) == Some(seg));
                if longer && prefix_match {
                    from_segs = Some(f);
                    to_segs = to.as_str().map(split_segments);
                }
            }
            if let (Some(f), Some(t)) = (from_segs, to_segs) {
                let mut merged = t;
                merged.extend(target.resource_path.iter().skip(f.len()).cloned());
                target.resource_path = merged;
            }
        }
    }

    // The operation's own extensions are the most explicit — they win.
    if let Some(g) = x_group {
        target.resource_path = g;
    }
    if let Some(n) = x_name {
        target.action = kebab_case(&n);
    }

    target
}

/// Convert a RAW (un-dereferenced) OpenAPI 3.x document into the OpenSDK IR.
pub fn openapi2opensdk(doc: &Value, options: Option<Options>) -> Result<Spec, Error> {
    let options = options.unwrap_or_default();

    // Validation-lite: fail loudly instead of emitting an empty IR.
    let oas_version = doc.get("openapi");
    let is_3x = oas_version
        .and_then(|v| v.as_str())
        .map(|v| v.starts_with("3."))
        .unwrap_or(false);
    if !is_3x {
        let got = match oas_version {
            // JSON.stringify(undefined) renders as the literal `undefined`.
            None => "undefined".to_string(),
            Some(v) => serde_json::to_string(v).unwrap_or_default(),
        };
        return Err(Error::NotOpenApi3(got));
    }
    let paths = doc.get("paths").and_then(|p| p.as_object());
    let paths = match paths {
        Some(p) if !p.is_empty() => p,
        _ => return Err(Error::NoPaths),
    };

    let title = doc
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .filter(|t| !t.is_empty())
        .unwrap_or("sdk");
    let sdk_name: String = options.sdk_name.clone().unwrap_or_else(|| {
        let s = slug(title);
        if s.is_empty() {
            "sdk".to_string()
        } else {
            s
        }
    });
    let version: String = options
        .version
        .clone()
        .or_else(|| {
            doc.get("info")
                .and_then(|i| i.get("version"))
                .and_then(|v| v.as_str())
                .map(|v| v.to_string())
        })
        .unwrap_or_else(|| "0.0.0".to_string());
    let methods: Vec<String> = options
        .include_methods
        .clone()
        .unwrap_or_else(|| DEFAULT_HTTP_METHODS.iter().map(|m| m.to_string()).collect())
        .into_iter()
        .map(|m| m.to_lowercase())
        .collect();

    let servers: Vec<String> = doc
        .get("servers")
        .and_then(|s| s.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|s| s.get("url").and_then(|u| u.as_str()))
                .filter(|u| !u.is_empty())
                .map(|u| u.to_string())
                .collect()
        })
        .unwrap_or_default();
    let security = security_schemes(doc, &sdk_name, options.auth_env_var.as_deref());

    // The effective runtime behavior (idempotency policy steers param handling).
    let sdk = merge_sdk_behavior(options.sdk_behavior.as_ref());

    let mut symbols = SymbolTable::new(doc);
    let mut tree = ResourceTree::new();

    for path in js_object_keys(paths) {
        let path_item = &paths[path];
        if path_item.is_null() {
            continue;
        }
        if let Some(prefixes) = options.include_paths.as_ref() {
            if !prefixes.iter().any(|p| path.starts_with(p.as_str())) {
                continue;
            }
        }

        let path_item_params: Vec<Value> = match path_item.get("parameters") {
            Some(Value::Array(arr)) => arr.clone(),
            _ => Vec::new(),
        };

        for method in &methods {
            let Some(operation) = path_item.get(method.as_str()) else {
                continue;
            };
            if !operation.is_object() {
                continue;
            }

            let target = apply_mounts(
                derive_target(method, path, operation, &options),
                method,
                path,
                &options,
                operation,
            );
            let built = build_method(
                doc,
                method,
                path,
                operation,
                &path_item_params,
                &target,
                &mut symbols,
                &sdk,
            );
            tree.insert(&target.resource_path, built);
        }
    }

    let types = symbols.emit();
    let resources = tree.emit();

    Ok(Spec {
        opensdk: "1.0.0".to_string(),
        info: build_info(doc, &sdk_name, &version),
        servers: if servers.is_empty() {
            None
        } else {
            Some(servers)
        },
        security: if security.is_empty() {
            None
        } else {
            Some(security)
        },
        types: if types.is_empty() { None } else { Some(types) },
        resources: if resources.is_empty() {
            None
        } else {
            Some(resources)
        },
        // ALWAYS stamped: emitters read policy values, never re-hardcode them.
        sdk,
    })
}

/// Read a raw OpenAPI spec from a JSON file and convert it (tier-1 fixtures;
/// the napi surface passes the document JSON directly).
pub fn openapi2opensdk_from_json_file(path: &str, options: Option<Options>) -> Result<Spec, Error> {
    let content = std::fs::read_to_string(path).map_err(|e| Error::Io(e.to_string()))?;
    let doc: Value = serde_json::from_str(&content).map_err(|e| Error::Io(e.to_string()))?;
    openapi2opensdk(&doc, options)
}

/// Convert a document passed as a JSON string (the napi transport).
pub fn openapi2opensdk_from_json_str(
    doc_json: &str,
    options_json: Option<&str>,
) -> Result<String, Error> {
    let doc: Value = serde_json::from_str(doc_json).map_err(|e| Error::Io(e.to_string()))?;
    let options: Option<Options> = match options_json {
        Some(s) => {
            Some(serde_json::from_str(s).map_err(|e| Error::Io(format!("bad options: {e}")))?)
        }
        None => None,
    };
    let spec = openapi2opensdk(&doc, options)?;
    serde_json::to_string(&spec).map_err(|e| Error::Io(e.to_string()))
}
