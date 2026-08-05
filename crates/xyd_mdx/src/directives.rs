//! `mdComponentDirective` port — the directive→component path (C-S2 stage-1 +
//! stage-1b).
//!
//! Runs as an mdast transform BETWEEN `mdast_util_from_mdx` and
//! `mdast_util_to_hast`. The vendored forked markdown-rs parses `:::name{attrs}`
//! …`:::` container and `::name{attrs}` leaf directives into
//! `ContainerDirective` / `LeafDirective` mdast nodes (content captured as a
//! single raw `Text` child); this module rewrites them into `MdxJsxFlowElement`
//! nodes — exactly what xyd's JS
//! `packages/xyd-content/.../mdComponentDirective.ts` does with
//! `getComponentName` + `componentProps` and the special handlers.
//!
//! Ported GENERIC directives (attributes → JSX attributes, content re-parsed as
//! nested flow and passed through as children — stage-1):
//!   * containers: `callout`, `details`, `subtitle`, `guide-card`, `badge`,
//!     `grid`, `button`, `update`, `card`, `feature`, `atlas`
//!   * leaves: `atlas`, `card`, `color-scheme-button`
//!
//! Ported SPECIAL handlers (stage-1b — each emits the SAME `MdxJsxFlowElement`
//! tree the JS `mdSteps`/`mdNav`/`mdCode` emit):
//!   * `steps` (mdSteps): list items → `Steps.Item` wrappers
//!   * `tabs` (mdNav): a link list → `Tabs` with `Tabs.Item` / `Tabs.Content`
//!   * `code-group` (mdCode): code fences → `DirectiveCodeGroup` with a
//!     `codeblocks` JSON attribute, each block highlighted via
//!     `xyd_highlight::highlighted_code` (the same engine the JS pipeline uses)
//!
//! Recursion: a converted container's re-parsed children are themselves run
//! through `convert_node`, so a directive nested inside another directive
//! (`:::code-group` / `:::callout` inside `:::::steps`) is converted too — as
//! long as the vendored fork's container captured the nested directive text and
//! the re-parse reproduces it faithfully.
//!
//! DEFERRED to the JS pipeline (return `Err` → the page falls back):
//!   * `table` (mdTable) — no `directive-table` fixture exists to pin parity,
//!     so it stays a fallback rather than shipping unverified.
//!   * `steps` items carrying `[…]`/`{…}` parameters (the `mdParameters` path) —
//!     conservatively deferred; no fixture exercises it.
//!   * expression-valued attributes (`key={expr}`) — the `complexJSXPropsPollyfill`
//!     path; the `@uniform` attribute path is already caught earlier by the
//!     `@`-function pre-scan.

use markdown::mdast::{
    AttributeContent, AttributeValue, Code, ListItem, MdxJsxAttribute, MdxJsxFlowElement, Node,
    Text,
};
use mdxjs::{mdast_util_from_mdx, Options};
use serde::Serialize;

/// Look up the component name for a container directive, mirroring
/// `supportedDirectives` + `getComponentName` for the GENERIC subset. Returns
/// `None` for special-handler names (`tabs`/`steps`/`code-group`/`table`) and
/// any name outside the map — special handlers are dispatched separately, and
/// unknown names defer to the JS pipeline.
fn container_component(name: &str) -> Option<String> {
    match name {
        // `true` in the JS map → PascalCase of the directive name.
        "details" | "callout" | "subtitle" | "atlas" | "badge" | "button" | "update" | "card"
        | "feature" => Some(to_pascal_case(name)),
        // string value in the JS map → used verbatim.
        "guide-card" => Some("GuideCard".to_string()),
        "grid" => Some("GridDecorator".to_string()),
        _ => None,
    }
}

/// Look up the component name for a leaf directive, mirroring
/// `supportedLeafDirectives` + `getComponentName`.
fn leaf_component(name: &str) -> Option<String> {
    match name {
        "atlas" | "card" => Some(to_pascal_case(name)),
        "color-scheme-button" => Some("ColorSchemeButton".to_string()),
        _ => None,
    }
}

