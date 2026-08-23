//! Mintlify `.mdx` → `.md` content transform (migrateme S3).
//!
//! Port of `convertMDXComponents` / `transformMintlifyComponents` in `mintlify.ts`. The
//! body is parsed to an mdast tree by the vendored `markdown` fork (`ParseOptions::mdx()`),
//! lowered into the [`Md`] output model (rewriting the ~15 Mintlify JSX shapes into xyd
//! `:::` directives / HTML), then serialized by [`serialize`]. Byte-parity is verified
//! against goldens from the real migrator for curated, remark-canonical inputs.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use markdown::mdast::{AttributeContent, AttributeValue, Node};

use super::serialize::{serialize, Md, StepItem, TabItem};
use crate::opencli::runtime::Error;

/// Find every `.mdx` file under `docs_path`, convert it to `.md`, and remove the original
/// (mirrors `migrateContent` + `migrateMdxFile`). A file that fails to convert falls back
/// to a crude tag/import strip so the migration still produces a `.md`.
pub fn migrate_content(docs_path: &Path) -> Result<(), Error> {
    let mut files = Vec::new();
    find_mdx_files(docs_path, &mut files);
    for file in files {
        let content = std::fs::read_to_string(&file)
            .map_err(|e| Error::Invalid(format!("cannot read {}: {e}", file.display())))?;
        let md = convert_mdx(&content).unwrap_or_else(|_| fallback_strip(&content));
        let new_path = file.with_extension("md");
        std::fs::write(&new_path, md)
            .map_err(|e| Error::Invalid(format!("cannot write {}: {e}", new_path.display())))?;
        let _ = std::fs::remove_file(&file);
    }
    Ok(())
}

fn find_mdx_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let entries = match std::fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let Ok(file_type) = entry.file_type() else {
            continue;
        };
        if file_type.is_dir() {
            let name = entry.file_name();
            if !matches!(
                name.to_string_lossy().as_ref(),
                "node_modules" | ".git" | "dist" | "build"
            ) {
                find_mdx_files(&path, out);
            }
        } else if file_type.is_file() && path.extension().is_some_and(|e| e == "mdx") {
            out.push(path);
        }
    }
}

/// Crude fallback when MDX parsing fails: drop import lines, strip `<…>` tags, collapse
/// blank runs, and trim (mirrors the TS `migrateMdxFile` fallback path).
fn fallback_strip(content: &str) -> String {
    let no_imports: String = content
        .lines()
        .filter(|l| !l.trim_start().starts_with("import "))
        .collect::<Vec<_>>()
        .join("\n");
    let mut out = String::with_capacity(no_imports.len());
    let mut in_tag = false;
    for c in no_imports.chars() {
        match c {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => out.push(c),
            _ => {}
        }
    }
    while out.contains("\n\n\n") {
        out = out.replace("\n\n\n", "\n\n");
    }
    out.trim().to_string()
}

/// Convert `.mdx` source to `.md`, mirroring `convertMDXComponents`.
pub fn convert_mdx(content: &str) -> Result<String, Error> {
    let (frontmatter, body, has_frontmatter) = split_frontmatter(content);

    let ast = markdown::to_mdast(&body, &markdown::ParseOptions::mdx())
        .map_err(|e| Error::Invalid(format!("MDX parse error: {e}")))?;

    let (title, description) = if has_frontmatter {
        extract_title_description(&frontmatter)
    } else {
        (String::new(), String::new())
    };

    let root_children = match &ast {
        Node::Root(root) => root.children.as_slice(),
        _ => &[],
    };
    let mut mapping: HashMap<String, String> = HashMap::new();
    let mut blocks = lower_blocks(root_children, &mut mapping);

    // Prepend the title heading + subtitle directive (order: title, subtitle).
    let mut prefix: Vec<Md> = Vec::new();
    if !title.is_empty() {
        prefix.push(Md::Heading(1, vec![Md::Text(title)]));
    }
    if !description.is_empty() {
        prefix.push(Md::Directive {
            name: "subtitle".into(),
            attrs: String::new(),
            body: vec![Md::Paragraph(vec![Md::Text(description)])],
        });
    }
    if !prefix.is_empty() {
        prefix.append(&mut blocks);
        blocks = prefix;
    }

    let markdown = cleanups(&serialize(&blocks));
    Ok(format!("{frontmatter}\n\n{markdown}"))
}

