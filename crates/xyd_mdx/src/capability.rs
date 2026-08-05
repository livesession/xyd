//! Per-page capability gate (cheap source pre-scan).
//!
//! A page qualifies for the Rust fast path (`full`) only when it uses none of
//! the constructs still owned by xyd's JS plugin chain: the JS-only
//! `@`-functions (`@uniform`/`@importCode`),
//! `component:`/`uniform:`/`openapi:`/`graphql:` frontmatter, math (needs
//! rehype-katex), or mermaid/graphviz fences (need the JS rehype). Anything
//! matched here returns `fallback` — a sentinel telling the JS caller to run
//! `ContentFS.compileContent` unchanged.
//!
//! C-S3 note: `@include`/`@changelog` are NO LONGER pre-scanned here — they are
//! ported by `functions::process` (run inside `pipeline::compile_full`), which
//! reads + splices / builds `Update` nodes and returns `Err` → `fallback` only
//! when a target itself is unsupported (external URL, missing file, raw MDX,
//! nested unported directive/`@uniform`, …).
//!
//! C-S2 note: `:::`/`::` directives are NO LONGER decided here. The generic
//! directive port needs the parsed mdast to tell a convertible directive
//! (`callout`, `details`, …) from a deferred one (special handler, nesting,
//! expression attribute), so that decision moved into `directives::process`
//! (run inside `pipeline::compile_full`), which returns `Err` → `fallback` for
//! the deferred cases. The `@`-function pre-scan still catches the `@uniform`
//! attribute path (e.g. `::atlas{references="@uniform(…)"}`) before parsing.

/// Reason a page fell back (for diagnostics / honest coverage reporting).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Fallback {
    Function,
    FrontmatterComponent,
    Math,
    Diagram,
}

impl Fallback {
    pub fn as_str(&self) -> &'static str {
        match self {
            Fallback::Function => "function",
            Fallback::FrontmatterComponent => "frontmatter-component",
            Fallback::Math => "math",
            Fallback::Diagram => "diagram",
        }
    }
}

/// Split leading `---\n...\n---` frontmatter block off the source.
/// Returns `(Some(frontmatter_body), rest)` or `(None, whole)`.
pub fn split_frontmatter(source: &str) -> (Option<&str>, &str) {
    // Frontmatter must start at byte 0 with `---` followed by a newline.
    let after_open = if let Some(rest) = source.strip_prefix("---\n") {
        rest
    } else if let Some(rest) = source.strip_prefix("---\r\n") {
        rest
    } else {
        return (None, source);
    };
    // Find the closing fence: a line that is exactly `---`.
    let mut idx = 0usize;
    for line in after_open.split_inclusive('\n') {
        let trimmed = line.trim_end_matches(['\r', '\n']);
        if trimmed == "---" {
            let body = &after_open[..idx];
            let rest = &after_open[idx + line.len()..];
            return (Some(body), rest);
        }
        idx += line.len();
    }
    (None, source)
}

/// The composer meta-components that emit a deterministic, source-free page node
/// (`component` -> JSX component name). Ported natively by `meta_component`.
pub const NATIVE_META_COMPONENTS: [&str; 4] = ["atlas", "home", "bloghome", "firstslide"];

/// Scan the leading frontmatter block for composer/atlas keys that must fall
/// back (they need the JS composer meta-component registry).
///
/// C-S4b: a native meta-component page — `component` in
/// [`NATIVE_META_COMPONENTS`] with NO `@uniform` source
/// (`uniform`/`openapi`/`graphql`/`mcp`/`cli`) and NO `componentProps` — is
/// emitted directly (`atlas` -> `<Atlas references={[]}/>`, `home` ->
/// `<PageHome/>`, `bloghome` -> `<PageBlogHome/>`, `firstslide` ->
/// `<PageFirstSlide/>`, body prose dropped), so it is eligible for `full`.
/// Everything else composer-backed stays `fallback`:
///   - a source key (needs the converters, and for atlas the JS-only
///     `oas-to-snippet` endpoint examples);
///   - `componentProps` (the props->JSX serializer is the deferred tail; for
///     `firstslide` this also covers the `rightContent` nested-MDX compile);
///   - any other/user component (needs the JS registry).
fn frontmatter_forces_fallback(front: &str) -> bool {
    let mut component: Option<String> = None;
    let mut has_source = false;
    let mut has_component_props = false;
    for raw in front.lines() {
        let line = raw.trim_start();
        // Only inspect top-level keys (no leading indentation collapse needed —
        // these xyd keys are always top-level; nested `componentProps:` children
        // are indented and skipped here).
        if raw != line {
            continue;
        }
        let mut parts = line.splitn(2, ':');
        let key = parts.next().unwrap_or("").trim();
        match key {
            "component" => {
                let val = parts.next().unwrap_or("").trim();
                component = Some(val.trim_matches(['"', '\'']).to_string());
            }
            "uniform" | "openapi" | "graphql" | "mcp" | "cli" => has_source = true,
            "componentProps" => has_component_props = true,
            _ => {}
        }
    }
    match component.as_deref() {
        // A native meta component with no source and no props.
        Some(c) if NATIVE_META_COMPONENTS.contains(&c) && !has_source && !has_component_props => {
            false
        }
        // Any explicit component (with source/props, or user-registered) is
        // composer-backed.
        Some(_) => true,
        // No component key: a lone uniform/openapi/graphql/mcp/cli still forces
        // fallback.
        None => has_source,
    }
}