/// Faithful port of `toPascalCase` from
/// `packages/xyd-content/.../component-directives/utils.ts`.
fn to_pascal_case(input: &str) -> String {
    // 1. Insert a space at lower→upper boundaries (camelCase split).
    let mut spaced = String::with_capacity(input.len() + 4);
    let chars: Vec<char> = input.chars().collect();
    for (i, &c) in chars.iter().enumerate() {
        if i > 0 {
            let prev = chars[i - 1];
            if prev.is_ascii_lowercase() && c.is_ascii_uppercase() {
                spaced.push(' ');
            }
        }
        spaced.push(c);
    }
    // 2. Non-alphanumeric → space. 3. Split, capitalize each word.
    spaced
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { ' ' })
        .collect::<String>()
        .split(' ')
        .filter(|w| !w.is_empty())
        .map(|word| {
            let mut it = word.chars();
            match it.next() {
                Some(first) => {
                    first.to_ascii_uppercase().to_string()
                        + it.as_str().to_ascii_lowercase().as_str()
                }
                None => String::new(),
            }
        })
        .collect()
}

/// Parse a raw remark-directive attributes string (the text between `{` and `}`)
/// into ordered `(name, value)` pairs. Handles the syntax xyd docs use:
/// `key="v"`, `key='v'`, `key=v`, bare `key`, `#id`, `.class` (classes joined by
/// space). Returns `Err` for an expression-valued attribute (`key={expr}`) — the
/// generic port defers that (`complexJSXPropsPollyfill` in JS).
fn parse_attributes(raw: &str) -> Result<Vec<(String, String)>, String> {
    let mut out: Vec<(String, String)> = Vec::new();
    let mut classes: Vec<String> = Vec::new();
    let bytes = raw.as_bytes();
    let mut i = 0usize;
    let is_name = |b: u8| b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b':');

    while i < bytes.len() {
        match bytes[i] {
            b if b.is_ascii_whitespace() => i += 1,
            b'#' => {
                i += 1;
                let start = i;
                while i < bytes.len() && is_name(bytes[i]) {
                    i += 1;
                }
                out.push(("id".to_string(), raw[start..i].to_string()));
            }
            b'.' => {
                i += 1;
                let start = i;
                while i < bytes.len() && is_name(bytes[i]) {
                    i += 1;
                }
                classes.push(raw[start..i].to_string());
            }
            b if is_name(b) => {
                let start = i;
                while i < bytes.len() && is_name(bytes[i]) {
                    i += 1;
                }
                let key = raw[start..i].to_string();
                // Optional `= value`.
                if i < bytes.len() && bytes[i] == b'=' {
                    i += 1;
                    if i >= bytes.len() {
                        out.push((key, String::new()));
                        break;
                    }
                    match bytes[i] {
                        q @ (b'"' | b'\'') => {
                            i += 1;
                            let vstart = i;
                            while i < bytes.len() && bytes[i] != q {
                                i += 1;
                            }
                            let value = raw[vstart..i].to_string();
                            if i < bytes.len() {
                                i += 1; // closing quote
                            }
                            out.push((key, value));
                        }
                        b'{' | b'<' => {
                            // Expression / JSX prop — defer to the JS path.
                            return Err(format!("directive expression attribute `{key}`"));
                        }
                        _ => {
                            let vstart = i;
                            while i < bytes.len() && !bytes[i].is_ascii_whitespace() {
                                i += 1;
                            }
                            let value = &raw[vstart..i];
                            if value.contains('{') || value.starts_with('<') {
                                return Err(format!("directive expression attribute `{key}`"));
                            }
                            out.push((key, value.to_string()));
                        }
                    }
                } else {
                    out.push((key, String::new()));
                }
            }
            _ => i += 1, // skip stray punctuation
        }
    }

    if !classes.is_empty() {
        out.push(("class".to_string(), classes.join(" ")));
    }
    Ok(out)
}

/// Build the `Vec<AttributeContent>` for a JSX element from parsed pairs.
fn build_attributes(pairs: Vec<(String, String)>) -> Vec<AttributeContent> {
    pairs
        .into_iter()
        .map(|(name, value)| attr(&name, &value))
        .collect()
}

/// A single literal JSX attribute (`name="value"`).
fn attr(name: &str, value: &str) -> AttributeContent {
    AttributeContent::Property(MdxJsxAttribute {
        name: name.to_string(),
        value: Some(AttributeValue::Literal(value.to_string())),
    })
}

