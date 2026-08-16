//! `@`-function port — the `@include` / `@changelog` paths (C-S3).
//!
//! Runs as an mdast transform AFTER `directives::process` (mirroring the JS
//! remark order: `mdComponentDirective` before `remarkFunctionPlugins` in
//! `packages/xyd-content/packages/md/plugins/index.ts`). It walks the tree for
//! `paragraph` nodes that are xyd `@`-function calls and rewrites them, exactly
//! like the JS `mdFunctionInclude` / `mdFunctionChangelog` plugins:
//!
//!   * `@include "path"` / `@include(path)` — read the local file relative to
//!     the PAGE dir, recursively compile it (parse → directives → nested
//!     functions, MINUS frontmatter + toc, per `mdFunctionInclude.ts:68-71`),
//!     and splice its block children in place of the `@include` paragraph.
//!   * `@changelog(path)` — read the local file, `parseChangelog` it, and emit a
//!     nameless `mdxJsxFlowElement` (→ `$Fragment`) whose children are one
//!     `Update` `mdxJsxFlowElement` per version section (each carrying `version`
//!     + `date` literal attributes and the sub-parsed entry markdown).
//!
//! Honest fallback (return `Err` → the page falls back to the JS pipeline):
//!   * external (`http(s)://`) targets, missing/unreadable files
//!   * an `@include` target that itself needs the JS chain (math / mermaid /
//!     `@uniform` / `@importCode` / `component:` frontmatter → caught by
//!     `capability::scan`), or contains raw author MDX (JSX/expression/ESM), or
//!     an unported directive (→ `directives::process` returns `Err`)
//!   * a `@changelog` entry that parses to raw MDX or a raw directive
//!   * the `@fn[…]` markdown-attribute form (needs `mdParameters`, unported)
//!
//! `@uniform` / `@importCode` stay in `capability::scan`'s pre-scan (they need
//! the composer / code-import chains — C-S4), so they never reach here.

use std::path::{Path, PathBuf};

use markdown::mdast::{AttributeContent, AttributeValue, MdxJsxAttribute, MdxJsxFlowElement, Node};
use mdxjs::{mdast_util_from_mdx, MdxConstructs, MdxParseOptions, Options};

use crate::{capability, directives};

/// Guard against a self-referential `@include` cycle (the JS has no guard and
/// would stack-overflow; we bail to the safe JS fallback instead).
const MAX_INCLUDE_DEPTH: usize = 16;

/// Parse options for INCLUDED markdown content: GFM + MDX, frontmatter OFF —
/// mirrors the JS include chain (`remarkGfm` + `remarkDirective` + MDX, with
/// `remarkFrontmatter`/`remarkMdxFrontmatter`/`remarkMdxToc` filtered out).
fn include_options() -> Options {
    Options {
        parse: MdxParseOptions {
            constructs: MdxConstructs::gfm(),
            ..Default::default()
        },
        development: false,
        ..Default::default()
    }
}

/// Parse options for a CHANGELOG entry body: CommonMark + MDX, no GFM, no
/// frontmatter — mirrors the JS `unified().use(remarkParse).use(remarkMdx).parse()`.
fn entry_options() -> Options {
    Options {
        parse: MdxParseOptions::default(),
        development: false,
        ..Default::default()
    }
}

/// Which `@`-function a paragraph resolved to, with its (unresolved) path arg.
enum Call {
    Include(String),
    Changelog(String),
}

/// Rewrite every `@include` / `@changelog` call in the tree, in-place.
/// `base_dir` is the directory the page's relative paths resolve against.
pub fn process(root: &mut Node, base_dir: &Path, theme: &str) -> Result<(), String> {
    process_at(root, base_dir, theme, 0)
}

fn process_at(root: &mut Node, base_dir: &Path, theme: &str, depth: usize) -> Result<(), String> {
    if let Some(children) = root.children_mut() {
        process_children(children, base_dir, theme, depth)?;
    }
    Ok(())
}

