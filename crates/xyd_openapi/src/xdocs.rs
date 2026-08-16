//! Port of `uniformPluginXDocsSidebar` (packages/xyd-openapi/src/impl-js/
//! xdocs/pluginSidebar.ts) — the x-docs sidebar reordering plugin — minus the
//! `x-docs` EXAMPLES builders (`meta.examples` / `componentMeta.example`):
//! example mutations only affect `ref.examples`, which the fused pages/
//! sidebar/frontmatter outputs never read, and endpoint examples are a JS
//! post-pass anyway. Refs are handled as JSON values (the JS plugin mutates
//! plain objects).

use serde_json::{json, Map, Value};

use crate::doc::DocCtx;
use xyd_uniform::jsrt::truthy;

/// `getXDocs(doc)?.route` (string) — the fileRouting side-channel.
pub fn get_xdocs_route(doc: &Value) -> Option<String> {
    doc.get("x-docs")?
        .get("route")?
        .as_str()
        .map(|s| s.to_string())
}

/// Apply the plugin to `refs` in place: the per-ref x-docs meta pass, then
/// (when `x-docs.sidebar` exists) the sidebar-driven ref-list rebuild.
pub fn apply_xdocs_sidebar(ctx: &DocCtx, doc: &Value, refs: &mut Vec<Value>) {
    // ---- per-ref pass (pluginXDocsSidebarInner) -------------------------
    // ref index maps mirror refByOperationId / refByComponentSchema
    // (last-write-wins on duplicate keys, like JS object assignment).
    let mut by_operation_id: std::collections::HashMap<String, usize> = Default::default();
    let mut by_component_schema: std::collections::HashMap<String, usize> = Default::default();

    for (i, r) in refs.iter_mut().enumerate() {
        let (component_schema, method, path) = {
            let c = r.get("context");
            (
                c.and_then(|c| c.get("componentSchema"))
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                c.and_then(|c| c.get("method"))
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                c.and_then(|c| c.get("path"))
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
            )
        };

        if let Some(cs) = &component_schema {
            by_component_schema.insert(cs.clone(), i);
        }

        // selector("[method] [path]") — the operation node; absent for
        // component-schema refs.
        let (Some(method), Some(path)) = (method, path) else {
            continue;
        };
        let Some(op) = operation_node(ctx, doc, &path, &method) else {
            continue;
        };

        if let Some(operation_id) = op.get("operationId").and_then(|v| v.as_str()) {
            if !operation_id.is_empty() {
                by_operation_id.insert(operation_id.to_string(), i);
            }
        }
        // `(httpMethod.toUpperCase() + " " + path).trim()`
        let method_id = format!("{} {}", method.to_uppercase(), path)
            .trim()
            .to_string();
        if !method_id.is_empty() {
            by_operation_id.insert(method_id, i);
        }

        let Some(meta) = op.get("x-docs") else {
            continue;
        };

        if let Some(name) = meta.get("name").filter(|n| truthy(Some(n))) {
            r["title"] = name.clone();
        }
        if let Some(group) = meta.get("group").filter(|g| truthy(Some(g))) {
            // JS: `if (ref.context) ref.context.group = [meta.group]`
            if r.get("context").map(|c| truthy(Some(c))).unwrap_or(false) {
                r["context"]["group"] = json!([group]);
            }
        }
        if !truthy(r.get("description")) {
            let summary = op
                .get("summary")
                .and_then(|s| s.as_str())
                .unwrap_or("")
                .to_string();
            r["description"] = Value::String(summary);
        }
        if let Some(returns) = meta.get("returns").filter(|v| truthy(Some(v))) {
            let defs = r.get_mut("definitions").and_then(|d| d.as_array_mut());
            match defs {
                Some(defs) if !defs.is_empty() => {
                    let last = defs.len() - 1;
                    let title = defs[last].get("title").cloned().unwrap_or(Value::Null);
                    defs[last] = json!({
                        "title": title,
                        "description": returns,
                        "properties": [],
                    });
                }
                _ => {
                    r["definitions"] = json!([{
                        "title": "Response",
                        "description": returns,
                        "properties": [],
                    }]);
                }
            }
        }
        // meta.examples: NOT ported (see module header).
    }

    // ---- defer pass: the sidebar-driven rebuild -------------------------
    let Some(xdocs) = doc.get("x-docs") else {
        return;
    };
    let Some(sidebar) = xdocs.get("sidebar").and_then(|s| s.as_array()) else {
        return;
    };
    if !truthy(xdocs.get("sidebar")) {
        return;
    }

    let inherit = xdocs.get("sidebarPathStrategy").and_then(|v| v.as_str()) == Some("inherit");

    let mut output: Vec<Value> = Vec::new();
    for group in sidebar {
        // JS builds navigationMap and warns/continues when a group is falsy —
        // structurally: skip non-objects, require array pages.
        if !group.is_object() {
            continue;
        }
        let Some(pages) = group.get("pages").and_then(|p| p.as_array()) else {
            continue;
        };
        let group_name = group
            .get("group")
            .and_then(|g| g.as_str())
            .unwrap_or("")
            .to_string();
        process_group_pages(
            ctx,
            doc,
            refs,
            &by_operation_id,
            &by_component_schema,
            pages,
            &[group_name],
            None,
            inherit,
            &mut output,
        );
    }

    // `references.length = 0; references.push(...output)`
    *refs = output;
}