/// True if `node` (or any descendant) is a RAW author MDX node (JSX / expression
/// / ESM). Prose and directive-only pages have none; their presence means the
/// page needs the full JS pipeline. Checked on the mdast BEFORE the directive
/// transform introduces its (legitimate) `MdxJsxFlowElement`s.
pub fn has_raw_mdx(node: &Node) -> bool {
    if matches!(
        node,
        Node::MdxJsxFlowElement(_)
            | Node::MdxJsxTextElement(_)
            | Node::MdxFlowExpression(_)
            | Node::MdxTextExpression(_)
            | Node::MdxjsEsm(_)
    ) {
        return true;
    }
    node.children().is_some_and(|c| c.iter().any(has_raw_mdx))
}

/// Re-parse a container directive's raw content string as nested flow (the fork
/// captures content raw; the JS `micromark-directive` subtokenizes it). Returns
/// the child nodes.
fn reparse_content(raw: &str, opts: &Options) -> Result<Vec<Node>, String> {
    let root = mdast_util_from_mdx(raw, opts).map_err(|e| format!("directive content: {e}"))?;
    match root {
        Node::Root(r) => Ok(r.children),
        other => Ok(vec![other]),
    }
}

/// Extract the raw content string a container directive captured (single `Text`
/// child, per the fork). Empty when the container had no content lines.
///
/// NOTE: the fork joins content lines with a single `\n`, so it DROPS blank
/// lines — a multi-paragraph body would collapse into one paragraph. Used only
/// as a fallback when byte positions are unavailable; the primary path
/// (`container_inner_source`) re-slices the original source to preserve blanks.
fn container_raw_content(children: &[Node]) -> String {
    match children.first() {
        Some(Node::Text(t)) => t.value.clone(),
        _ => String::new(),
    }
}

/// Slice a container directive's inner content out of the ORIGINAL source using
/// its byte span, preserving blank lines exactly (the fork's raw `Text` child
/// collapses them). The span covers `:::name…\n<content>\n:::`; drop the header
/// line (up to the first `\n`) and the closing-fence line (from the last `\n`).
/// Returns `None` if the span is missing or malformed → caller falls back to the
/// collapsed raw text.
fn container_inner_source(
    source: &str,
    node: &markdown::mdast::ContainerDirective,
) -> Option<String> {
    let pos = node.position.as_ref()?;
    let start = pos.start.offset;
    let end = pos.end.offset;
    if start >= end || end > source.len() {
        return None;
    }
    let region = &source[start..end];
    let header_nl = region.find('\n')?;
    let after_header = &region[header_nl + 1..];
    // Everything up to the closing-fence line. When there's no interior newline
    // the container had no content lines (`:::x\n:::`) → empty body.
    let inner = match after_header.rfind('\n') {
        Some(nl) => &after_header[..nl],
        None => "",
    };
    Some(inner.to_string())
}

/// Convert every directive in the tree to an `MdxJsxFlowElement`, in-place.
/// `Err(reason)` means the page uses a directive construct still outside the
/// port (deferred special handler / step parameters / expression attribute /
/// unsupported name) and must fall back to the JS pipeline. `source` is the
/// source string that `root`'s node positions index into (the original page for
/// the top-level call, or a re-parsed container body for nested calls).
pub fn process(root: &mut Node, opts: &Options, source: &str, theme: &str) -> Result<(), String> {
    convert_node(root, opts, source, theme)
}

