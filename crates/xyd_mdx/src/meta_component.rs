//! C-S4b: the composer's `component:` meta-component emit, ported for the
//! natively-supported case.
//!
//! The JS path (`mdMeta` -> a `@metaComponent`-registered transform ->
//! `componentLike`) resolves `@uniform` data, composes React description trees,
//! and serializes the whole thing back to a `<Atlas references={…} />`
//! `MdxJsxFlowElement`, which the mdx codegen tail turns into
//! `$jsx(Atlas, {references: …})`.
//!
//! Ported here: the source-free, prop-free meta-components, whose transforms
//! emit a single page node and drop the body prose (verified against the
//! committed `component-*` / `async-component-atlas` oracles):
//!
//! | frontmatter `component` | emitted node                | JS transform     |
//! |-------------------------|-----------------------------|------------------|
//! | `atlas` (no source)     | `<Atlas references={[]} />` | atlas, empty refs|
//! | `home`                  | `<PageHome />`              | home             |
//! | `bloghome`              | `<PageBlogHome />`          | bloghome         |
//! | `firstslide` (no props) | `<PageFirstSlide />`        | firstslide       |
//!
//! We reproduce the node directly; the standard `mdast -> hast -> swc ->
//! function-body` tail then yields the exact `$jsx(<Comp>, {…})` output. The
//! `component -> JSX name` map mirrors the composer's `@metaComponent(name,
//! ComponentName)` decorators (`@xyd-js/composer`).
//!
//! Everything else composer-backed (a component WITH a source or
//! `componentProps`, or a user-registered meta component) is routed to the JS
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
    // `capability::scan` has already filtered non-native components (and any
    // native one with a source / componentProps) to fallback, so an unmatched
    // component here is a belt-and-braces no-op.
    let Some(component) = capability::frontmatter_component(source) else {
        return false;
    };
    let Some(element) = meta_element(&component) else {
        return false;
    };

    if let Node::Root(root) = mdast {
        // These transforms drop the page's prose body entirely.
        root.children = vec![Node::MdxJsxFlowElement(element)];
        return true;
    }
    false
}

/// The `<Comp … />` node for a native meta component, or `None` if the name is
/// not one we emit. The `component -> JSX name` map mirrors the composer's
/// `@metaComponent` decorators.
fn meta_element(component: &str) -> Option<MdxJsxFlowElement> {
    let (name, attributes) = match component {
        // atlas with no source composes to empty references.
        "atlas" => ("Atlas", vec![attr_expr("references", "[]")]),
        "home" => ("PageHome", vec![]),
        "bloghome" => ("PageBlogHome", vec![]),
        "firstslide" => ("PageFirstSlide", vec![]),
        _ => return None,
    };
    Some(MdxJsxFlowElement {
        name: Some(name.to_string()),
        attributes,
        children: vec![],
        position: None,
    })
}

/// An expression attribute `name={<raw>}` whose raw JS text is parsed later by
/// `hast_util_to_swc` (e.g. `references={[]}`).
fn attr_expr(name: &str, raw: &str) -> AttributeContent {
    AttributeContent::Property(MdxJsxAttribute {
        name: name.to_string(),
        value: Some(AttributeValue::Expression(AttributeValueExpression {
            value: raw.to_string(),
            stops: vec![],
        })),
    })
}