fn process_children(
    children: &mut Vec<Node>,
    base_dir: &Path,
    theme: &str,
    depth: usize,
) -> Result<(), String> {
    let mut i = 0;
    while i < children.len() {
        let call = if matches!(children[i], Node::Paragraph(_)) {
            detect_call(&children[i])?
        } else {
            None
        };

        match call {
            Some(Call::Include(path)) => {
                // Splice the recursively-compiled block children in place of the
                // `@include` paragraph. They are already fully processed, so we
                // skip past them.
                let nodes = build_include(&path, base_dir, theme, depth)?;
                let n = nodes.len();
                children.remove(i);
                for (k, node) in nodes.into_iter().enumerate() {
                    children.insert(i + k, node);
                }
                i += n;
            }
            Some(Call::Changelog(path)) => {
                children[i] = build_changelog(&path, base_dir)?;
                i += 1;
            }
            None => {
                if let Some(grand) = children[i].children_mut() {
                    process_children(grand, base_dir, theme, depth)?;
                }
                i += 1;
            }
        }
    }
    Ok(())
}

/// Classify a paragraph node as an `@include` / `@changelog` call (or neither).
/// `Err` = it looks like a call but uses an unported form → fall back.
fn detect_call(node: &Node) -> Result<Option<Call>, String> {
    if let Some(path) = parse_function_call(node, "@include")? {
        return Ok(Some(Call::Include(path)));
    }
    if let Some(path) = parse_function_call(node, "@changelog")? {
        return Ok(Some(Call::Changelog(path)));
    }
    Ok(None)
}

/// Port of `parseFunctionCall` (`functions/utils.ts`) for the path argument.
/// Returns `Ok(Some(path))` for a recognized call, `Ok(None)` for "not this
/// function" (matches the JS `return null` → left as prose), `Err` for a call
/// shape we don't port (`@fn[…]` markdown-attr) → fall back.
fn parse_function_call(node: &Node, fn_name: &str) -> Result<Option<String>, String> {
    let Node::Paragraph(p) = node else {
        return Ok(None);
    };

    // Simple case: a single text child.
    if p.children.len() == 1 {
        if let Node::Text(t) = &p.children[0] {
            return single_text_call(&t.value, fn_name);
        }
    }

    // Complex case: 3+ nodes (`@fn "` <link> `"` or `@fn(` … `)`).
    if p.children.len() >= 3 {
        return Ok(multi_node_call(&p.children, fn_name));
    }

    Ok(None)
}

fn single_text_call(text: &str, fn_name: &str) -> Result<Option<String>, String> {
    let Some(after) = text.strip_prefix(fn_name) else {
        return Ok(None);
    };

    // `@fn[attrs] path` — the `mdParameters` path; not ported → fall back.
    if after.starts_with('[') {
        return Err(format!(
            "function `{fn_name}` markdown-attr syntax not supported"
        ));
    }

    // `@fn(<args>)` — first arg is the path.
    if let Some(rest) = after.strip_prefix('(') {
        return Ok(rest.strip_suffix(')').map(|inner| {
            let first = inner.split(',').next().unwrap_or("").trim();
            strip_quotes(first).to_string()
        }));
    }

    // `@fn <ws> "<path>"` (original syntax; `\s+` then a quoted path).
    let after_ws = after.trim_start();
    if after_ws.len() == after.len() {
        // No whitespace after the name (e.g. `@includes`) → not this call.
        return Ok(None);
    }
    let bytes = after_ws.as_bytes();
    if bytes.len() >= 2 {
        let (first, last) = (bytes[0], bytes[bytes.len() - 1]);
        if matches!(first, b'"' | b'\'') && matches!(last, b'"' | b'\'') {
            return Ok(Some(after_ws[1..after_ws.len() - 1].to_string()));
        }
    }

    // Looks like `@fn something` but not a quoted/paren call → prose (JS null).
    Ok(None)
}

