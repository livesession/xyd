//! C-S4b: the composer's `component:` meta-component emit, ported for the
//! natively-supported case.
//!
//! The JS path (`mdMeta` -> a `@metaComponent`-registered transform ->
//! `componentLike`) resolves `@uniform` data, composes React description trees,
//! and serializes the whole thing back to a `<Atlas references={…} />`
//! `MdxJsxFlowElement`, which the mdx codegen tail turns into
//! `$jsx(Atlas, {references: …})`.
//!
//! Ported here: `component: atlas` with NO `@uniform` source. The atlas
//! transform, given no references, drops the page's prose body and emits
//! `<Atlas references={[]} />` (verified against the committed
//! `async-component-atlas` oracle). We reproduce that node directly; the
//! standard `mdast -> hast -> swc -> function-body` tail then yields the exact
//! `$jsx(Atlas, {references: []})` output.
//!
//! Everything else composer-backed (`home`/`firstslide`/…, `atlas` WITH a
//! resolved source, or user-registered meta components) is routed to the JS
//! fallback by `capability::scan` and never reaches here.
//!
//! ## Why `atlas` WITH a source stays `fallback` (the deferred C-S4b tail)
//!
//! The emit mechanism for the full case is proven — `componentLike` serializes
//! the `AtlasProps` to a `<Atlas references={…}/>` JSX string, which the same
//! codegen tail lowers to `$jsx(Atlas, {references: …})`. The blocker is NOT the
//! serializer but an intentionally JS-only UPSTREAM: the resolved references
//! carry endpoint code `examples` (multi-language curl/fetch/python/go via
//! `@readme/oas-to-snippet`, then highlighted). The Rust openapi converter
//! deliberately does NOT generate endpoint examples (`xyd_openapi` returns
//! `examples: Default::default()` — "endpoint examples are a JS post-pass the
//! page flow never needs", see `crates/xyd_openapi/src/{fused,paths,xdocs}.rs`).
//! So a page whose atlas composition needs those examples cannot be reproduced
//! in Rust until `oas-to-snippet` is itself ported — a separate track. This is
//! the capability gate working as designed (fall back wholesale on a JS-only
//! upstream). Note the current Oracle B stub DROPS the references blob, so a
//! wrong-but-stub-matching `full` would pass — emitting incomplete references
//! here would be exactly the dishonest coverage the gate forbids, hence
//! `fallback`, not a rigged `full`.

use markdown::mdast::{
    AttributeContent, AttributeValue, AttributeValueExpression, MdxJsxAttribute, MdxJsxFlowElement,
    Node,
};

use crate::capability;

/// If the page selects a natively-emittable meta component, replace the body
/// with the composed node and return `true`. Otherwise leave the tree untouched
/// and return `false` (the caller keeps compiling the prose body).
///
/// Runs AFTER the raw-MDX guard (it legitimately introduces an
/// `MdxJsxFlowElement`, exactly like `directives::process`).
pub fn process(mdast: &mut Node, source: &str) -> bool {
    // C-S4b scope: only `component: atlas` (no source) is native. `capability`
    // has already filtered other components to fallback, so this is a belt-and-
    // braces check.
    if capability::frontmatter_component(source).as_deref() != Some("atlas") {
        return false;
    }

    let atlas = Node::MdxJsxFlowElement(empty_atlas());
    if let Node::Root(root) = mdast {
        // The no-source atlas transform drops the prose body entirely.
        root.children = vec![atlas];
        return true;
    }
    false
}

/// `<Atlas references={[]} />` — a flow JSX element with a single expression
/// attribute whose raw text (`[]`) is parsed by `hast_util_to_swc`.
fn empty_atlas() -> MdxJsxFlowElement {
    MdxJsxFlowElement {
        name: Some("Atlas".to_string()),
        attributes: vec![AttributeContent::Property(MdxJsxAttribute {
            name: "references".to_string(),
            value: Some(AttributeValue::Expression(AttributeValueExpression {
                value: "[]".to_string(),
                stops: vec![],
            })),
        })],
        children: vec![],
        position: None,
    }
}