/// Split off the leading `---\n…\n---` frontmatter (naive, like the TS). When the content
/// has no frontmatter, a `title: TODO` block is synthesized.
fn split_frontmatter(content: &str) -> (String, String, bool) {
    if let Some(rest) = content.strip_prefix("---") {
        if let Some(end) = rest.find("---") {
            let cut = 3 + end; // index of the closing `---`
            let frontmatter = content[..cut + 3].to_string();
            let body = content[cut + 3..].to_string();
            return (frontmatter, body, true);
        }
        // No closing fence: frontmatter stays empty, body is the whole content.
        return (String::new(), content.to_string(), true);
    }
    (
        "---\ntitle: TODO\n---".to_string(),
        content.to_string(),
        true,
    )
}

/// Extract `title:` / `description:` from the frontmatter body (line-prefix scan), strip a
/// single surrounding quote/backtick, and escape the title's markdown specials.
fn extract_title_description(frontmatter: &str) -> (String, String) {
    let inner = frontmatter
        .strip_prefix("---\n")
        .unwrap_or(frontmatter)
        .strip_suffix("\n---")
        .unwrap_or(frontmatter);
    let mut title = String::new();
    let mut description = String::new();
    for line in inner.lines() {
        if let Some(rest) = line.strip_prefix("title:") {
            title = escape_title(&strip_quotes(rest.trim()));
        } else if let Some(rest) = line.strip_prefix("description:") {
            description = strip_quotes(rest.trim()).to_string();
        }
    }
    (title, description)
}

fn strip_quotes(s: &str) -> String {
    let mut chars: Vec<char> = s.chars().collect();
    if let Some(&first) = chars.first() {
        if matches!(first, '\'' | '"' | '`') {
            chars.remove(0);
        }
    }
    if let Some(&last) = chars.last() {
        if matches!(last, '\'' | '"' | '`') {
            chars.pop();
        }
    }
    chars.into_iter().collect()
}

fn escape_title(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        if matches!(
            c,
            '\\' | '`' | '*' | '_' | '{' | '}' | '[' | ']' | '(' | ')' | '#' | '+' | '-' | '!'
        ) {
            out.push('\\');
        }
        out.push(c);
    }
    out
}

// ---------------------------------------------------------------------------
// Lowering (mdast → Md) + Mintlify component rewrite
// ---------------------------------------------------------------------------

fn lower_blocks(nodes: &[Node], mapping: &mut HashMap<String, String>) -> Vec<Md> {
    let mut out = Vec::new();
    for node in nodes {
        out.extend(lower_block(node, mapping));
    }
    out
}

fn lower_block(node: &Node, mapping: &mut HashMap<String, String>) -> Vec<Md> {
    match node {
        Node::Paragraph(p) => {
            // An import statement is captured as a text paragraph by the fork (no ESM
            // parser) — detect it, record the include mapping, and strip it.
            if let Some(()) = try_capture_import(&p.children, mapping) {
                return Vec::new();
            }
            let inline = lower_inline(&p.children, mapping);
            // Hoist block nodes that ended up inline (e.g. a callout that parsed as a
            // text element inside this paragraph).
            if inline.iter().any(is_block) {
                return inline
                    .into_iter()
                    .filter(keep_block_or_meaningful)
                    .collect();
            }
            vec![Md::Paragraph(inline)]
        }
        Node::Heading(h) => vec![Md::Heading(h.depth, lower_inline(&h.children, mapping))],
        Node::List(l) => {
            let items = l
                .children
                .iter()
                .map(|item| match item {
                    Node::ListItem(li) => lower_blocks(&li.children, mapping),
                    other => lower_block(other, mapping),
                })
                .collect();
            vec![Md::List {
                ordered: l.ordered,
                start: l.start,
                spread: l.spread,
                items,
            }]
        }
        Node::Code(c) => vec![Md::Code {
            lang: c.lang.clone(),
            value: c.value.clone(),
        }],
        Node::Blockquote(b) => vec![Md::Blockquote(lower_blocks(&b.children, mapping))],
        Node::ThematicBreak(_) => vec![Md::ThematicBreak],
        Node::Html(h) => vec![Md::Html(h.value.clone())],
        Node::MdxJsxFlowElement(e) => {
            lower_component(e.name.as_deref(), &e.attributes, &e.children, mapping)
        }
        _ => Vec::new(),
    }
}