/// Port of `parseFunctionCall`'s "complex" multi-node branch: a call split
/// across text + link nodes (e.g. after an autolinked URL).
fn multi_node_call(children: &[Node], fn_name: &str) -> Option<String> {
    let Node::Text(first) = &children[0] else {
        return None;
    };
    let middle = &children[1];
    let last_text = match &children[2] {
        Node::Text(t) => Some(t.value.as_str()),
        _ => None,
    };

    // `@fn "` <link> `"`
    if first.value.starts_with(&format!("{fn_name} \"")) {
        if let Node::Link(link) = middle {
            if last_text == Some("\"") {
                return Some(link.url.clone());
            }
        }
    }

    // `@fn(` <text|link> `)`
    if first.value.starts_with(&format!("{fn_name}(")) && last_text == Some(")") {
        match middle {
            Node::Text(mt) => {
                let first_arg = mt.value.split(',').next().unwrap_or("").trim();
                return Some(strip_quotes(first_arg).to_string());
            }
            Node::Link(link) => return Some(link.url.clone()),
            _ => {}
        }
    }

    None
}

/// Port of the JS `arg.trim().replace(/^['"]|['"]$/g, '')` — strip ONE matching
/// leading and ONE trailing quote.
fn strip_quotes(s: &str) -> &str {
    let s = s.trim();
    let s = s.strip_prefix(['\'', '"']).unwrap_or(s);
    s.strip_suffix(['\'', '"']).unwrap_or(s)
}

/// Read + recursively compile an `@include` target; returns its block children.
fn build_include(
    path: &str,
    base_dir: &Path,
    theme: &str,
    depth: usize,
) -> Result<Vec<Node>, String> {
    if depth >= MAX_INCLUDE_DEPTH {
        return Err(format!("include recursion exceeded {MAX_INCLUDE_DEPTH}"));
    }

    let (content, full_path) = read_local(path, base_dir)?;

    // An include whose content needs the JS chain (math / mermaid / `@uniform` /
    // `@importCode` / `component:` frontmatter) → fall back honestly.
    if let Some(reason) = capability::scan(&content) {
        return Err(format!("include target needs JS ({})", reason.as_str()));
    }

    let opts = include_options();
    let mut sub =
        mdast_util_from_mdx(&content, &opts).map_err(|e| format!("include parse: {e}"))?;
    if directives::has_raw_mdx(&sub) {
        return Err("include target has raw mdx".to_string());
    }

    // Recursively compile (matches the JS include re-running the remark chain
    // minus frontmatter + toc): convert directives, then nested `@`-functions.
    directives::process(&mut sub, &opts, &content, theme)?;
    let new_base = full_path
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| base_dir.to_path_buf());
    process_at(&mut sub, &new_base, theme, depth + 1)?;

    Ok(match sub {
        Node::Root(r) => r.children,
        other => vec![other],
    })
}

/// Read + parse a `@changelog` target into a nameless-fragment of `Update` nodes.
fn build_changelog(path: &str, base_dir: &Path) -> Result<Node, String> {
    let (content, _full) = read_local(path, base_dir)?;
    let entries = parse_changelog(&content);

    let opts = entry_options();
    let mut updates: Vec<Node> = Vec::with_capacity(entries.len());
    for entry in entries {
        let parsed = mdast_util_from_mdx(&entry.content, &opts)
            .map_err(|e| format!("changelog entry parse: {e}"))?;
        if directives::has_raw_mdx(&parsed) {
            return Err("changelog entry has raw mdx".to_string());
        }
        if contains_directive(&parsed) {
            return Err("changelog entry has directive".to_string());
        }
        let children = match parsed {
            Node::Root(r) => r.children,
            other => vec![other],
        };
        updates.push(Node::MdxJsxFlowElement(MdxJsxFlowElement {
            name: Some("Update".to_string()),
            attributes: vec![attr("version", &entry.version), attr("date", &entry.date)],
            children,
            position: None,
        }));
    }

    // The JS turns the `@changelog` paragraph into a *nameless* mdxJsxFlowElement
    // (→ `$Fragment`) wrapping the `Update` nodes. The fragment (via mdast→hast
    // `all()`, not `wrap()`) keeps the `Update`s adjacent with no `"\n"` between
    // them — which is what the golden requires.
    Ok(Node::MdxJsxFlowElement(MdxJsxFlowElement {
        name: None,
        attributes: vec![],
        children: updates,
        position: None,
    }))
}

