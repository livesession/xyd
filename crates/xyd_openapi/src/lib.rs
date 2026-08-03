//! OpenAPI 3.x → Uniform `Reference[]` — the Rust port of
//! `packages/xyd-openapi` (S6+ W2). Endpoint code-sample generation
//! (@readme/oas-to-snippet) intentionally stays a JS post-pass in the shim;
//! everything else — deref semantics, schema conversion, parameters/request/
//! response definitions, component schemas incl. their JSON examples, tag
//! sorting — is here. The frozen fixtures are the spec.

mod components;
mod core;
mod doc;
mod paths;
mod util;

use serde::Deserialize;
use serde_json::Value;
use xyd_uniform::Reference;

pub use doc::DocCtx;

/// Port of `uniformOasOptions`.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Options {
    /// Format: `"METHOD /path"` (e.g. `"GET /users"`) or
    /// `"/components/schemas/Name"`.
    pub regions: Option<Vec<String>>,
}

#[derive(Debug)]
pub struct OasError(pub String);

impl std::fmt::Display for OasError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}
impl std::error::Error for OasError {}

const SUPPORTED_HTTP_METHODS: &[&str] = &["get", "put", "patch", "post", "delete"];

/// Read + parse a spec file (yaml/json by extension — the JS `readOpenApiSpec`
/// minus URLs, which the shim pre-fetches).
pub fn read_spec(path: &str) -> Result<Value, OasError> {
    let content =
        std::fs::read_to_string(path).map_err(|e| OasError(format!("read {path}: {e}")))?;
    parse_spec(&content, path)
}

/// Parse spec content by extension hint (or best-effort).
pub fn parse_spec(content: &str, path_hint: &str) -> Result<Value, OasError> {
    let lower = path_hint.to_lowercase();
    if lower.ends_with(".yaml") || lower.ends_with(".yml") {
        serde_yaml::from_str(content).map_err(|e| OasError(format!("yaml: {e}")))
    } else if lower.ends_with(".json") {
        serde_json::from_str(content).map_err(|e| OasError(format!("json: {e}")))
    } else if content.trim_start().starts_with('{') {
        serde_json::from_str(content).map_err(|e| OasError(format!("json: {e}")))
    } else {
        serde_yaml::from_str(content).map_err(|e| OasError(format!("yaml: {e}")))
    }
}

