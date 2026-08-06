//! xyd_mdx — Rust-first whole-page MDX compiler for PROSE pages (Track C, C-S1).
//!
//! Drives mdxjs-rs's public decomposed pipeline (mdast -> hast -> swc program),
//! applies xyd's portable transforms on the hast (heading ids, table-whitespace
//! normalization, inline syntax highlight via `xyd_highlight`), synthesizes the
//! `frontmatter` + `toc` exports, and emits xyd's `outputFormat:'function-body'`
//! shape. Non-prose pages return a `fallback` sentinel so the JS `ContentFS`
//! pipeline runs unchanged.
//!
//! The parity gate lives in `tests/parity.rs`: it renders each `full` result
//! through the committed JS harness (`__fixtures__/mdx-parity/_harness`) and
//! byte-compares against `rendered.html` (Oracle B). Oracle A (compiled JS) is
//! NOT gated — swc codegen differs cosmetically from astring, but the rendered
//! DOM is identical.

mod capability;
mod directives;
mod fb;
mod functions;
mod highlight;
mod math;
mod meta;
mod meta_component;
mod pipeline;
mod swc_pass;
mod transforms;

use serde::Serialize;

/// Capability tag: page compiled fully by the Rust fast path.
pub const CAP_FULL: &str = "full";
/// Capability tag: page must run through the JS `ContentFS` pipeline.
pub const CAP_FALLBACK: &str = "fallback";

