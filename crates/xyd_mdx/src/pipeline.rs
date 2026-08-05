//! Drives mdxjs-rs's PUBLIC decomposed pipeline and splices xyd's transforms in
//! at the right stages — no vendored fork needed (mdxjs 1.0.4 exposes
//! `mdast_util_from_mdx` -> `mdast_util_to_hast` -> `hast_util_to_swc` ->
//! `Program{ pub module }` + `Program::serialize()`).
//!
//! Stages:
//!   1. source -> mdast (`mdast_util_from_mdx`, gfm + frontmatter constructs)
//!   2. mdast -> hast (`mdast_util_to_hast`); if any MDX JSX/expression/ESM node
//!      survived (non-prose), bail to the JS fallback
//!   3. hast transforms (heading ids, table-ws strip, code highlight) + collect
//!      headings for toc
//!   4. hast -> swc Program (`hast_util_to_swc` + recma document + jsx rewrite)
//!   5. Program::serialize() -> ESM program string
//!   6. program -> function-body (fb post-pass) + toc/frontmatter const splice

use std::path::Path;

use markdown::Location;
use mdxjs::{
    hast_util_to_swc, mdast_util_from_mdx, mdast_util_to_hast, mdx_plugin_recma_document,
    mdx_plugin_recma_jsx_rewrite, MdxConstructs, MdxParseOptions, Options,
};
use rustc_hash::FxHashSet;
use swc_core::common::Span;

use crate::{directives, fb, functions, highlight, meta, swc_pass, transforms};

/// mdxjs options mirroring xyd's prose-relevant plugin set: GFM (tables,
/// task-lists, strikethrough, autolinks, footnotes) + frontmatter. Math and the
/// diagram/katex rehype steps are JS-only, so pages needing them fall back
/// before reaching here (see `capability::scan`).
fn options() -> Options {
    let mut constructs = MdxConstructs::gfm();
    constructs.frontmatter = true;
    let parse = MdxParseOptions {
        constructs,
        ..Default::default()
    };
    Options {
        parse,
        development: false,
        ..Default::default()
    }
}

/// Compile a prose page to xyd's function-body string. `Err` (parse error, a
/// surviving MDX node, or an unported directive / `@`-function target) means
/// "defer to the JS pipeline". `base_dir` is the page file's directory, used to
/// resolve relative `@include` / `@changelog` paths.
pub fn compile_full(
    source: &str,
    highlight_theme: &str,
    base_dir: &Path,
) -> Result<String, String> {
    let opts = options();

    let mut mdast = mdast_util_from_mdx(source, &opts).map_err(|e| format!("mdast: {e}"))?;

    // Pre-transform guard (mdast level): a page with RAW author MDX
    // (JSX/expression/ESM) needs the full JS pipeline. Checked BEFORE the
    // directive transform, which legitimately introduces `MdxJsxFlowElement`s.
    if directives::has_raw_mdx(&mdast) {
        return Err("mdx jsx/expression/esm node present".to_string());
    }

    // C-S2 stage-1 + 1b: rewrite `:::`/`::` directives to `MdxJsxFlowElement`
    // (generic port + the `steps`/`tabs`/`code-group` special handlers). `Err`
    // => a construct still outside the port (deferred `table`, step parameters,
    // expression attribute, unsupported name) — defer to JS. `code-group` needs
    // the highlight theme to build its `codeblocks` blob.
    directives::process(&mut mdast, &opts, source, highlight_theme)?;

    // C-S3: rewrite `@include` / `@changelog` calls (after directives, mirroring
    // the JS remark order). `Err` => an unported / unreadable target — defer to
    // JS. Runs AFTER the raw-MDX guard so the `Update`/spliced nodes it adds are
    // not mistaken for author MDX.
    functions::process(&mut mdast, base_dir, highlight_theme)?;

    let mut hast = mdast_util_to_hast(&mdast);

    let headings = transforms::apply(&mut hast);
    highlight::embed(&mut hast, highlight_theme);

    let location = Location::new(source.as_bytes());
    let mut explicit_jsxs: FxHashSet<Span> = FxHashSet::default();
    let mut program = hast_util_to_swc(&hast, &opts, Some(&location), &mut explicit_jsxs)
        .map_err(|e| format!("to_swc: {e}"))?;
    mdx_plugin_recma_document(&mut program, &opts, Some(&location))
        .map_err(|e| format!("recma_document: {e}"))?;
    mdx_plugin_recma_jsx_rewrite(&mut program, &opts, Some(&location), &explicit_jsxs)
        .map_err(|e| format!("recma_jsx_rewrite: {e}"))?;

    // Table-cell align="left" -> style={{ textAlign: "left" }} (React form).
    swc_pass::run(&mut program.module);

    let program_js = program.serialize();

    let toc = meta::toc_literal(&headings, 2, 2);
    let frontmatter = meta::frontmatter_literal(source);
    fb::program_to_function_body(&program_js, &toc, &frontmatter)
}