fn convert_node(node: &mut Node, opts: &Options, source: &str, theme: &str) -> Result<(), String> {
    match node {
        Node::ContainerDirective(cd) => {
            let name = cd.name.clone();
            let attrs_raw = cd.attributes.clone();
            // Prefer the position-sliced body (blank lines preserved); fall back
            // to the fork's collapsed raw `Text` child if the span is missing.
            let raw = container_inner_source(source, cd)
                .unwrap_or_else(|| container_raw_content(&cd.children));
            // `cd` borrow ends here — name / attrs_raw / raw are owned.
            let replacement = match name.as_str() {
                "steps" => build_steps(attrs_raw.as_deref(), &raw, opts, theme)?,
                "tabs" => build_nav(attrs_raw.as_deref(), &raw, opts, theme)?,
                "code-group" => build_code(attrs_raw.as_deref(), &raw, opts, theme)?,
                "table" => return Err("directive special-handler `table`".to_string()),
                _ => {
                    let component = container_component(&name)
                        .ok_or_else(|| format!("directive unsupported `{name}`"))?;
                    let mut children = reparse_content(&raw, opts)?;
                    // Recurse so a directive nested in this container's body is
                    // converted too (positions index into `raw`).
                    for child in children.iter_mut() {
                        convert_node(child, opts, &raw, theme)?;
                    }
                    let pairs = match &attrs_raw {
                        Some(a) => parse_attributes(a)?,
                        None => Vec::new(),
                    };
                    MdxJsxFlowElement {
                        name: Some(component),
                        attributes: build_attributes(pairs),
                        children,
                        position: None,
                    }
                }
            };
            *node = Node::MdxJsxFlowElement(replacement);
            Ok(())
        }
        Node::LeafDirective(ld) => {
            let name = ld.name.clone();
            let component = leaf_component(&name)
                .ok_or_else(|| format!("directive unsupported leaf `{name}`"))?;
            let pairs = match &ld.attributes {
                Some(a) => parse_attributes(a)?,
                None => Vec::new(),
            };
            *node = Node::MdxJsxFlowElement(MdxJsxFlowElement {
                name: Some(component),
                attributes: build_attributes(pairs),
                children: vec![],
                position: None,
            });
            Ok(())
        }
        _ => {
            if let Some(children) = node.children_mut() {
                for child in children.iter_mut() {
                    convert_node(child, opts, source, theme)?;
                }
            }
            Ok(())
        }
    }
}

/// Port of `mdSteps` (`:::steps`). Each list item becomes a `Steps.Item` wrapping
/// the item's own children; non-list children pass through. Component name is
/// `getComponentName("steps", supportedDirectives)` = `"Steps"`.
fn build_steps(
    attrs_raw: Option<&str>,
    raw: &str,
    opts: &Options,
    theme: &str,
) -> Result<MdxJsxFlowElement, String> {
    const COMPONENT: &str = "Steps";
    let outer = match attrs_raw {
        Some(a) => build_attributes(parse_attributes(a)?),
        None => Vec::new(),
    };

    let mut steps: Vec<Node> = Vec::new();
    for child in reparse_content(raw, opts)? {
        if let Node::List(list) = child {
            for item in list.children {
                if let Node::ListItem(li) = item {
                    // The `mdParameters` path (leading `[…]`/`{…}` on a single
                    // text step) is not ported — defer that page honestly.
                    if step_has_params(&li) {
                        return Err("directive steps parameter".to_string());
                    }
                    let mut item_children = li.children;
                    for c in item_children.iter_mut() {
                        convert_node(c, opts, raw, theme)?;
                    }
                    steps.push(Node::MdxJsxFlowElement(MdxJsxFlowElement {
                        name: Some(format!("{COMPONENT}.Item")),
                        attributes: Vec::new(),
                        children: item_children,
                        position: None,
                    }));
                }
                // A list contains only list items; anything else is dropped,
                // matching the JS `.map(...).flat()` (non-listItem → undefined).
            }
        } else {
            let mut child = child;
            convert_node(&mut child, opts, raw, theme)?;
            steps.push(child);
        }
    }

    Ok(MdxJsxFlowElement {
        name: Some(COMPONENT.to_string()),
        attributes: outer,
        children: steps,
        position: None,
    })
}

/// True when a list item's leading block is a paragraph with a single text child
/// that carries `[…]`/`{…}` parameters — the `mdParameters` branch of `mdSteps`,
/// which this port defers (fall back).
fn step_has_params(li: &ListItem) -> bool {
    if let Some(Node::Paragraph(p)) = li.children.first() {
        if p.children.len() == 1 {
            if let Some(Node::Text(t)) = p.children.first() {
                return t.value.contains('[') || t.value.contains('{');
            }
        }
    }
    false
}