/// Extract the top-level `component:` value from frontmatter (quotes stripped),
/// if present. Drives the C-S4b native meta-component emit in the pipeline.
pub fn frontmatter_component(source: &str) -> Option<String> {
    let (front, _) = split_frontmatter(source);
    let front = front?;
    for raw in front.lines() {
        let line = raw.trim_start();
        if raw != line {
            continue;
        }
        let mut parts = line.splitn(2, ':');
        if parts.next().unwrap_or("").trim() == "component" {
            let val = parts.next().unwrap_or("").trim().trim_matches(['"', '\'']);
            if !val.is_empty() {
                return Some(val.to_string());
            }
        }
    }
    None
}

/// True when the body contains an inline/flow math run (`$$...$$` or single-`$`
/// inline math). Conservative: single `$` runs with non-space content between
/// dollars count as math (matches remark-math's single-dollar default). A rare
/// prose dollar false-positive simply defers that page to the (correct) JS path.
fn has_math(body: &str) -> bool {
    if body.contains("$$") {
        return true;
    }
    // Inline math: `$` <non-space> ... `$` on a single logical run.
    let bytes = body.as_bytes();
    let mut i = 0usize;
    while i < bytes.len() {
        if bytes[i] == b'$' {
            // opening dollar must be followed by a non-space, non-dollar char
            if let Some(&next) = bytes.get(i + 1) {
                if next != b' ' && next != b'\t' && next != b'\n' && next != b'$' {
                    // find a closing dollar before newline
                    let mut j = i + 1;
                    while j < bytes.len() && bytes[j] != b'\n' {
                        if bytes[j] == b'$' {
                            return true;
                        }
                        j += 1;
                    }
                }
            }
        }
        i += 1;
    }
    false
}

/// True when a fenced code block declares a diagram language handled by JS rehype.
fn has_diagram_fence(body: &str) -> bool {
    for raw in body.lines() {
        let line = raw.trim_start();
        if let Some(rest) = line.strip_prefix("```") {
            let lang = rest.split_whitespace().next().unwrap_or("");
            if matches!(lang, "mermaid" | "graphviz" | "dot") {
                return true;
            }
        }
    }
    false
}

/// True when the body calls an xyd `@`-function that still needs the JS chain.
///
/// C-S3: `@include`/`@changelog` are NO LONGER pre-scanned — the pipeline's
/// `functions::process` ports them (reading + splicing / building `Update`
/// nodes) and falls back honestly only when a target itself is unsupported.
/// `@uniform` (composer) and `@importCode` (code-import) remain JS-only (C-S4).
fn has_function(body: &str) -> bool {
    for name in ["@uniform", "@importCode"] {
        if body.contains(name) {
            return true;
        }
    }
    false
}

/// Pre-parse capability decision from the raw source. `None` => eligible for the
/// `full` Rust path (subject to a post-parse MDX-node check in the pipeline);
/// `Some(reason)` => `fallback`.
pub fn scan(source: &str) -> Option<Fallback> {
    let (front, body) = split_frontmatter(source);
    if let Some(front) = front {
        if frontmatter_forces_fallback(front) {
            return Some(Fallback::FrontmatterComponent);
        }
    }
    if has_function(body) {
        return Some(Fallback::Function);
    }
    if has_math(body) {
        return Some(Fallback::Math);
    }
    if has_diagram_fence(body) {
        return Some(Fallback::Diagram);
    }
    None
}
