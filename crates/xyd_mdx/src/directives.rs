//! `mdComponentDirective` port — the GENERIC directive→component path (C-S2
//! stage-1).
//!
//! Runs as an mdast transform BETWEEN `mdast_util_from_mdx` and
//! `mdast_util_to_hast`. The vendored forked markdown-rs parses `:::name{attrs}`
//! …`:::` container and `::name{attrs}` leaf directives into
//! `ContainerDirective` / `LeafDirective` mdast nodes (content captured as a
//! single raw `Text` child); this module rewrites the GENERIC ones into
//! `MdxJsxFlowElement` nodes — exactly what xyd's JS
//! `packages/xyd-content/.../mdComponentDirective.ts` does with
//! `getComponentName` + `componentProps`, minus the special handlers.
//!
//! Ported GENERIC directives (attributes → JSX attributes, content re-parsed as
//! nested flow and passed through as children):
//!   * containers: `callout`, `details`, `subtitle`, `guide-card`, `badge`,
//!     `grid`, `button`, `update`, `card`, `feature`, `atlas`
//!   * leaves: `atlas`, `card`, `color-scheme-button`
//!
//! DEFERRED to the JS pipeline (return `Err` → the page falls back), matching
//! the C-S2 remainder:
//!   * special handlers — `tabs` (mdNav), `steps` (mdSteps), `code-group`
//!     (mdCode), `table` (mdTable)
//!   * true `:::`-in-`:::` nesting (a converted directive whose re-parsed
//!     content contains another directive)
//!   * expression-valued attributes (`key={expr}`) — the `complexJSXPropsPollyfill`
//!     path; the `@uniform` attribute path is already caught earlier by the
//!     `@`-function pre-scan.

use markdown::mdast::{AttributeContent, AttributeValue, MdxJsxAttribute, MdxJsxFlowElement, Node};
use mdxjs::{mdast_util_from_mdx, Options};

/// Container directives that xyd routes through a dedicated (non-generic)
/// handler; unsupported by the stage-1 generic port → fall back.
const SPECIAL_CONTAINERS: [&str; 4] = ["tabs", "steps", "code-group", "table"];

/// Look up the component name for a container directive, mirroring
/// `supportedDirectives` + `getComponentName` for the GENERIC subset. Returns
/// `None` for special-handler names (`tabs`/`steps`/`code-group`/`table`) and
/// any name outside the map — both defer to the JS pipeline.
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
        .map(|(name, value)| {
            AttributeContent::Property(MdxJsxAttribute {
                name,
                value: Some(AttributeValue::Literal(value)),
            })
        })
        .collect()
}

/// True if `node` (or any descendant) is a directive node — used to detect
/// nesting inside a re-parsed container body (deferred to JS).
fn contains_directive(node: &Node) -> bool {
    if matches!(node, Node::ContainerDirective(_) | Node::LeafDirective(_)) {
        return true;
    }
    node.children()
        .is_some_and(|c| c.iter().any(contains_directive))
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

/// Convert every GENERIC directive in the tree to an `MdxJsxFlowElement`,
/// in-place. `Err(reason)` means the page uses a directive construct outside the
/// stage-1 generic scope (special handler / nesting / expression attribute /
/// unsupported name) and must fall back to the JS pipeline.
pub fn process(root: &mut Node, opts: &Options, source: &str) -> Result<(), String> {
    convert_node(root, opts, source)
}

fn convert_node(node: &mut Node, opts: &Options, source: &str) -> Result<(), String> {
    match node {
        Node::ContainerDirective(cd) => {
            let name = cd.name.clone();
            if SPECIAL_CONTAINERS.contains(&name.as_str()) {
                return Err(format!("directive special-handler `{name}`"));
            }
            let component = container_component(&name)
                .ok_or_else(|| format!("directive unsupported `{name}`"))?;
            // Prefer the position-sliced body (blank lines preserved); fall back
            // to the fork's collapsed raw `Text` child if the span is missing.
            let raw = container_inner_source(source, cd)
                .unwrap_or_else(|| container_raw_content(&cd.children));
            let children = reparse_content(&raw, opts)?;
            if children.iter().any(contains_directive) {
                return Err(format!("directive nesting inside `{name}`"));
            }
            let pairs = match &cd.attributes {
                Some(a) => parse_attributes(a)?,
                None => Vec::new(),
            };
            *node = Node::MdxJsxFlowElement(MdxJsxFlowElement {
                name: Some(component),
                attributes: build_attributes(pairs),
                children,
                position: None,
            });
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
                    convert_node(child, opts, source)?;
                }
            }
            Ok(())
        }
    }
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
        // special handlers / unknowns are not generically convertible.
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
        // expression-valued attribute → defer.
        assert!(parse_attributes("references={foo}").is_err());
    }
}