/// One parsed changelog version section.
struct ChangelogEntry {
    version: String,
    date: String,
    content: String,
}

/// Port of `parseChangelog` (`mdFunctionChangelog.ts`).
fn parse_changelog(content: &str) -> Vec<ChangelogEntry> {
    let mut entries: Vec<ChangelogEntry> = Vec::new();
    let mut current: Option<(String, String)> = None; // (version, date)
    let mut buf: Vec<&str> = Vec::new();

    let flush = |entries: &mut Vec<ChangelogEntry>, cur: Option<(String, String)>, buf: &[&str]| {
        if let Some((version, date)) = cur {
            entries.push(ChangelogEntry {
                version,
                date,
                content: buf.join("\n").trim().to_string(),
            });
        }
    };

    for line in content.split('\n') {
        if let Some((version, date)) = parse_version_header(line) {
            flush(&mut entries, current.take(), &buf);
            current = Some((version, date));
            buf.clear();
            continue;
        }
        // Skip the main title (`# xyd-js`).
        if line.starts_with("# ") {
            continue;
        }
        if current.is_some() {
            buf.push(line);
        }
    }
    flush(&mut entries, current.take(), &buf);

    entries
}

/// Port of the `/^##\s+(?:\[?([^\]]+)\]?(?:\s*-\s*([^\n]+))?)/` version header
/// match: returns `(version, date)`. `##` then `\s+` excludes `###…` headings.
fn parse_version_header(line: &str) -> Option<(String, String)> {
    let rest = line.strip_prefix("##")?;
    // `\s+`: at least one whitespace right after `##` (so `### x` / `##x` don't match).
    if !rest.chars().next().is_some_and(char::is_whitespace) {
        return None;
    }
    let s = rest.trim_start();
    // `\[?`
    let s = s.strip_prefix('[').unwrap_or(s);
    // `([^\]]+)` — greedy up to `]` or end; must be non-empty.
    let g1_end = s.find(']').unwrap_or(s.len());
    let version = &s[..g1_end];
    if version.is_empty() {
        return None;
    }
    // `\]?`
    let mut rem = &s[g1_end..];
    if let Some(r) = rem.strip_prefix(']') {
        rem = r;
    }
    // `(?:\s*-\s*([^\n]+))?`
    let date = match rem.trim_start().strip_prefix('-') {
        Some(after_dash) => after_dash.trim().to_string(),
        None => String::new(),
    };
    Some((version.to_string(), date))
}

/// Read a LOCAL file relative to `base_dir`; returns `(content, full_path)`.
/// External (`http(s)://`) targets are unported → `Err` (fall back).
fn read_local(path: &str, base_dir: &Path) -> Result<(String, PathBuf), String> {
    if path.starts_with("http://") || path.starts_with("https://") {
        return Err(format!("external target `{path}` not supported"));
    }
    let resolved = resolve_home(path);
    let full = if Path::new(&resolved).is_absolute() {
        PathBuf::from(&resolved)
    } else {
        base_dir.join(&resolved)
    };
    let content =
        std::fs::read_to_string(&full).map_err(|e| format!("read `{}`: {e}", full.display()))?;
    Ok((content, full))
}

/// Port of `parseIfLocalHomePath`: `~/` → `<cwd>/`.
fn resolve_home(path: &str) -> String {
    if let Some(rest) = path.strip_prefix("~/") {
        if let Ok(cwd) = std::env::current_dir() {
            return format!("{}/{rest}", cwd.display());
        }
    }
    path.to_string()
}