fn lower_inline(nodes: &[Node], mapping: &mut HashMap<String, String>) -> Vec<Md> {
    let mut out = Vec::new();
    for node in nodes {
        match node {
            Node::Text(t) => out.push(Md::Text(decode_entities(&t.value))),
            Node::Strong(s) => out.push(Md::Strong(lower_inline(&s.children, mapping))),
            Node::Emphasis(e) => out.push(Md::Emphasis(lower_inline(&e.children, mapping))),
            Node::InlineCode(c) => out.push(Md::InlineCode(c.value.clone())),
            Node::Link(l) => out.push(Md::Link {
                url: l.url.clone(),
                title: l.title.clone(),
                children: lower_inline(&l.children, mapping),
            }),
            Node::Image(i) => out.push(Md::Image {
                url: i.url.clone(),
                alt: i.alt.clone(),
            }),
            Node::Break(_) => out.push(Md::SoftBreak),
            Node::MdxJsxTextElement(e) => out.extend(lower_component(
                e.name.as_deref(),
                &e.attributes,
                &e.children,
                mapping,
            )),
            Node::MdxJsxFlowElement(e) => out.extend(lower_component(
                e.name.as_deref(),
                &e.attributes,
                &e.children,
                mapping,
            )),
            _ => {}
        }
    }
    out
}

/// Lower children into inline `Md`, flattening any block paragraphs into their inline
/// content (matches the TS wrapping of a component's children in a single paragraph).
fn lower_flatten_inline(nodes: &[Node], mapping: &mut HashMap<String, String>) -> Vec<Md> {
    let mut out = Vec::new();
    for node in nodes {
        match node {
            Node::Paragraph(p) => out.extend(lower_flatten_inline(&p.children, mapping)),
            other => out.extend(lower_inline(std::slice::from_ref(other), mapping)),
        }
    }
    out
}

fn lower_component(
    name: Option<&str>,
    attributes: &[AttributeContent],
    children: &[Node],
    mapping: &mut HashMap<String, String>,
) -> Vec<Md> {
    let name = match name {
        Some(n) => n,
        None => return Vec::new(),
    };
    match name {
        "img" => convert_light_dark_image(attributes)
            .map(|img| vec![Md::Html(img_html(&img))])
            .unwrap_or_default(),
        "Columns" | "CardGroup" => {
            let cols = attr(attributes, "cols").unwrap_or_else(|| "2".to_string());
            let cards = collect_elements(children, "Card")
                .iter()
                .map(|el| lower_card(el, mapping))
                .collect();
            vec![Md::Grid {
                attrs: format!("cols=\"{cols}\""),
                cards,
            }]
        }
        "Card" => vec![lower_card_parts(attributes, children, mapping)],
        "Frame" => vec![Md::Html(frame_picture(children))],
        "Note" | "Info" | "Warning" | "Tip" | "Danger" => {
            let kind = callout_kind(name);
            let attrs = kind.map(|k| format!("kind=\"{k}\"")).unwrap_or_default();
            vec![Md::Directive {
                name: "callout".into(),
                attrs,
                body: vec![Md::Paragraph(lower_flatten_inline(children, mapping))],
            }]
        }
        "Steps" => {
            let items = collect_elements(children, "Step")
                .iter()
                .map(|el| step_item(el, mapping))
                .collect();
            vec![Md::Steps(items)]
        }
        "Tabs" => {
            let items = collect_elements(children, "Tab")
                .iter()
                .map(|el| tab_item(el, mapping))
                .collect();
            vec![Md::Tabs(items)]
        }
        other => {
            if let Some(path) = mapping.get(other) {
                vec![Md::Paragraph(vec![Md::Text(format!(
                    "@include \"{path}\""
                ))])]
            } else {
                let text = unknown_text_content(children);
                let comment = if text.is_empty() {
                    format!("<!-- {other} component not supported -->")
                } else {
                    format!("<!-- {other}: {text} -->")
                };
                vec![Md::Html(comment)]
            }
        }
    }
}

