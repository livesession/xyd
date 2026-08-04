//! Pure cores of the built-in uniform plugins — ports of
//! packages/xyd-uniform/src/plugins/{pluginNavigation,pluginJsonView}.ts.
//! The JS closure wrappers (the `UniformPlugin` defer contract) stay JS; these
//! functions take the full `Reference[]` and return the deferred output.

use serde_json::{Map, Value};

use crate::jsrt::{is_js_whitespace, node_path_join};

// ---------------------------------------------------------------------------
// pluginJsonView
// ---------------------------------------------------------------------------

/// Port of the pluginJsonView per-ref visitor + defer: one formatted
/// JSON-with-comments view string per Reference. Byte-exact contract
/// (the oracle compares strings with toStrictEqual).
pub fn plugin_json_view(references: &[Value]) -> Vec<String> {
    references.iter().map(json_view_for_reference).collect()
}

fn json_view_for_reference(reference: &Value) -> String {
    let mut lines: Vec<String> = vec!["{".to_string()];

    let empty: Vec<Value> = Vec::new();
    let definitions = reference
        .get("definitions")
        .and_then(|d| d.as_array())
        .unwrap_or(&empty);

    for def in definitions {
        let props = def
            .get("properties")
            .and_then(|p| p.as_array())
            .unwrap_or(&empty);
        for (index, prop) in props.iter().enumerate() {
            let name = prop.get("name").and_then(|n| n.as_str()).unwrap_or("");
            // `prop.examples?.[0] || ''` — JS indexing works on BOTH arrays
            // and strings (first CHARACTER); falsy → ''.
            let value = sanitize(&example_at(prop.get("examples"), 0));
            // `prop.examples && prop.examples.length > 1` — array length or
            // string length.
            let comment = if examples_len(prop.get("examples")) > 1 {
                format!(
                    " // or \"{}\"",
                    sanitize(&example_at(prop.get("examples"), 1))
                )
            } else {
                String::new()
            };
            let is_last = index == props.len() - 1;
            let comma = if is_last { "" } else { "," };
            lines.push(format!("    \"{name}\": \"{value}\"{comma}{comment}"));
        }
    }

    lines.push("}".to_string());
    lines.join("\n")
}

/// `examples?.[i]` where examples is `string | string[]` — string indexing
/// yields the i-th CHARACTER (a JS quirk the oracle may encode).
fn example_at(examples: Option<&Value>, i: usize) -> String {
    match examples {
        Some(Value::Array(arr)) => arr
            .get(i)
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        Some(Value::String(s)) => s.chars().nth(i).map(|c| c.to_string()).unwrap_or_default(),
        _ => String::new(),
    }
}

fn examples_len(examples: Option<&Value>) -> usize {
    match examples {
        Some(Value::Array(arr)) => arr.len(),
        Some(Value::String(s)) => s.chars().count(),
        _ => 0,
    }
}

/// `/^"|"$|[^a-zA-Z0-9\s\-_.,:/@#=;+()]/g` — `"` is itself outside the
/// allowed class, so the net effect is: keep only chars in the class.
fn sanitize(input: &str) -> String {
    input
        .chars()
        .filter(|&c| {
            c.is_ascii_alphanumeric()
                || is_js_whitespace(c)
                || matches!(
                    c,
                    '-' | '_' | '.' | ',' | ':' | '/' | '@' | '#' | '=' | ';' | '+' | '(' | ')'
                )
        })
        .collect()
}

// ---------------------------------------------------------------------------
// pluginNavigation
// ---------------------------------------------------------------------------

const DEFAULT_VIRTUAL_FOLDER: &str = ".xyd/.cache/.content";

#[derive(Default)]
struct GroupNode {
    /// insertion-ordered subgroups
    groups: Vec<(String, GroupNode)>,
    /// insertion-ordered page set (JS Set semantics)
    pages: Vec<String>,
}

impl GroupNode {
    fn child(&mut self, name: &str) -> &mut GroupNode {
        if let Some(pos) = self.groups.iter().position(|(n, _)| n == name) {
            return &mut self.groups[pos].1;
        }
        self.groups.push((name.to_string(), GroupNode::default()));
        let last = self.groups.len() - 1;
        &mut self.groups[last].1
    }

