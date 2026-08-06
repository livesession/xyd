//! The `rehype-katex` equivalent — Rust-native math rendering on the hast.
//!
//! With the `math_flow` + `math_text` parse constructs enabled (see
//! `pipeline::options`), the fork's `mdast_util_to_hast` lowers math to the
//! `mdast-util-math` shape `rehype-katex` consumes:
//!   - inline `$…$`   → `<code class="language-math math-inline">LATEX</code>`
//!   - block `$$…$$`  → `<pre><code class="language-math math-display">LATEX\n</code></pre>`
//!
//! This pass walks the hast, finds those nodes, renders their LaTeX to **MathML**
//! via `xyd_math` (pulldown-latex), parses the MathML into a `MathNode` tree, and
//! maps it onto mdxjs hast `Element` nodes — so math flows through the normal
//! `hast → swc → function-body` path and renders as real React `<math>` elements
//! (exactly how `rehype-katex` splices KaTeX's parsed HTML into the hast).
//!
//! Honest fallback: if `xyd_math` can't parse an expression (an unsupported KaTeX
//! macro), [`embed`] returns `Err` and the whole page defers to the JS pipeline —
//! never a wrong / `<merror>` render.
//!
//! Must run BEFORE `highlight::embed`, which would otherwise try to syntax-
//! highlight the `language-math` `<pre>`; this pass removes those nodes first.

use mdxjs::hast::{Element, Node, PropertyValue, Text};
use xyd_math::{latex_to_mathml, parse_mathml, MathDisplay, MathNode};

/// Render every `language-math` node in the tree to MathML in place. Returns
/// `Err(reason)` on the first expression `xyd_math` cannot render (→ the caller
/// falls back to the JS KaTeX pipeline).
pub fn embed(root: &mut Node) -> Result<(), String> {
    if let Some(children) = root.children_mut() {
        process_children(children)?;
    }
    Ok(())
}

fn process_children(children: &mut [Node]) -> Result<(), String> {
    for child in children.iter_mut() {
        if let Some(latex) = display_math_latex(child) {
            *child = render(&latex, MathDisplay::Block)?;
            continue;
        }
        if let Some(latex) = inline_math_latex(child) {
            *child = render(&latex, MathDisplay::Inline)?;
            continue;
        }
        if let Some(sub) = child.children_mut() {
            process_children(sub)?;
        }
    }
    Ok(())
}

/// Render LaTeX → MathML → hast. `Err` on an unsupported expression.
fn render(latex: &str, display: MathDisplay) -> Result<Node, String> {
    let mathml = latex_to_mathml(latex.trim(), display)
        .map_err(|e| format!("math: {e} — unsupported by the Rust renderer"))?;
    let node = parse_mathml(&mathml).map_err(|e| format!("math: {e}"))?;
    Ok(math_node_to_hast(&node))
}

/// If `node` is an inline-math `<code class="language-math math-inline">`, return
/// its LaTeX text.
fn inline_math_latex(node: &Node) -> Option<String> {
    let Node::Element(el) = node else { return None };
    if el.tag_name != "code" || !has_math_class(&el.properties, "math-inline") {
        return None;
    }
    Some(text_of(&el.children))
}

/// If `node` is a display-math `<pre>` wrapping a
/// `<code class="language-math math-display">`, return the LaTeX text.
fn display_math_latex(node: &Node) -> Option<String> {
    let Node::Element(pre) = node else {
        return None;
    };
    if pre.tag_name != "pre" {
        return None;
    }
    let code = pre.children.first()?;
    let Node::Element(code_el) = code else {
        return None;
    };
    if code_el.tag_name != "code" || !has_math_class(&code_el.properties, "math-display") {
        return None;
    }
    Some(text_of(&code_el.children))
}

/// Does the className carry both `language-math` and the given math marker class?
fn has_math_class(props: &[(String, PropertyValue)], marker: &str) -> bool {
    let mut has_lang = false;
    let mut has_marker = false;
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
            if c == "language-math" {
                has_lang = true;
            }
            if c == marker {
                has_marker = true;
            }
        }
    }
    has_lang && has_marker
}

fn text_of(children: &[Node]) -> String {
    children.iter().map(ToString::to_string).collect()
}

/// Map a parsed `MathNode` tree onto mdxjs hast so it renders as React elements.
fn math_node_to_hast(node: &MathNode) -> Node {
    match node {
        MathNode::Text(t) => Node::Text(Text {
            value: t.clone(),
            position: None,
        }),
        MathNode::Element {
            tag,
            attrs,
            children,
        } => {
            let properties = attrs.iter().filter_map(|(k, v)| map_attr(k, v)).collect();
            Node::Element(Element {
                tag_name: tag.clone(),
                properties,
                children: children.iter().map(math_node_to_hast).collect(),
                position: None,
            })
        }
    }
}

/// Map a MathML attribute to a hast property.
///
/// `class` → `className` (hast convention; `hast_util_to_swc` emits `className`,
/// React renders `class`). `style` is dropped: `hast_util_to_swc` emits it as a
/// raw string attribute which React rejects, and clean pulldown-latex output
/// never carries `style` (only `<merror>` does, and those are already caught as a
/// parse-error fallback upstream). All other MathML attributes
/// (`display`, `xmlns`, `movablelimits`, `stretchy`, `mathvariant`, …) pass
/// through verbatim — `prop_to_attr_name` forwards unknowns unchanged.
fn map_attr(key: &str, value: &str) -> Option<(String, PropertyValue)> {
    match key {
        "class" => Some((
            "className".to_string(),
            PropertyValue::SpaceSeparated(value.split_whitespace().map(str::to_string).collect()),
        )),
        "style" => None,
        _ => Some((key.to_string(), PropertyValue::String(value.to_string()))),
    }
}