/// Port of `oapSchemaToReferences` (endpoint `examples.groups` left EMPTY —
/// the shim's JS post-pass fills them; component-schema examples are emitted).
pub fn oap_schema_to_references(raw: &Value, options: Option<Options>) -> Vec<Reference> {
    if raw.is_null() {
        return vec![];
    }
    let options = options.unwrap_or_default();
    // Materialize $ref-with-siblings merges first (v12 sibling semantics), then
    // build the lazy-resolution context over the processed doc.
    let (processed, merged_stamps) = DocCtx::preprocess(raw);
    let raw = &processed;
    let ctx = DocCtx::with_merged_stamps(raw, &merged_stamps);
    let mut references: Vec<Reference> = Vec::new();

    // Mutable servers accumulation quirk: starts from doc servers; path-level
    // servers get appended (dupe-guarded) as paths are processed, and the
    // ctx.servers fallback for every endpoint reads the CURRENT list.
    let mut servers: Vec<String> = raw
        .get("servers")
        .and_then(|s| s.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|s| s.get("url").and_then(|u| u.as_str()).map(String::from))
                .collect()
        })
        .unwrap_or_default();
    let first_server = servers.first().cloned().unwrap_or_default();

    let regions = options.regions.clone().unwrap_or_default();

    let paths_obj = raw.get("paths").and_then(|p| p.as_object());
    for (endpoint_path, oap_path) in paths_obj.into_iter().flatten() {
        let oap_path = ctx.resolve(oap_path);
        for method in SUPPORTED_HTTP_METHODS {
            // The JS pushes path servers inside the METHOD loop (dupe-guarded).
            if let Some(path_servers) = oap_path.get("servers").and_then(|s| s.as_array()) {
                for ps in path_servers {
                    if let Some(url) = ps.get("url").and_then(|u| u.as_str()) {
                        if !servers.iter().any(|s| s == url) {
                            servers.push(url.to_string());
                        }
                    }
                }
            }

            if !regions.is_empty() {
                let region_key = format!("{} {endpoint_path}", method.to_uppercase());
                if !regions.contains(&region_key) {
                    continue;
                }
            }

            let Some(mut reference) =
                paths::oap_path_to_reference(&ctx, method, endpoint_path, oap_path)
            else {
                continue;
            };

            // Orchestrator context mutations (oas-schema.ts):
            if let Some(Value::Object(c)) = reference.context.as_mut() {
                // ctx.path OVERWRITTEN with the RAW path (undoing the
                // encodeURIComponent from oapPathToReference).
                c.insert("path".into(), Value::String(endpoint_path.clone()));

                if !c.contains_key("fullPath") && !first_server.is_empty() {
                    if let Some(full) = util::join_url_pathname(&first_server, endpoint_path) {
                        c.insert("fullPath".into(), Value::String(full));
                    }
                }

                let has_servers = c
                    .get("servers")
                    .and_then(|s| s.as_array())
                    .map(|a| !a.is_empty())
                    .unwrap_or(false);
                if !has_servers && !servers.is_empty() {
                    c.insert(
                        "servers".into(),
                        Value::Array(servers.iter().cloned().map(Value::String).collect()),
                    );
                }

                // scopes: global oauth2 security + per-method security.
                let mut scopes: Vec<String> = Vec::new();
                if let Some(sec) = raw.get("security").and_then(|s| s.as_array()) {
                    for security in sec {
                        if let Some(obj) = security.as_object() {
                            for (key, val) in obj {
                                if key == "oauth2" || key == "OAuth2" {
                                    if let Some(list) = val.as_array() {
                                        scopes.extend(
                                            list.iter()
                                                .filter_map(|v| v.as_str().map(String::from)),
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
                let oap_method = ctx.resolve(oap_path.get(*method).unwrap_or(&Value::Null));
                if let Some(method_sec) = oap_method.get("security") {
                    if let Some(list) = method_sec.as_array() {
                        if list.is_empty() {
                            scopes.clear();
                        }
                        for security in list {
                            if let Some(obj) = security.as_object() {
                                for (key, val) in obj {
                                    let scheme = raw
                                        .get("components")
                                        .and_then(|c| c.get("securitySchemes"))
                                        .and_then(|s| s.get(key));
                                    let is_oauth2 =
                                        scheme.and_then(|s| s.get("type")).and_then(|t| t.as_str())
                                            == Some("oauth2");
                                    if is_oauth2 {
                                        if let Some(vals) = val.as_array() {
                                            scopes.extend(
                                                vals.iter()
                                                    .filter_map(|v| v.as_str().map(String::from)),
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                c.insert(
                    "scopes".into(),
                    Value::Array(scopes.into_iter().map(Value::String).collect()),
                );
            }

            references.push(reference);
        }
    }

    references.extend(components::schema_components_to_references(&ctx, &options));

    let tags = get_tags(raw);
    sort_references_by_tags(&mut references, &tags);

    references
}

/// Convenience: file path → references.
pub fn oap_schema_to_references_from_file(
    path: &str,
    options: Option<Options>,
) -> Result<Vec<Reference>, OasError> {
    let raw = read_spec(path)?;
    Ok(oap_schema_to_references(&raw, options))
}

/// Empirically pinned `oas.getTags()`: unique operation tags; those declared in
/// doc.tags come first (in doc.tags order), the undeclared follow in operation
/// encounter order.
fn get_tags(raw: &Value) -> Vec<String> {
    let mut encountered: Vec<String> = Vec::new();
    if let Some(paths) = raw.get("paths").and_then(|p| p.as_object()) {
        for (_p, item) in paths {
            if let Some(obj) = item.as_object() {
                for (_m, op) in obj {
                    if let Some(tags) = op.get("tags").and_then(|t| t.as_array()) {
                        for t in tags {
                            if let Some(name) = t.as_str() {
                                if !encountered.iter().any(|e| e == name) {
                                    encountered.push(name.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    let declared: Vec<String> = raw
        .get("tags")
        .and_then(|t| t.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|t| t.get("name").and_then(|n| n.as_str()).map(String::from))
                .collect()
        })
        .unwrap_or_default();

    let mut out: Vec<String> = declared
        .into_iter()
        .filter(|d| encountered.iter().any(|e| e == d))
        .collect();
    for e in encountered {
        if !out.contains(&e) {
            out.push(e);
        }
    }
    out
}

/// `sortReferencesByTags` — stable, mirroring the comparator exactly.
fn sort_references_by_tags(references: &mut [Reference], tags: &[String]) {
    references.sort_by(|prev, next| {
        let a_tags = group_of(prev);
        let b_tags = group_of(next);

        for tag in tags {
            let a_index = a_tags.iter().position(|t| t == tag);
            let b_index = b_tags.iter().position(|t| t == tag);
            match (a_index, b_index) {
                (Some(a), Some(b)) => return a.cmp(&b),
                (Some(_), None) => return std::cmp::Ordering::Less,
                (None, Some(_)) => return std::cmp::Ordering::Greater,
                (None, None) => {}
            }
        }
        let a0 = a_tags.first().cloned().unwrap_or_default();
        let b0 = b_tags.first().cloned().unwrap_or_default();
        a0.cmp(&b0)
    });
}

fn group_of(r: &Reference) -> Vec<String> {
    r.context
        .as_ref()
        .and_then(|c| c.get("group"))
        .and_then(|g| g.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default()
}