fn lower_card(el: &Node, mapping: &mut HashMap<String, String>) -> Md {
    match el {
        Node::MdxJsxFlowElement(e) => lower_card_parts(&e.attributes, &e.children, mapping),
        Node::MdxJsxTextElement(e) => lower_card_parts(&e.attributes, &e.children, mapping),
        _ => Md::Directive {
            name: "guide-card".into(),
            attrs: String::new(),
            body: vec![],
        },
    }
}

fn lower_card_parts(
    attributes: &[AttributeContent],
    children: &[Node],
    mapping: &mut HashMap<String, String>,
) -> Md {
    let mut attrs: Vec<String> = vec!["kind=\"secondary\"".to_string()];
    for key in ["title", "href", "icon", "iconType", "description", "imgSrc"] {
        if let Some(v) = attr(attributes, key) {
            if !v.is_empty() {
                attrs.push(format!("{key}=\"{v}\""));
            }
        }
    }
    Md::Directive {
        name: "guide-card".into(),
        attrs: attrs.join(" "),
        body: vec![Md::Paragraph(lower_flatten_inline(children, mapping))],
    }
}

fn step_item(el: &Node, mapping: &mut HashMap<String, String>) -> StepItem {
    let (attributes, children) = element_parts(el);
    let mut parts: Vec<String> = Vec::new();
    if let Some(icon) = attr(attributes, "icon").filter(|s| !s.is_empty()) {
        parts.push(format!("icon=\"{icon}\""));
    }
    if let Some(title) = attr(attributes, "title").filter(|s| !s.is_empty()) {
        parts.push(format!("title=\"{title}\""));
    }
    let prefix = if parts.is_empty() {
        String::new()
    } else {
        format!("[{}] ", parts.join(" "))
    };
    StepItem {
        prefix,
        body: lower_flatten_inline(children, mapping),
    }
}