/// Resolve `doc.paths[path][method]` through possible `$ref` path items.
fn operation_node<'a>(
    ctx: &DocCtx<'a>,
    doc: &'a Value,
    path: &str,
    method: &str,
) -> Option<&'a Value> {
    let path_item = doc.get("paths")?.get(path)?;
    let path_item = ctx.resolve(path_item);
    let op = path_item.get(method)?;
    let op = ctx.resolve(op);
    if op.is_object() {
        Some(op)
    } else {
        None
    }
}

#[allow(clippy::too_many_arguments)]
fn process_group_pages(
    ctx: &DocCtx,
    doc: &Value,
    refs: &[Value],
    by_operation_id: &std::collections::HashMap<String, usize>,
    by_component_schema: &std::collections::HashMap<String, usize>,
    pages: &[Value],
    group_path: &[String],
    parent_path: Option<&str>,
    inherit: bool,
    output: &mut Vec<Value>,
) {
    for page in pages {
        let nested = page.get("pages").and_then(|p| p.as_array());
        if let Some(nested_pages) = nested {
            // nested group
            let mut gp = group_path.to_vec();
            gp.push(
                page.get("group")
                    .and_then(|g| g.as_str())
                    .unwrap_or("")
                    .to_string(),
            );
            let pp = page.get("path").and_then(|p| p.as_str());
            process_group_pages(
                ctx,
                doc,
                refs,
                by_operation_id,
                by_component_schema,
                nested_pages,
                &gp,
                pp,
                inherit,
                output,
            );
        } else if page.get("type").is_some() && page.get("key").is_some() {
            process_page(
                ctx,
                doc,
                refs,
                by_operation_id,
                by_component_schema,
                page,
                group_path,
                parent_path,
                inherit,
                output,
            );
        }
    }
}

