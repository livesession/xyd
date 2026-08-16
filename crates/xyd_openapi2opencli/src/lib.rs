//! OpenAPI 3.x → OpenCLI doc converter — Rust port of `@xyd-js/openapi2opencli`
//! (Stage A of the CLI pipeline, S6+ W7). Emits the OpenCLI command tree plus
//! the `x-openapi` request binding on the root and every leaf command.
//!
//! The JS `openapi2opencli(doc)` takes an ALREADY-dereferenced document; the
//! Rust `from_file`/`from_json_str` read + deref via `xyd_openapi`'s DocCtx
//! (lazy `resolve()` — identity when there are no `$ref`s), so the pure
//! conversion sees resolved schemas exactly as the JS does.

mod action;
mod body;
mod command;
mod jsrt;
mod model;
mod options;
mod parameters;
mod response;
mod schema;
mod security;
mod tree;

use serde_json::{Map, Value};

use command::build_leaf_command;
use jsrt::{js_object_keys, slug};
use model::{Command, Info, Spec, XOpenApiRoot};
use security::security_schemes_to_x_openapi;
use tree::CommandTree;
use xyd_openapi::DocCtx;

pub use options::Options;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("openapi2opencli: {0}")]
    Io(String),
}

const DEFAULT_HTTP_METHODS: [&str; 5] = ["get", "put", "patch", "post", "delete"];

fn truthy_str(v: Option<&Value>) -> Option<String> {
    v.and_then(|s| s.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
}

fn build_info(doc: &Value, cli_name: &str, version: &str) -> Info {
    let src = doc.get("info");
    let mut info = Info {
        title: cli_name.to_string(),
        version: version.to_string(),
        description: None,
        summary: None,
        contact: None,
        license: None,
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

fn build_x_root(doc: &Value, cli_name: &str, options: &Options) -> Option<XOpenApiRoot> {
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
    let security = security_schemes_to_x_openapi(doc, cli_name, options.auth_env_var.as_deref());

    let root = XOpenApiRoot {
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
    };
    if root.servers.is_none() && root.security.is_none() {
        None
    } else {
        Some(root)
    }
}

/// Convert an (already-dereferenced or ref-carrying) OpenAPI doc. `ctx`
/// resolves `$ref`s lazily.
fn convert(ctx: &DocCtx, doc: &Value, options: &Options) -> Spec {
    let title = doc
        .get("info")
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .filter(|t| !t.is_empty())
        .unwrap_or("cli");
    let cli_name = options.cli_name.clone().unwrap_or_else(|| {
        let s = slug(title);
        if s.is_empty() {
            "cli".to_string()
        } else {
            s
        }
    });
    let version = options
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

    let x_openapi = build_x_root(doc, &cli_name, options);

    let mut tree = CommandTree::new();
    let empty = Map::new();
    let paths = doc
        .get("paths")
        .and_then(|p| p.as_object())
        .unwrap_or(&empty);

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
            let built =
                build_leaf_command(ctx, method, path, operation, &path_item_params, options);
            tree.insert(&built.resource_path, built.command);
        }
    }

    let commands: Vec<Command> = tree.emit();

    Spec {
        opencli: "1.0.0".to_string(),
        info: build_info(doc, &cli_name, &version),
        x_openapi,
        commands: if commands.is_empty() {
            None
        } else {
            Some(commands)
        },
    }
}

/// Convert a dereferenced OpenAPI document (as a JSON Value) to an OpenCLI doc.
pub fn openapi2opencli(doc: &Value, options: Option<Options>) -> Spec {
    let options = options.unwrap_or_default();
    // preprocess materializes $ref-with-siblings merges; DocCtx resolves refs.
    let (processed, stamps) = DocCtx::preprocess(doc);
    let ctx = DocCtx::with_merged_stamps(&processed, &stamps);
    convert(&ctx, &processed, &options)
}

/// Read + deref an OpenAPI spec file, then convert (tier-1 fixtures + napi).
pub fn openapi2opencli_from_file(path: &str, options: Option<Options>) -> Result<Spec, Error> {
    let raw = xyd_openapi::read_spec(path).map_err(|e| Error::Io(e.to_string()))?;
    Ok(openapi2opencli(&raw, options))
}

/// napi transport: a dereferenced-or-raw doc as a JSON string → OpenCLI JSON.
pub fn openapi2opencli_from_json_str(
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
    let spec = openapi2opencli(&doc, options);
    serde_json::to_string(&spec).map_err(|e| Error::Io(e.to_string()))
}