/// Port of `mdNav` (`:::tabs`). A list of links becomes `Tabs.Item` labels plus
/// (initially empty) `Tabs.Content` blocks; children are `[...items, ...contents]`.
/// Component name is `getComponentName("tabs", supportedDirectives)` = `"Tabs"`.
fn build_nav(
    attrs_raw: Option<&str>,
    raw: &str,
    opts: &Options,
    theme: &str,
) -> Result<MdxJsxFlowElement, String> {
    const COMPONENT: &str = "Tabs";
    let outer = match attrs_raw {
        Some(a) => build_attributes(parse_attributes(a)?),
        None => Vec::new(),
    };

    let mut items: Vec<Node> = Vec::new();
    let mut contents: Vec<Node> = Vec::new();

    for child in reparse_content(raw, opts)? {
        let Node::List(list) = child else { continue };
        for item in list.children {
            let Node::ListItem(li) = item else { continue };
            // Extract the leading link (value + label) without holding a borrow
            // across the `li.children` move below.
            let extracted = tab_link(&li);
            let Some((tab_value, tab_label)) = extracted? else {
                continue;
            };

            items.push(tabs_item(COMPONENT, &tab_value, &tab_label));

            // Tab content = everything after the first (link) block.
            let mut rest: Vec<Node> = li.children.into_iter().skip(1).collect();
            for c in rest.iter_mut() {
                convert_node(c, opts, raw, theme)?;
            }
            contents.push(tabs_content(COMPONENT, &tab_value, rest));
        }
    }

    let mut children = items;
    children.extend(contents);

    Ok(MdxJsxFlowElement {
        name: Some(COMPONENT.to_string()),
        attributes: outer,
        children,
        position: None,
    })
}

/// Pull `(tabValue, tabLabel)` from a tab list item's leading `[label](url)`
/// link. `Ok(None)` = not a link list item (skip, matching the JS early return);
/// `Err` = a link whose label is not a plain text node (unported → fall back).
fn tab_link(li: &ListItem) -> Result<Option<(String, String)>, String> {
    let Some(Node::Paragraph(p)) = li.children.first() else {
        return Ok(None);
    };
    let Some(Node::Link(link)) = p.children.first() else {
        return Ok(None);
    };
    if link.url.is_empty() {
        return Ok(None);
    }
    // `link.url.startsWith('#') ? url : url.split(" ").join("&")`.
    let tab_value = if link.url.starts_with('#') {
        link.url.clone()
    } else {
        link.url.split(' ').collect::<Vec<_>>().join("&")
    };
    let tab_label = match link.children.first() {
        Some(Node::Text(t)) => t.value.clone(),
        _ => return Err("directive tabs link label not plain text".to_string()),
    };
    Ok(Some((tab_value, tab_label)))
}

fn tabs_item(component: &str, value: &str, label: &str) -> Node {
    Node::MdxJsxFlowElement(MdxJsxFlowElement {
        name: Some(format!("{component}.Item")),
        attributes: vec![attr("value", value), attr("href", value)],
        children: vec![Node::Text(Text {
            value: label.to_string(),
            position: None,
        })],
        position: None,
    })
}

fn tabs_content(component: &str, value: &str, children: Vec<Node>) -> Node {
    Node::MdxJsxFlowElement(MdxJsxFlowElement {
        name: Some(format!("{component}.Content")),
        attributes: vec![attr("value", value)],
        children,
        position: None,
    })
}

/// One `codeblocks[]` entry, field order matching the JS
/// `{ value, lang, meta, highlighted }`.
#[derive(Serialize)]
struct CodeBlockEntry {
    value: String,
    lang: String,
    meta: String,
    highlighted: serde_json::Value,
}