fn tab_item(el: &Node, mapping: &mut HashMap<String, String>) -> TabItem {
    let (attributes, children) = element_parts(el);
    let title = attr(attributes, "title").unwrap_or_default();
    let type_value = title.to_lowercase();
    TabItem {
        title,
        type_value,
        body: lower_flatten_inline(children, mapping),
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

struct LightDarkImage {
    color_scheme: String,
    src: String,
    alt: String,
}

fn convert_light_dark_image(attributes: &[AttributeContent]) -> Option<LightDarkImage> {
    let class_name = attr(attributes, "className").unwrap_or_default();
    let mut src = attr(attributes, "src").unwrap_or_default();
    let alt = attr(attributes, "alt").unwrap_or_default();

    if class_name.contains("dark:hidden") || class_name.contains("dark:block") {
        let color_scheme = if class_name.contains("dark:hidden") {
            "light"
        } else {
            "dark"
        };
        if src.starts_with('/')
            && !src.starts_with("/public/")
            && !src.starts_with("http://")
            && !src.starts_with("https://")
        {
            src = format!("/public{src}");
        }
        return Some(LightDarkImage {
            color_scheme: color_scheme.into(),
            src,
            alt,
        });
    }
    None
}

fn img_html(img: &LightDarkImage) -> String {
    format!(
        "<img src=\"{}\" alt=\"{}\" data-color-scheme=\"{}\" />",
        img.src, img.alt, img.color_scheme
    )
}

fn frame_picture(children: &[Node]) -> String {
    let mut out = String::from("<picture>\n");
    for child in children {
        if let Node::MdxJsxFlowElement(e) = child {
            if e.name.as_deref() == Some("img") {
                if let Some(img) = convert_light_dark_image(&e.attributes) {
                    out.push_str(&format!("  {}\n", img_html(&img)));
                }
            }
        }
    }
    out.push_str("</picture>");
    out
}

fn callout_kind(name: &str) -> Option<&'static str> {
    // NB: reproduces the TS bug where `Info` falls through with no kind.
    match name {
        "Note" => Some("note"),
        "Warning" => Some("warning"),
        "Tip" => Some("tip"),
        "Danger" => Some("danger"),
        _ => None,
    }
}

/// Recursively collect JSX elements named `name` (Card/Step/Tab) within `nodes`.
fn collect_elements<'a>(nodes: &'a [Node], name: &str) -> Vec<&'a Node> {
    let mut out = Vec::new();
    for node in nodes {
        let matched = match node {
            Node::MdxJsxFlowElement(e) => e.name.as_deref() == Some(name),
            Node::MdxJsxTextElement(e) => e.name.as_deref() == Some(name),
            _ => false,
        };
        if matched {
            out.push(node);
        } else {
            out.extend(collect_elements(children_of(node), name));
        }
    }
    out
}

fn element_parts(el: &Node) -> (&[AttributeContent], &[Node]) {
    match el {
        Node::MdxJsxFlowElement(e) => (&e.attributes, &e.children),
        Node::MdxJsxTextElement(e) => (&e.attributes, &e.children),
        _ => (&[], &[]),
    }
}

fn children_of(node: &Node) -> &[Node] {
    match node {
        Node::Root(x) => &x.children,
        Node::Paragraph(x) => &x.children,
        Node::Heading(x) => &x.children,
        Node::Blockquote(x) => &x.children,
        Node::List(x) => &x.children,
        Node::ListItem(x) => &x.children,
        Node::Emphasis(x) => &x.children,
        Node::Strong(x) => &x.children,
        Node::Link(x) => &x.children,
        Node::MdxJsxFlowElement(x) => &x.children,
        Node::MdxJsxTextElement(x) => &x.children,
        _ => &[],
    }
}

/// The value of attribute `name` (Literal or the raw text of an expression), or `None`.
fn attr(attributes: &[AttributeContent], name: &str) -> Option<String> {
    for a in attributes {
        if let AttributeContent::Property(p) = a {
            if p.name == name {
                return Some(match &p.value {
                    Some(AttributeValue::Literal(s)) => s.clone(),
                    Some(AttributeValue::Expression(e)) => e.value.clone(),
                    None => String::new(),
                });
            }
        }
    }
    None
}

/// Extract text content from unknown-component children (text nodes + paragraph text),
/// space-joined and trimmed (mirrors the TS fallback comment body).
fn unknown_text_content(children: &[Node]) -> String {
    let mut parts: Vec<String> = Vec::new();
    for child in children {
        match child {
            Node::Text(t) => parts.push(t.value.clone()),
            Node::Paragraph(p) => {
                let inner: Vec<String> = p
                    .children
                    .iter()
                    .filter_map(|c| match c {
                        Node::Text(t) => Some(t.value.clone()),
                        _ => None,
                    })
                    .collect();
                parts.push(inner.join(" "));
            }
            _ => {}
        }
    }
    parts.join(" ").trim().to_string()
}

