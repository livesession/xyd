//! Per-page capability gate (cheap source pre-scan).
//!
//! A page qualifies for the Rust fast path (`full`) only when it uses none of
//! the constructs that need xyd's JS plugin chain: `@`-functions
//! (`@uniform`/`@include`/`@changelog`/`@importCode`),
//! `component:`/`uniform:`/`openapi:`/`graphql:` frontmatter, math (needs
//! rehype-katex), or mermaid/graphviz fences (need the JS rehype). Anything
//! matched here returns `fallback` — a sentinel telling the JS caller to run
//! `ContentFS.compileContent` unchanged.
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

/// Scan the leading frontmatter block for composer/atlas keys that must fall
/// back (they need the JS composer meta-component registry).
fn frontmatter_forces_fallback(front: &str) -> bool {
    for raw in front.lines() {
        let line = raw.trim_start();
        // Only inspect top-level keys (no leading indentation collapse needed —
        // these xyd keys are always top-level).
        if raw != line {
            continue;
        }
        let key = line.split(':').next().unwrap_or("").trim();
        if matches!(key, "component" | "uniform" | "openapi" | "graphql") {
            return true;
        }
    }
    false
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

/// True when the body calls an xyd `@`-function.
fn has_function(body: &str) -> bool {
    for name in ["@uniform", "@include", "@changelog", "@importCode"] {
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