/// Result of [`compile_mdx`]. Serialized as JSON across the napi boundary.
#[derive(Debug, Clone, Serialize)]
pub struct CompileOutput {
    /// The function-body string (empty when `capability == "fallback"`).
    pub compiled: String,
    /// `"full"` or `"fallback"`.
    pub capability: String,
    /// Why the page fell back (diagnostics only; `None` for `full`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

impl CompileOutput {
    fn full(compiled: String) -> Self {
        Self {
            compiled,
            capability: CAP_FULL.to_string(),
            reason: None,
        }
    }
    fn fallback(reason: impl Into<String>) -> Self {
        Self {
            compiled: String::new(),
            capability: CAP_FALLBACK.to_string(),
            reason: Some(reason.into()),
        }
    }
}

/// Extract the syntax-highlight theme name from the settings JSON
/// (`theme.coder.syntaxHighlight`), defaulting to `github-dark`.
fn highlight_theme(settings_json: &str) -> String {
    serde_json::from_str::<serde_json::Value>(settings_json)
        .ok()
        .and_then(|v| {
            v.get("theme")?
                .get("coder")?
                .get("syntaxHighlight")?
                .as_str()
                .map(str::to_string)
        })
        .unwrap_or_else(|| "github-dark".to_string())
}

/// Compile an MDX source to xyd's function-body form, gated by capability.
///
/// `settings_json` is xyd's settings object as JSON (only
/// `theme.coder.syntaxHighlight` is read today). `base_dir` is the directory the
/// page's relative `@include` / `@changelog` paths resolve against (the page
/// file's directory); pass `""` when there is none. Returns `full` with the
/// compiled string for prose / directive / `@include` / `@changelog` pages, or
/// `fallback` (empty `compiled`) otherwise.
pub fn compile_mdx(source: &str, settings_json: &str, base_dir: &str) -> CompileOutput {
    // 1. Cheap source pre-scan for the constructs still owned by the JS chain
    //    (`@uniform`/`@importCode`, `component:`/`uniform:` frontmatter, math,
    //    mermaid/graphviz). `@include`/`@changelog` are NO LONGER pre-scanned —
    //    they are handled post-parse by `functions::process` (C-S3).
    if let Some(reason) = capability::scan(source) {
        return CompileOutput::fallback(reason.as_str());
    }
    // 2. Full Rust path. Any parse error / surviving MDX node / unported
    //    `@include`/`@changelog` target => fallback.
    let theme = highlight_theme(settings_json);
    let base = std::path::Path::new(base_dir);
    match pipeline::compile_full(source, &theme, base) {
        Ok(js) => CompileOutput::full(js),
        Err(reason) => CompileOutput::fallback(reason),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn slug_matches_common_headings() {
        use transforms::slug_base;
        assert_eq!(slug_base("Level One"), "level-one");
        assert_eq!(slug_base("Five Principles"), "five-principles");
        assert_eq!(slug_base("Open Source"), "open-source");
        assert_eq!(slug_base("SEO"), "seo");
    }

    #[test]
    fn directive_callout_multi_paragraph_keeps_blank_line() {
        // The fork's raw content child collapses the blank line (two paragraphs
        // would merge into one); the position-sliced body preserves it, so the
        // callout body compiles as TWO paragraphs.
        let src = ":::callout\nPara one.\n\nPara two.\n:::\n";
        let out = compile_mdx(src, "{}", "");
        assert_eq!(out.capability, CAP_FULL, "reason={:?}", out.reason);
        let paras = out.compiled.matches("_components.p").count();
        assert!(
            paras >= 2,
            "expected 2 paragraphs in callout body, got {paras}\n{}",
            out.compiled
        );
    }

    #[test]
    fn directive_callout_compiles_full() {
        let out = compile_mdx(":::callout\nHi **there**.\n:::\n", "{}", "");
        assert_eq!(out.capability, CAP_FULL, "reason={:?}", out.reason);
        assert!(out.compiled.contains("Callout"));
    }

    #[test]
    fn directive_steps_compiles_full() {
        // Special handler now ported (C-S2 stage-1b): `:::steps` → `Steps` with
        // `Steps.Item` wrappers.
        let out = compile_mdx(":::steps\n1. one\n:::\n", "{}", "");
        assert_eq!(out.capability, CAP_FULL, "reason={:?}", out.reason);
        assert!(out.compiled.contains("Steps.Item"));
    }

    #[test]
    fn math_inline_and_block_compile_full() {
        // Rust-native math: inline `$…$` and block `$$…$$` now compile `full` to
        // MathML (no more `fallback` for math).
        let src = "Inline $a^2 + b^2 = c^2$ done.\n\n$$\n\\int_0^1 x^2 \\, dx\n$$\n";
        let out = compile_mdx(src, "{}", "");
        assert_eq!(out.capability, CAP_FULL, "reason={:?}", out.reason);
        // Real MathML element + KaTeX-style annotation, no error node.
        assert!(out.compiled.contains("\"math\""), "{}", out.compiled);
        assert!(out.compiled.contains("msup") || out.compiled.contains("mfrac"));
        assert!(!out.compiled.contains("merror"));
    }

    #[test]
    fn math_unsupported_falls_back() {
        // An expression the Rust renderer can't parse defers the page to JS
        // (honest fallback — never a wrong render).
        let out = compile_mdx("bad $\\notacommand{x}$ math", "{}", "");
        assert_eq!(out.capability, CAP_FALLBACK);
        assert!(
            out.reason.as_deref().unwrap_or("").starts_with("math:"),
            "reason={:?}",
            out.reason
        );
    }

    #[test]
    fn directive_table_falls_back() {
        // `table` remains deferred (no fixture pins its parity).
        let out = compile_mdx(":::table\n[[\"a\"]]\n:::\n", "{}", "");
        assert_eq!(out.capability, CAP_FALLBACK);
        assert_eq!(
            out.reason.as_deref(),
            Some("directive special-handler `table`")
        );
    }

    #[test]
    fn scan_fallbacks() {
        // C-S4b: native meta-components (atlas/home/bloghome/firstslide) with NO
        // source and NO componentProps are eligible for full; a source key,
        // componentProps, or any other/user component -> fallback.
        assert!(capability::scan("---\ncomponent: atlas\n---\n# x").is_none());
        assert!(capability::scan("---\ncomponent: home\n---\n# x").is_none());
        assert!(capability::scan("---\ncomponent: bloghome\n---\n# x").is_none());
        assert!(capability::scan("---\ncomponent: firstslide\n---\n# x").is_none());
        assert!(capability::scan("---\ncomponent: atlas\nuniform: ./a.yaml\n---\n# x").is_some());
        assert!(
            capability::scan("---\ncomponent: home\ncomponentProps:\n  a: b\n---\n# x").is_some()
        );
        assert!(capability::scan("---\ncomponent: custom-thing\n---\n# x").is_some());
        assert!(capability::scan("---\nopenapi: ./a.yaml\n---\n# x").is_some());
        assert!(capability::scan("---\nuniform: ./a.ts\n---\n# x").is_some());
        // `@uniform`/`@importCode` still pre-scan to fallback (need the JS
        // composer / code-import chains — C-S4).
        assert!(capability::scan("# x\n\n@uniform \"./x.ts\"").is_some());
        assert!(capability::scan("# x\n\n@importCode \"./x.ts\"").is_some());
        // `@uniform` inside a directive attribute is still caught pre-parse.
        assert!(capability::scan("::atlas{references=\"@uniform('./x.ts')\"}").is_some());
        // Math is NO LONGER pre-scanned to fallback — it renders natively to
        // MathML in the pipeline (falls back only on unsupported LaTeX).
        assert!(capability::scan("inline $a^2$ math").is_none());
        assert!(capability::scan("```mermaid\ngraph\n```").is_some());
        // C-S3: `@include`/`@changelog` are NO LONGER pre-scanned — they are
        // handled post-parse by `functions::process`.
        assert!(capability::scan("# x\n\n@include \"./p.md\"").is_none());
        assert!(capability::scan("# x\n\n@changelog(\"./c.md\")").is_none());
        // C-S2: plain `:::` directives are NOT decided here — the pipeline's
        // `directives::process` classifies them post-parse.
        assert!(capability::scan(":::callout\nhi\n:::").is_none());
        assert!(capability::scan("# Just prose\n\nHello.").is_none());
    }
}