    fn add_page(&mut self, page: &str) {
        if !self.pages.iter().any(|p| p == page) {
            self.pages.push(page.to_string());
        }
    }
}

pub struct NavigationOutput {
    /// pagePath -> { title } (MetadataMap)
    pub page_front_matter: Map<String, Value>,
    /// Sidebar[] — leaves are `{virtual, page}` objects, or plain strings in
    /// store mode.
    pub sidebar: Vec<Value>,
}

/// Port of pluginNavigation: `settings` is only read for
/// `engine.uniform.store`; `url_prefix` mirrors options.urlPrefix.
/// Returns Err on a string-valued `context.group` (the JS impl throws).
pub fn plugin_navigation(
    settings: &Value,
    url_prefix: &str,
    references: &[Value],
) -> Result<NavigationOutput, String> {
    let mut page_front_matter: Map<String, Value> = Map::new();
    let mut root = GroupNode::default();

    for reference in references {
        let canonical = reference
            .get("canonical")
            .and_then(|c| c.as_str())
            .unwrap_or("");
        let page_path = node_path_join(&[url_prefix, canonical]);
        let title = reference.get("title").cloned().unwrap_or(Value::Null);

        // `let group = dataCtx?.group || []` — NOTE: the JS `if (!group)`
        // defaultGroup fallback is dead code ([] is truthy), so a ref without
        // a group gets frontmatter but NO sidebar entry. Preserved.
        let group_val = reference.get("context").and_then(|c| c.get("group"));
        if let Some(Value::String(_)) = group_val {
            return Err("group as string is not supported yet".to_string());
        }
        let empty: Vec<Value> = Vec::new();
        let group: &Vec<Value> = match group_val {
            Some(Value::Array(arr)) => arr,
            _ => &empty,
        };

        // (JS logs console.error on duplicate pagePath, then overwrites.)
        let mut fm = Map::new();
        fm.insert("title".into(), title);
        page_front_matter.insert(page_path.clone(), Value::Object(fm));

        let mut node = &mut root;
        let len = group.len();
        for (i, group_name) in group.iter().enumerate() {
            // JS coerces via object keys — group entries are strings in
            // practice; non-strings would become their JS string form.
            let name = match group_name {
                Value::String(s) => s.clone(),
                other => other.to_string(),
            };
            node = node.child(&name);
            if i == len - 1 {
                node.add_page(&page_path);
            }
        }
    }

    let store_mode = settings
        .get("engine")
        .and_then(|e| e.get("uniform"))
        .and_then(|u| u.get("store"))
        .map(|s| crate::jsrt::truthy(Some(s)))
        .unwrap_or(false);

    Ok(NavigationOutput {
        page_front_matter,
        sidebar: group_maps_to_sidebar(&root, store_mode),
    })
}

fn group_maps_to_sidebar(node: &GroupNode, store_mode: bool) -> Vec<Value> {
    let mut nav: Vec<Value> = Vec::new();

    // NOTE: JS iterates Object.keys(groupMaps) — array-index-like group names
    // would sort first there. Group names here come from context.group values
    // (tag/human names); insertion order matches for all real inputs, and the
    // fixtures gate this.
    for (group_name, current) in &node.groups {
        let mut pages: Vec<Value> = Vec::new();
        for page in &current.pages {
            if store_mode {
                pages.push(Value::String(page.clone()));
            } else {
                let mut o = Map::new();
                o.insert(
                    "virtual".into(),
                    Value::String(node_path_join(&[DEFAULT_VIRTUAL_FOLDER, page])),
                );
                o.insert("page".into(), Value::String(page.clone()));
                pages.push(Value::Object(o));
            }
        }

        // Direct pages first, then subgroups, under the same group.
        let sub_groups = group_maps_to_sidebar(current, store_mode);
        pages.extend(sub_groups);

        let mut entry = Map::new();
        entry.insert("group".into(), Value::String(group_name.clone()));
        entry.insert("pages".into(), Value::Array(pages));
        nav.push(Value::Object(entry));
    }

    nav
}
