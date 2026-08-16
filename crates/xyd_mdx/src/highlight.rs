//! `mdCodeRehype` port — inline syntax highlighting via `crates/xyd_highlight`
//! (no napi round-trip). Walks the hast, finds `<pre><code class="language-X">`,
//! runs the SAME Rust highlighter the JS pipeline reaches through `@xyd-js/native`,
//! and embeds `node.properties.highlighted = JSON.stringify(highlightedCode)` on
//! the `<pre>` — mirroring `packages/xyd-content/.../mdCodeRehype.ts`.
//!
//! Oracle B deliberately stubs `<pre>`/`<code>` and drops this blob (it pins the
//! blob only in Oracle A), so this step is faithful-but-not-gated: it must never
//! break the gate-critical `<pre><code class="language-X">raw</code></pre>`
//! structure, hence the defensive guards + `catch_unwind`.

use mdxjs::hast::{Element, Node, PropertyValue};

/// Embed highlighted-code JSON on every `<pre>` wrapping a language-tagged
/// `<code>`. In-place; failures are swallowed (the block still renders via its
/// className + raw text).
pub fn embed(root: &mut Node, theme_name: &str) {
    walk(root, theme_name);
}

fn walk(node: &mut Node, theme_name: &str) {
    if let Node::Element(el) = node {
        if el.tag_name == "pre" {
            if let Some((lang, value)) = code_child_lang_value(el) {
                if let Some(json) = highlight_json(&value, &lang, &lang, theme_name) {
                    // title first, then the highlighted blob — dropped by the
                    // Oracle B stub, pinned by Oracle A.
                    set_string_prop(el, "title", String::new());
                    set_string_prop(el, "highlighted", json);
                }
            }
        }
    }
    if let Some(children) = node.children_mut() {
        for child in children.iter_mut() {
            walk(child, theme_name);
        }
    }
}

/// If `pre`'s first child is a `<code class="language-X">`, return `(X, rawText)`.
fn code_child_lang_value(pre: &Element) -> Option<(String, String)> {
    let code = pre.children.first()?;
    let Node::Element(code_el) = code else {
        return None;
    };
    if code_el.tag_name != "code" {
        return None;
    }
    let lang = class_language(&code_el.properties)?;
    let value = code_el.children.iter().map(ToString::to_string).collect();
    Some((lang, value))
}

/// Extract `X` from a `className` containing `language-X`.
fn class_language(props: &[(String, PropertyValue)]) -> Option<String> {
    for (k, v) in props {
        if k != "className" {
            continue;
        }
        let classes: Vec<String> = match v {
            PropertyValue::SpaceSeparated(list) | PropertyValue::CommaSeparated(list) => {
                list.clone()
            }
            PropertyValue::String(s) => s.split_whitespace().map(str::to_string).collect(),
            PropertyValue::Boolean(_) => Vec::new(),
        };
        for c in classes {
            if let Some(lang) = c.strip_prefix("language-") {
                if !lang.is_empty() {
                    return Some(lang.to_string());
                }
            }
        }
    }
    None
}

fn highlight_json(value: &str, lang: &str, meta: &str, theme_name: &str) -> Option<String> {
    let value = value.to_string();
    let lang = lang.to_string();
    let meta = meta.to_string();
    let theme_name = theme_name.to_string();
    std::panic::catch_unwind(move || {
        let hc = xyd_highlight::highlighted_code(&value, &lang, &meta, &theme_name);
        serde_json::to_string(&hc).ok()
    })
    .ok()
    .flatten()
}

fn set_string_prop(el: &mut Element, key: &str, value: String) {
    el.properties.retain(|(k, _)| k != key);
    el.properties
        .push((key.to_string(), PropertyValue::String(value)));
}
