//! `outputVars` (`<<<name … <<<`) port — the bespoke output-variables fence.
//!
//! Runs as an mdast transform in `pipeline::compile_full`, AFTER the directive
//! pass. The vendored fork parses `<<<name[{attrs}]` … `<<<` into an
//! [`OutputVars`] mdast node (content captured raw as a single `Text` child, plus
//! a byte span); this module rewrites each such node into a plain `<div>`
//! (`MdxJsxFlowElement` with `name: "div"`) wrapping the RE-PARSED inner flow.
//!
//! Why a `<div>`: in xyd's JS whole-page pipeline the `outputVars` node survives
//! all the remark passes (`mdComposer` only reads it into `file.data.outputVars`,
//! which feeds the `atlas` meta-component — a source-backed page that already
//! falls back — and never removes the node). At `mdast-util-to-hast` the unknown
//! `outputVars` type hits the default handler, which wraps its children in a
//! `<div>`. So for a STANDALONE `<<<` page (the only shape that reaches `full`)
//! the visible output is exactly `<div>…code blocks…</div>`; the name/attributes
//! and the highlighted-examples blob are not rendered. This transform reproduces
//! that `<div>` faithfully; it deliberately does NOT compute the (invisible)
//! `vars.examples` blob, which has no rendered-HTML effect here and could not be
//! parity-verified (Oracle B drops it).
//!
//! Nested `:::code-group` (and other directives) inside the fence are converted
//! by delegating to [`directives::process`] on the re-parsed body — mirroring the
//! JS plugin order (`outputVars` parse → `mdComponentDirective`). Raw author MDX
//! inside the fence, or an un-ported directive, returns `Err` → the page falls
//! back honestly.

use markdown::mdast::{MdxJsxFlowElement, Node, OutputVars, Root};
use mdxjs::{mdast_util_from_mdx, Options};

use crate::directives;

/// Rewrite every `<<<` output-variables fence in the tree to a `<div>`, in-place.
/// `Err(reason)` means the fence body uses something still outside the port (raw
/// MDX / an un-ported directive) and the page must fall back. `source` is the
/// string the node positions index into (the original page).
pub fn process(root: &mut Node, opts: &Options, source: &str, theme: &str) -> Result<(), String> {
    convert_node(root, opts, source, theme)
}

fn convert_node(node: &mut Node, opts: &Options, source: &str, theme: &str) -> Result<(), String> {
    match node {
        Node::OutputVars(ov) => {
            // Prefer the position-sliced body (blank lines preserved); fall back
            // to the fork's collapsed raw `Text` child if the span is missing.
            let raw = inner_source(source, ov).unwrap_or_else(|| raw_content(&ov.children));

            // Re-parse the captured body as flow (the fork keeps it raw).
            let children = reparse(&raw, opts)?;

            // The top-level raw-MDX guard (`directives::has_raw_mdx`, run in the
            // pipeline before this transform) never looked INSIDE the fence (it
            // was a single raw `Text` node), so re-check the re-parsed body:
            // author JSX/expression/ESM inside a fence means the page needs the
            // full JS pipeline.
            if children.iter().any(directives::has_raw_mdx) {
                return Err("outputVars: raw mdx inside `<<<` fence".to_string());
            }

            // Convert nested `:::`/`::` directives (e.g. `:::code-group`) using
            // the directive port, on the RE-PARSED body so node positions align
            // with `raw` (not the original page).
            let mut wrap = Node::Root(Root {
                children,
                position: None,
            });
            directives::process(&mut wrap, opts, &raw, theme)?;
            let children = match wrap {
                Node::Root(r) => r.children,
                other => vec![other],
            };

            *node = Node::MdxJsxFlowElement(MdxJsxFlowElement {
                name: Some("div".to_string()),
                attributes: vec![],
                children,
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

/// Re-parse a fence body as flow. Returns the child nodes.
fn reparse(raw: &str, opts: &Options) -> Result<Vec<Node>, String> {
    let root = mdast_util_from_mdx(raw, opts).map_err(|e| format!("outputVars content: {e}"))?;
    match root {
        Node::Root(r) => Ok(r.children),
        other => Ok(vec![other]),
    }
}

/// Extract the raw body a fence captured (single `Text` child, per the fork).
/// Empty when the fence had no content lines. Used only as a fallback when byte
/// positions are unavailable; the fork collapses blank lines here, so the primary
/// path ([`inner_source`]) re-slices the original source instead.
fn raw_content(children: &[Node]) -> String {
    match children.first() {
        Some(Node::Text(t)) => t.value.clone(),
        _ => String::new(),
    }
}

/// Slice a fence's inner body out of the ORIGINAL source using its byte span,
/// preserving blank lines exactly. The span covers `<<<name…\n<body>\n<<<`; drop
/// the header line (up to the first `\n`) and the closing-fence line (from the
/// last `\n`). Returns `None` if the span is missing / malformed → caller falls
/// back to the collapsed raw text. Mirrors `directives::container_inner_source`.
fn inner_source(source: &str, node: &OutputVars) -> Option<String> {
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
    // the fence had no content lines (`<<<x\n<<<`) → empty body.
    let inner = match after_header.rfind('\n') {
        Some(nl) => &after_header[..nl],
        None => "",
    };
    Some(inner.to_string())
}
