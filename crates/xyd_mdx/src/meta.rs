//! Frontmatter + toc exports.
//!
//! These live in xyd's JS remark chain (`remark-mdx-frontmatter` emits
//! `export const frontmatter`; `remarkMdxToc` emits `export const toc`), NOT in
//! mdxjs. In the function-body form they surface as `const frontmatter = {...}`
//! / `const toc = [...]` plus a `return { toc, frontmatter, default }`.
//!
//! Neither is rendered by the parity gate (Oracle B renders only `default`), so
//! exact fidelity here is not gate-load-bearing — but we build them faithfully:
//! frontmatter from the leading YAML block, toc from depth>=2 headings.

use crate::capability::split_frontmatter;

/// A collected heading, for the toc.
#[derive(Debug, Clone)]
pub struct Heading {
    pub depth: u8,
    pub id: String,
    pub value: String,
}

/// Build the `frontmatter` JS object literal from the leading `---` block.
/// JSON is a valid JS expression, so we serialize the parsed YAML as JSON.
pub fn frontmatter_literal(source: &str) -> String {
    let (front, _rest) = split_frontmatter(source);
    let Some(front) = front else {
        return "{}".to_string();
    };
    match serde_yaml::from_str::<serde_json::Value>(front) {
        Ok(serde_json::Value::Null) => "{}".to_string(),
        Ok(value) if value.is_object() => {
            serde_json::to_string(&value).unwrap_or_else(|_| "{}".into())
        }
        _ => "{}".to_string(),
    }
}

/// Escape a string for embedding in a double-quoted JS/JSON string literal.
fn js_string(s: &str) -> String {
    serde_json::to_string(s).unwrap_or_else(|_| "\"\"".into())
}

/// Build the `toc` JS array literal from collected headings, mirroring the
/// remarkMdxToc entry shape:
/// `{ depth, id, value, attributes: { hProperties: { id } }, children: [], maxTocDepth: undefined }`.
/// Applies the corpus config (minDepth = maxDepth = 2): only depth-2 headings.
pub fn toc_literal(headings: &[Heading], min_depth: u8, max_depth: u8) -> String {
    let entries: Vec<String> = headings
        .iter()
        .filter(|h| h.depth >= min_depth && h.depth <= max_depth)
        .map(|h| {
            format!(
                "{{ depth: {}, id: {}, value: {}, attributes: {{ hProperties: {{ id: {} }} }}, children: [], maxTocDepth: undefined }}",
                h.depth,
                js_string(&h.id),
                js_string(&h.value),
                js_string(&h.id),
            )
        })
        .collect();
    format!("[{}]", entries.join(", "))
}
