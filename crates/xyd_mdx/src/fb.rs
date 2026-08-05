//! Program -> function-body post-pass.
//!
//! mdxjs-rs emits an ESM *program*:
//! ```text
//! import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
//! function _createMdxContent(props) { ... }
//! function MDXContent(props = {}) { ... }
//! export default MDXContent;
//! ```
//! xyd's `ContentFS.compileContent` runs `@mdx-js/mdx` with
//! `outputFormat:'function-body'`, whose shape is instead evaluable via
//! `new Function`:
//! ```text
//! "use strict";
//! const { Fragment: _Fragment, jsx: _jsx, jsxs: _jsxs } = arguments[0];
//! const toc = [...];
//! const frontmatter = {...};
//! function _createMdxContent(props) { ... }
//! function MDXContent(props = {}) { ... }
//! return { toc, frontmatter, default: MDXContent };
//! ```
//! The transform is bounded because mdxjs's top-level structure is fixed and
//! deterministic: exactly one `react/jsx-runtime` import (prose has no other
//! ESM — pages that would produce ESM/JSX fall back before reaching here), the
//! two functions, and a trailing `export default MDXContent;`.

/// The single MDX runtime import mdxjs emits (with `providerImportSource` unset).
const JSX_RUNTIME: &str = "react/jsx-runtime";

/// Convert an import specifier list (`Fragment as _Fragment, jsx as _jsx`) into
/// a destructuring pattern body (`Fragment: _Fragment, jsx: _jsx`).
fn specifiers_to_destructure(specs: &str) -> String {
    specs
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| {
            if let Some((imported, local)) = s.split_once(" as ") {
                format!("{}: {}", imported.trim(), local.trim())
            } else {
                s.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join(", ")
}

/// Wrap an mdxjs program string into xyd's function-body form.
///
/// `toc_literal` and `frontmatter_literal` are ready-to-inline JS expression
/// strings (e.g. `[]` / `{"title":"x"}`), spliced in as `const toc = ...;` and
/// `const frontmatter = ...;` to mirror the remark-mdx-frontmatter + remarkMdxToc
/// exports (which live in the JS chain, not in mdxjs).
pub fn program_to_function_body(
    program: &str,
    toc_literal: &str,
    frontmatter_literal: &str,
) -> Result<String, String> {
    // 1. Locate the jsx-runtime import (first line).
    let mut destructure: Option<String> = None;
    let mut body_lines: Vec<&str> = Vec::new();

    for line in program.lines() {
        let trimmed = line.trim();
        if destructure.is_none() && trimmed.starts_with("import ") && trimmed.contains(JSX_RUNTIME)
        {
            // import { <specs> } from "react/jsx-runtime";
            let open = trimmed.find('{');
            let close = trimmed.find('}');
            if let (Some(o), Some(c)) = (open, close) {
                if c > o {
                    let specs = &trimmed[o + 1..c];
                    destructure = Some(specifiers_to_destructure(specs));
                    continue; // drop the import line
                }
            }
            return Err(format!("could not parse jsx-runtime import: {trimmed}"));
        }
        body_lines.push(line);
    }

    let destructure = destructure
        .ok_or_else(|| "no react/jsx-runtime import found in mdxjs program".to_string())?;

    // 2. Reassemble body, replacing the trailing `export default X;`.
    let mut body = body_lines.join("\n");
    let export_marker = "export default MDXContent;";
    if let Some(pos) = body.rfind(export_marker) {
        body.replace_range(
            pos..pos + export_marker.len(),
            "return { toc, frontmatter, default: MDXContent };",
        );
    } else {
        return Err("no `export default MDXContent;` found in mdxjs program".to_string());
    }

    // 3. Assemble the function body.
    let mut out = String::with_capacity(body.len() + 256);
    out.push_str("\"use strict\";\n");
    out.push_str("const { ");
    out.push_str(&destructure);
    out.push_str(" } = arguments[0];\n");
    out.push_str("const toc = ");
    out.push_str(toc_literal);
    out.push_str(";\n");
    out.push_str("const frontmatter = ");
    out.push_str(frontmatter_literal);
    out.push_str(";\n");
    out.push_str(body.trim_start_matches('\n'));
    if !out.ends_with('\n') {
        out.push('\n');
    }
    Ok(out)
}