/// If `children` is a paragraph made up ENTIRELY of `import X from "path"` statements (one
/// per line — the fork captures ESM as text since it has no ESM parser), record each include
/// mapping (`./`|`/` → `~/`, `.mdx` → `.md`) and return `Some(())` to signal a strip.
fn try_capture_import(children: &[Node], mapping: &mut HashMap<String, String>) -> Option<()> {
    // Gather the paragraph's raw text; a hard break becomes a newline.
    let mut text = String::new();
    for child in children {
        match child {
            Node::Text(t) => text.push_str(&t.value),
            Node::Break(_) => text.push('\n'),
            _ => return None, // any non-text content ⇒ not an import-only paragraph
        }
    }
    let lines: Vec<&str> = text
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .collect();
    if lines.is_empty() {
        return None;
    }
    let mut parsed = Vec::new();
    for line in &lines {
        // A non-import line ⇒ leave the whole paragraph untouched.
        parsed.push(parse_import(line)?);
    }
    for (component, path) in parsed {
        mapping.insert(component, path);
    }
    Some(())
}

/// Parse one `import X from "path"` line into `(component, xyd_path)`.
fn parse_import(line: &str) -> Option<(String, String)> {
    let rest = line.strip_prefix("import ")?;
    let (component, after) = rest.split_once(" from ")?;
    let component = component.trim();
    if component.is_empty() || !component.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return None;
    }
    let path = after.trim().trim_matches(|c| c == '"' || c == '\'');
    if path.is_empty() {
        return None;
    }
    let mut xyd_path = path.to_string();
    if xyd_path.starts_with("./") || xyd_path.starts_with('/') {
        xyd_path = format!(
            "~/{}",
            xyd_path.trim_start_matches("./").trim_start_matches('/')
        );
    }
    if let Some(stripped) = xyd_path.strip_suffix(".mdx") {
        xyd_path = format!("{stripped}.md");
    }
    Some((component.to_string(), xyd_path))
}

fn decode_entities(s: &str) -> String {
    s.replace("&#x20;", " ")
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
}

/// The final post-serialize cleanups the TS applies (entity decode + unescape brackets).
fn cleanups(markdown: &str) -> String {
    markdown
        .replace("&#x20;", " ")
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("\\[", "[")
        .replace("\\]", "]")
        .replace("\\(", "(")
        .replace("\\)", ")")
}

fn is_block(md: &Md) -> bool {
    matches!(
        md,
        Md::Heading(..)
            | Md::Paragraph(_)
            | Md::List { .. }
            | Md::Code { .. }
            | Md::Blockquote(_)
            | Md::ThematicBreak
            | Md::Html(_)
            | Md::Directive { .. }
            | Md::Grid { .. }
            | Md::Steps(_)
            | Md::Tabs(_)
    )
}

/// Keep block nodes, and drop inline whitespace/softbreaks left over from hoisting.
fn keep_block_or_meaningful(md: &Md) -> bool {
    match md {
        Md::SoftBreak => false,
        Md::Text(s) => !s.trim().is_empty(),
        _ => true,
    }
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::path::Path;

    use super::convert_mdx;

    #[test]
    fn content_byte_parity_against_goldens() {
        let testdata = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("src/v0/migrateme/mintlify/content-testdata");
        let mut cases: Vec<String> = fs::read_dir(&testdata)
            .unwrap()
            .flatten()
            .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .collect();
        cases.sort();
        assert!(!cases.is_empty());

        let mut failures = Vec::new();
        for case in &cases {
            let dir = testdata.join(case);
            let input = dir.join("input.mdx");
            let expected_path = dir.join("expected.md");
            if !input.exists() || !expected_path.exists() {
                continue;
            }
            let expected = fs::read_to_string(&expected_path).unwrap();
            let actual = convert_mdx(&fs::read_to_string(&input).unwrap()).unwrap();
            if actual != expected {
                failures.push(case.clone());
                eprintln!("=== MISMATCH {case} ===\n--- expected ---\n{expected}\n--- actual ---\n{actual}\n");
            }
        }
        assert!(failures.is_empty(), "content mismatches: {failures:?}");
    }
}