#[allow(clippy::too_many_arguments)]
fn process_page(
    ctx: &DocCtx,
    doc: &Value,
    refs: &[Value],
    by_operation_id: &std::collections::HashMap<String, usize>,
    by_component_schema: &std::collections::HashMap<String, usize>,
    page: &Value,
    group_path: &[String],
    parent_path: Option<&str>,
    inherit: bool,
    output: &mut Vec<Value>,
) {
    let page_type = page.get("type").and_then(|t| t.as_str()).unwrap_or("");
    let key = page.get("key").and_then(|k| k.as_str()).unwrap_or("");

    let mut uniform_ref: Value = match page_type {
        "endpoint" => {
            let Some(&idx) = by_operation_id.get(key) else {
                return; // JS warns + returns
            };
            refs[idx].clone()
        }
        "object" => {
            let Some(&idx) = by_component_schema.get(key) else {
                return;
            };
            // selector("[component]") = doc.components.schemas[key]
            let Some(component) = doc
                .get("components")
                .and_then(|c| c.get("schemas"))
                .and_then(|s| s.get(key))
            else {
                return;
            };
            let component = ctx.resolve(component);

            let mut component_meta: Option<&Value> = None;
            if let Some(all_of) = component.get("allOf").and_then(|a| a.as_array()) {
                let mut found = false;
                for item in all_of {
                    let item = ctx.resolve(item);
                    if let Some(docs_meta) = item.get("x-docs") {
                        found = true;
                        component_meta = Some(docs_meta);
                        break;
                    }
                }
                if !found {
                    return; // JS warns + drops the page
                }
            } else if let Some(docs_meta) = component.get("x-docs") {
                component_meta = Some(docs_meta);
            }

            let mut r = refs[idx].clone();
            if let Some(meta) = component_meta {
                // `componentRef.title = componentMeta.name || componentRef.title`
                if let Some(name) = meta.get("name").filter(|n| truthy(Some(n))) {
                    r["title"] = name.clone();
                }
                // componentMeta.example: NOT ported (see module header).
            }
            r
        }
        _ => return, // JS warns on unknown page type
    };

    // canonical rewriting
    let page_path = page.get("path").and_then(|p| p.as_str());
    if inherit {
        let ctx_path = uniform_ref
            .get("context")
            .and_then(|c| c.get("path"))
            .and_then(|p| p.as_str())
            .unwrap_or("");
        let first_part = parent_path.filter(|p| !p.is_empty()).unwrap_or(ctx_path);
        let canonical = join_paths(&[Some(first_part), page_path]);
        if !canonical.is_empty() {
            uniform_ref["canonical"] = Value::String(canonical);
        }
    } else if page_path.map(|p| !p.is_empty()).unwrap_or(false) {
        uniform_ref["canonical"] = Value::String(join_paths(&[parent_path, page_path]));
    } else if let Some(pp) = parent_path.filter(|p| !p.is_empty()) {
        uniform_ref["canonical"] = Value::String(pp.to_string());
    }

    if !uniform_ref
        .get("context")
        .map(|c| truthy(Some(c)))
        .unwrap_or(false)
    {
        uniform_ref["context"] = Value::Object(Map::new());
    }
    uniform_ref["context"]["group"] = Value::Array(
        group_path
            .iter()
            .map(|g| Value::String(g.clone()))
            .collect(),
    );

    output.push(uniform_ref);
}

/// Port of pluginSidebar's `joinPaths`: strip outer slashes per part, prefix
/// `/`, join, collapse `//`, remove `/{param}` and `/:param` segments.
fn join_paths(parts: &[Option<&str>]) -> String {
    let mut joined = String::new();
    for part in parts.iter().flatten() {
        if part.is_empty() {
            continue; // .filter(Boolean)
        }
        let trimmed = part.trim_matches('/');
        if !trimmed.is_empty() {
            joined.push('/');
            joined.push_str(trimmed);
        }
    }
    // collapse duplicate slashes
    let mut collapsed = String::with_capacity(joined.len());
    let mut prev_slash = false;
    for c in joined.chars() {
        if c == '/' {
            if prev_slash {
                continue;
            }
            prev_slash = true;
        } else {
            prev_slash = false;
        }
        collapsed.push(c);
    }
    // remove "/{param}" segments
    let collapsed = remove_segments(&collapsed, '{', Some('}'));
    // remove "/:param" segments
    remove_segments(&collapsed, ':', None)
}

/// Remove `/<marker>...` segments: `/{...}` (until the closing brace) or
/// `/:...` (until the next `/`).
fn remove_segments(s: &str, marker: char, closer: Option<char>) -> String {
    let chars: Vec<char> = s.chars().collect();
    let mut out = String::with_capacity(s.len());
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '/' && i + 1 < chars.len() && chars[i + 1] == marker {
            let mut j = i + 2;
            match closer {
                Some(close) => {
                    // /\{[^}]+\}/ — requires at least one char + the closer
                    let start = j;
                    while j < chars.len() && chars[j] != close {
                        j += 1;
                    }
                    if j < chars.len() && j > start {
                        i = j + 1; // skip past the closer
                        continue;
                    }
                }
                None => {
                    // /\/:[^/]+/ — at least one non-slash char
                    let start = j;
                    while j < chars.len() && chars[j] != '/' {
                        j += 1;
                    }
                    if j > start {
                        i = j;
                        continue;
                    }
                }
            }
        }
        out.push(chars[i]);
        i += 1;
    }
    out
}
