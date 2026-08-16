//! hast transforms ported from xyd's JS chain, applied between
//! `mdast_util_to_hast` and `hast_util_to_swc`.
//!
//! Gate-load-bearing for prose:
//!   * `mdHeadingId` / `rehypeHeading` — add `id` to `h1..h6` (github-slugger).
//!   * table-whitespace normalization — mdxjs's `mdast_util_to_hast` keeps the
//!     literal `"\n"` text nodes micromark emits between table structural
//!     elements; `@mdx-js/mdx` (mdast-util-to-hast) drops them. Strip them so the
//!     rendered React tree — and thus the SSR HTML — matches.
//!
//! Faithful-but-not-gated (Oracle B stubs drop these): `mdCodeRehype` embeds the
//! Rust-highlighted blob on `<pre>` (see `highlight_code_block`).

use mdxjs::hast::{Element, Node, PropertyValue};

use crate::meta::Heading;

/// github-slugger-compatible slugger with per-h1 reset (matches `mdHeadingId`).
pub struct Slugger {
    occurrences: std::collections::HashMap<String, usize>,
}

impl Slugger {
    pub fn new() -> Self {
        Self {
            occurrences: std::collections::HashMap::new(),
        }
    }

    pub fn reset(&mut self) {
        self.occurrences.clear();
    }

    /// Unique slug with `-1`, `-2`, … de-duplication (github-slugger semantics).
    pub fn slug(&mut self, value: &str) -> String {
        let base = slug_base(value);
        let mut result = base.clone();
        while self.occurrences.contains_key(&result) {
            let n = self.occurrences.get_mut(&base).unwrap();
            *n += 1;
            result = format!("{base}-{n}");
        }
        self.occurrences.insert(result.clone(), 0);
        result
    }
}

impl Default for Slugger {
    fn default() -> Self {
        Self::new()
    }
}

/// Base slug: lowercase, keep unicode alphanumerics + `_` + `-` + ` `, drop the
/// rest, then map spaces to `-`. Faithful approximation of github-slugger 2.0.0's
/// unicode blocklist for the ASCII/common cases xyd docs use.
pub fn slug_base(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        for lc in ch.to_lowercase() {
            if lc.is_alphanumeric() || lc == '_' || lc == '-' || lc == ' ' {
                out.push(if lc == ' ' { '-' } else { lc });
            }
        }
    }
    out
}

const TABLE_WS_PARENTS: [&str; 4] = ["table", "thead", "tbody", "tr"];

fn heading_depth(tag: &str) -> Option<u8> {
    match tag {
        "h1" => Some(1),
        "h2" => Some(2),
        "h3" => Some(3),
        "h4" => Some(4),
        "h5" => Some(5),
        "h6" => Some(6),
        _ => None,
    }
}

/// Concatenate the visible text of a slice of hast nodes (recursive).
fn text_of_children(children: &[Node]) -> String {
    children.iter().map(ToString::to_string).collect()
}

fn is_whitespace_text(node: &Node) -> bool {
    matches!(node, Node::Text(t) if t.value.chars().all(char::is_whitespace))
}

/// Insert or replace a string property at the FRONT of an element's property
/// list (so codegen emits it before `children`, matching the goldens' `{id, …}`).
fn set_string_prop_front(el: &mut Element, key: &str, value: String) {
    el.properties.retain(|(k, _)| k != key);
    el.properties
        .insert(0, (key.to_string(), PropertyValue::String(value)));
}

/// Apply the hast transforms in-place; returns the headings (for toc).
pub fn apply(root: &mut Node) -> Vec<Heading> {
    let mut slugger = Slugger::new();
    let mut headings = Vec::new();
    walk(root, &mut slugger, &mut headings);
    headings
}

fn walk(node: &mut Node, slugger: &mut Slugger, headings: &mut Vec<Heading>) {
    if let Node::Element(el) = node {
        // 1. Table-whitespace normalization: drop whitespace-only text children
        //    of table structural elements.
        if TABLE_WS_PARENTS.contains(&el.tag_name.as_str()) {
            el.children.retain(|c| !is_whitespace_text(c));
        }

        // 2. Heading ids (+ collect toc entries).
        if let Some(depth) = heading_depth(&el.tag_name) {
            if depth == 1 {
                slugger.reset();
            }
            let text = text_of_children(&el.children);
            let id = slugger.slug(&text);
            set_string_prop_front(el, "id", id.clone());
            headings.push(Heading {
                depth,
                id,
                value: text,
            });
        }
    }

    // 3. Recurse.
    if let Some(children) = node.children_mut() {
        for child in children.iter_mut() {
            walk(child, slugger, headings);
        }
    }
}