/// A single literal JSX attribute (`name="value"`).
fn attr(name: &str, value: &str) -> AttributeContent {
    AttributeContent::Property(MdxJsxAttribute {
        name: name.to_string(),
        value: Some(AttributeValue::Literal(value.to_string())),
    })
}

/// True if the subtree contains a raw (unconverted) directive node — the fork
/// parses `:::`/`::` unconditionally, but changelog entries are `.parse()`-only
/// in JS (no `remark-directive`), so a directive there is unported → fall back.
fn contains_directive(node: &Node) -> bool {
    if matches!(node, Node::ContainerDirective(_) | Node::LeafDirective(_)) {
        return true;
    }
    node.children()
        .is_some_and(|c| c.iter().any(contains_directive))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn version_header_plain() {
        assert_eq!(
            parse_version_header("## 1.1.0"),
            Some(("1.1.0".to_string(), String::new()))
        );
        assert_eq!(
            parse_version_header("## 1.0.0"),
            Some(("1.0.0".to_string(), String::new()))
        );
    }

    #[test]
    fn version_header_bracket_and_date() {
        assert_eq!(
            parse_version_header("## [1.2.3] - 2024-01-01"),
            Some(("1.2.3".to_string(), "2024-01-01".to_string()))
        );
        assert_eq!(
            parse_version_header("## [unreleased]"),
            Some(("unreleased".to_string(), String::new()))
        );
    }

    #[test]
    fn version_header_rejects_non_h2() {
        assert_eq!(parse_version_header("### 1.0.0"), None);
        assert_eq!(parse_version_header("#### x"), None);
        assert_eq!(parse_version_header("##no-space"), None);
        assert_eq!(parse_version_header("## "), None);
        assert_eq!(parse_version_header("regular line"), None);
    }

    #[test]
    fn parse_changelog_two_sections() {
        let c = "## 1.1.0\n- added the changelog function\n\n## 1.0.0\n- first release\n";
        let entries = parse_changelog(c);
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].version, "1.1.0");
        assert_eq!(entries[0].date, "");
        assert_eq!(entries[0].content, "- added the changelog function");
        assert_eq!(entries[1].version, "1.0.0");
        assert_eq!(entries[1].content, "- first release");
    }

    #[test]
    fn include_original_syntax() {
        let src = "@include \"./partial.md\"";
        let node = mdast_util_from_mdx(src, &include_options()).unwrap();
        // Root -> [Paragraph]
        let para = match node {
            Node::Root(r) => r.children.into_iter().next().unwrap(),
            _ => unreachable!(),
        };
        assert!(matches!(
            parse_function_call(&para, "@include"),
            Ok(Some(ref p)) if p == "./partial.md"
        ));
        assert!(matches!(parse_function_call(&para, "@changelog"), Ok(None)));
    }

    #[test]
    fn changelog_parens_syntax() {
        let src = "@changelog(\"./changelog.md\")";
        let node = mdast_util_from_mdx(src, &include_options()).unwrap();
        let para = match node {
            Node::Root(r) => r.children.into_iter().next().unwrap(),
            _ => unreachable!(),
        };
        assert!(matches!(
            parse_function_call(&para, "@changelog"),
            Ok(Some(ref p)) if p == "./changelog.md"
        ));
    }

    #[test]
    fn markdown_attr_form_defers() {
        let src = "@include[copy] \"./partial.md\"";
        let node = mdast_util_from_mdx(src, &include_options()).unwrap();
        let para = match node {
            Node::Root(r) => r.children.into_iter().next().unwrap(),
            _ => unreachable!(),
        };
        assert!(parse_function_call(&para, "@include").is_err());
    }

    #[test]
    fn strip_quotes_one_each() {
        assert_eq!(strip_quotes("\"./x.md\""), "./x.md");
        assert_eq!(strip_quotes("'./x.md'"), "./x.md");
        assert_eq!(strip_quotes("  ./x.md  "), "./x.md");
    }
}