/// Port of `mdCode` (`:::code-group`). Each fenced code block is highlighted via
/// the inline Rust highlighter (the same engine the JS pipeline reaches through
/// `@xyd-js/native`) and collected into a `codeblocks` JSON attribute; children
/// are empty. Component name is `"DirectiveCodeGroup"`.
fn build_code(
    attrs_raw: Option<&str>,
    raw: &str,
    opts: &Options,
    theme: &str,
) -> Result<MdxJsxFlowElement, String> {
    const COMPONENT: &str = "DirectiveCodeGroup";
    let pairs = match attrs_raw {
        Some(a) => parse_attributes(a)?,
        None => Vec::new(),
    };
    // `description = node.attributes?.title || ''`.
    let description = pairs
        .iter()
        .find(|(k, _)| k == "title")
        .map(|(_, v)| v.clone())
        .unwrap_or_default();

    // Content is captured raw; re-parse to reach the `code` nodes.
    let mut codeblocks: Vec<CodeBlockEntry> = Vec::new();
    for child in reparse_content(raw, opts)? {
        if let Node::Code(code) = child {
            let Code {
                value, lang, meta, ..
            } = code;
            let lang = lang.unwrap_or_default();
            let meta = meta.unwrap_or_default();
            // `highlight({ ..., meta: meta || lang || "" })`.
            let hl_meta = if !meta.is_empty() {
                meta.clone()
            } else if !lang.is_empty() {
                lang.clone()
            } else {
                String::new()
            };
            let highlighted = highlight_block(&value, &lang, &hl_meta, theme);
            codeblocks.push(CodeBlockEntry {
                value,
                lang,
                meta,
                highlighted,
            });
        }
    }

    let codeblocks_json = serde_json::to_string(&codeblocks).unwrap_or_else(|_| "[]".to_string());

    let mut attributes = build_attributes(pairs);
    attributes.push(attr("description", &description));
    attributes.push(attr("codeblocks", &codeblocks_json));

    Ok(MdxJsxFlowElement {
        name: Some(COMPONENT.to_string()),
        attributes,
        children: Vec::new(),
        position: None,
    })
}

/// Highlight one code block via `xyd_highlight`, returning the codehike-shaped
/// object as a JSON value. Guarded like `highlight::embed` — a failure yields
/// `null` rather than aborting the page (Oracle B drops this blob anyway).
fn highlight_block(value: &str, lang: &str, meta: &str, theme: &str) -> serde_json::Value {
    let (v, l, m, t) = (
        value.to_string(),
        lang.to_string(),
        meta.to_string(),
        theme.to_string(),
    );
    std::panic::catch_unwind(move || {
        let hc = xyd_highlight::highlighted_code(&v, &l, &m, &t);
        serde_json::to_value(hc).unwrap_or(serde_json::Value::Null)
    })
    .unwrap_or(serde_json::Value::Null)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pascal_case_matches_js() {
        assert_eq!(to_pascal_case("callout"), "Callout");
        assert_eq!(to_pascal_case("details"), "Details");
        assert_eq!(to_pascal_case("subtitle"), "Subtitle");
        assert_eq!(to_pascal_case("color-scheme-button"), "ColorSchemeButton");
        assert_eq!(to_pascal_case("guide-card"), "GuideCard");
    }

    #[test]
    fn component_lookup() {
        assert_eq!(container_component("callout").as_deref(), Some("Callout"));
        assert_eq!(container_component("details").as_deref(), Some("Details"));
        assert_eq!(
            container_component("guide-card").as_deref(),
            Some("GuideCard")
        );
        assert_eq!(
            container_component("grid").as_deref(),
            Some("GridDecorator")
        );
        // special handlers / unknowns are not GENERICALLY convertible (they are
        // dispatched by name in `convert_node`).
        assert_eq!(container_component("tabs"), None);
        assert_eq!(container_component("steps"), None);
        assert_eq!(container_component("code-group"), None);
        assert_eq!(container_component("table"), None);
        assert_eq!(container_component("nope"), None);
        assert_eq!(leaf_component("atlas").as_deref(), Some("Atlas"));
        assert_eq!(
            leaf_component("color-scheme-button").as_deref(),
            Some("ColorSchemeButton")
        );
    }

    #[test]
    fn attributes_parse() {
        assert_eq!(
            parse_attributes(r#"kind="warning""#).unwrap(),
            vec![("kind".to_string(), "warning".to_string())]
        );
        assert_eq!(
            parse_attributes(r#"label="Show more""#).unwrap(),
            vec![("label".to_string(), "Show more".to_string())]
        );
        assert_eq!(
            parse_attributes(r#"title="install""#).unwrap(),
            vec![("title".to_string(), "install".to_string())]
        );
        // expression-valued attribute → defer.
        assert!(parse_attributes("references={foo}").is_err());
    }
}
