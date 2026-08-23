//! The post-transform output model (`Md`) + a hand-written markdown serializer that
//! reproduces the byte-exact output of `remark-stringify` + `remark-directive` for the
//! FIXED set of shapes the Mintlify content transform emits (migrateme S3).
//!
//! We control both the transform (which builds `Md`) and this serializer, so `Md` is a
//! clean model tuned to the goldens rather than a faithful mdast mirror. Directive fences
//! grow (`:::` → `::::`) to exceed any nested directive; grid/steps/tabs have bespoke
//! layouts matching remark's rendering of the structures the TS transform builds.

/// A node in the post-transform tree. Block and inline variants share one enum.
pub enum Md {
    // Blocks
    Heading(u8, Vec<Md>),
    Paragraph(Vec<Md>),
    List {
        ordered: bool,
        start: Option<u32>,
        spread: bool,
        items: Vec<Vec<Md>>,
    },
    Code {
        lang: Option<String>,
        value: String,
    },
    Blockquote(Vec<Md>),
    ThematicBreak,
    Html(String),
    /// A simple block directive: `:::name{attrs}` … `:::` (callout, subtitle, guide-card).
    Directive {
        name: String,
        attrs: String,
        body: Vec<Md>,
    },
    /// `::::grid{attrs}` wrapping guide-card directives in a `- - …` list.
    Grid {
        attrs: String,
        cards: Vec<Md>,
    },
    /// `:::steps{kind="secondary"}` with `. ` ordered items, body inline on the marker line.
    Steps(Vec<StepItem>),
    /// `:::tabs{kind="secondary"}` with `. ` items: a title line + indented body.
    Tabs(Vec<TabItem>),

    // Inline
    Text(String),
    Strong(Vec<Md>),
    Emphasis(Vec<Md>),
    InlineCode(String),
    Link {
        url: String,
        title: Option<String>,
        children: Vec<Md>,
    },
    Image {
        url: String,
        alt: String,
    },
    SoftBreak,
}

pub struct StepItem {
    /// e.g. `[icon="download" title="Install"] ` (includes the trailing space) — may be empty.
    pub prefix: String,
    pub body: Vec<Md>,
}

pub struct TabItem {
    pub title: String,
    pub type_value: String,
    pub body: Vec<Md>,
}

impl Md {
    fn is_block(&self) -> bool {
        matches!(
            self,
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
}

/// Serialize a list of top-level blocks: joined by blank lines, with a trailing newline
/// (matching remark-stringify's document output).
pub fn serialize(blocks: &[Md]) -> String {
    let body = blocks
        .iter()
        .map(serialize_block)
        .collect::<Vec<_>>()
        .join("\n\n");
    format!("{body}\n")
}

fn serialize_block(node: &Md) -> String {
    match node {
        Md::Heading(depth, children) => {
            format!(
                "{} {}",
                "#".repeat(*depth as usize),
                serialize_inline(children)
            )
        }
        Md::Paragraph(children) => serialize_inline(children),
        Md::List {
            ordered,
            start,
            spread,
            items,
        } => serialize_list(*ordered, *start, *spread, items),
        Md::Code { lang, value } => {
            let fence = "`".repeat(std::cmp::max(3, longest_backtick_run(value) + 1));
            format!(
                "{fence}{}\n{}\n{fence}",
                lang.as_deref().unwrap_or(""),
                value
            )
        }
        Md::Blockquote(children) => {
            let inner = children
                .iter()
                .map(serialize_block)
                .collect::<Vec<_>>()
                .join("\n\n");
            inner
                .lines()
                .map(|l| {
                    if l.is_empty() {
                        ">".to_string()
                    } else {
                        format!("> {l}")
                    }
                })
                .collect::<Vec<_>>()
                .join("\n")
        }
        Md::ThematicBreak => "***".to_string(),
        Md::Html(value) => value.clone(),
        Md::Directive { name, attrs, body } => serialize_directive(name, attrs, body),
        Md::Grid { attrs, cards } => serialize_grid(attrs, cards),
        Md::Steps(items) => serialize_steps(items),
        Md::Tabs(items) => serialize_tabs(items),
        // Inline nodes should never reach block context, but degrade gracefully.
        other => serialize_inline(std::slice::from_ref(other)),
    }
}

fn serialize_inline(children: &[Md]) -> String {
    let mut out = String::new();
    for child in children {
        match child {
            Md::Text(s) => out.push_str(s),
            Md::Strong(c) => out.push_str(&format!("**{}**", serialize_inline(c))),
            Md::Emphasis(c) => out.push_str(&format!("*{}*", serialize_inline(c))),
            Md::InlineCode(s) => out.push_str(&inline_code(s)),
            Md::Link {
                url,
                title,
                children,
            } => {
                let suffix = title
                    .as_ref()
                    .map(|t| format!(" \"{t}\""))
                    .unwrap_or_default();
                out.push_str(&format!("[{}]({url}{suffix})", serialize_inline(children)))
            }
            Md::Image { url, alt } => out.push_str(&format!("![{alt}]({url})")),
            Md::SoftBreak => out.push('\n'),
            // A block that ended up in inline context (e.g. a paragraph wrapping another
            // paragraph): inline it (flatten) — matches remark's block-in-paragraph output.
            Md::Paragraph(c) => out.push_str(&serialize_inline(c)),
            block if block.is_block() => out.push_str(&serialize_block(block)),
            _ => {}
        }
    }
    out
}

/// A list with `- ` / `<n>. ` markers (ordered lists honor `start`), continuation lines
/// indented by the marker width; loose (`spread`) lists put a blank line between items and
/// between an item's own blocks.
fn serialize_list(ordered: bool, start: Option<u32>, spread: bool, items: &[Vec<Md>]) -> String {
    let base = start.unwrap_or(1) as usize;
    let sep = if spread { "\n\n" } else { "\n" };
    let mut item_strs: Vec<String> = Vec::new();
    for (i, item) in items.iter().enumerate() {
        let marker = if ordered {
            format!("{}. ", base + i)
        } else {
            "- ".to_string()
        };
        let indent = " ".repeat(marker.len());
        let content = item
            .iter()
            .map(serialize_block)
            .collect::<Vec<_>>()
            .join(sep);
        let mut lines: Vec<String> = Vec::new();
        for (j, line) in content.split('\n').enumerate() {
            if j == 0 {
                lines.push(format!("{marker}{line}"));
            } else if line.is_empty() {
                lines.push(String::new());
            } else {
                lines.push(format!("{indent}{line}"));
            }
        }
        item_strs.push(lines.join("\n"));
    }
    item_strs.join(sep)
}

/// The longest run of consecutive backticks in `s` (for code-fence sizing).
fn longest_backtick_run(s: &str) -> usize {
    let mut max = 0;
    let mut run = 0;
    for c in s.chars() {
        if c == '`' {
            run += 1;
            max = max.max(run);
        } else {
            run = 0;
        }
    }
    max
}

/// Inline code with a backtick fence wide enough to contain any backticks, padded with a
/// space when the value begins or ends with a backtick (remark's rule).
fn inline_code(s: &str) -> String {
    let fence = "`".repeat(longest_backtick_run(s) + 1);
    if s.starts_with('`') || s.ends_with('`') {
        format!("{fence} {s} {fence}")
    } else {
        format!("{fence}{s}{fence}")
    }
}

/// The number of colons for a directive whose body may contain nested directives.
fn fence_len(body: &[Md]) -> usize {
    fn inner(node: &Md) -> usize {
        match node {
            Md::Directive { body, .. } => fence_len(body),
            Md::Grid { cards, .. } => fence_len(cards),
            Md::Steps(_) | Md::Tabs(_) => 3,
            Md::List { items, .. } => items.iter().flatten().map(inner).max().unwrap_or(0),
            Md::Blockquote(c) | Md::Paragraph(c) | Md::Heading(_, c) => {
                c.iter().map(inner).max().unwrap_or(0)
            }
            _ => 0,
        }
    }
    let deepest = body.iter().map(inner).max().unwrap_or(0);
    std::cmp::max(3, deepest + 1)
}

fn directive_open(name: &str, attrs: &str, fence: usize) -> String {
    let colons = ":".repeat(fence);
    if attrs.is_empty() {
        format!("{colons}{name}")
    } else {
        format!("{colons}{name}{{{attrs}}}")
    }
}

fn serialize_directive(name: &str, attrs: &str, body: &[Md]) -> String {
    let fence = fence_len(body);
    let open = directive_open(name, attrs, fence);
    let close = ":".repeat(fence);
    let inner = body
        .iter()
        .map(serialize_block)
        .collect::<Vec<_>>()
        .join("\n\n");
    if inner.is_empty() {
        format!("{open}\n{close}")
    } else {
        format!("{open}\n{inner}\n{close}")
    }
}

/// `::::grid{…}` wrapping guide-cards as `- - <card>` with 4-space-indented continuations
/// (the exact remark rendering of the list-of-listItems the TS transform builds).
fn serialize_grid(attrs: &str, cards: &[Md]) -> String {
    let fence = fence_len(cards);
    let colons = ":".repeat(fence);
    let mut lines: Vec<String> = vec![directive_open("grid", attrs, fence)];
    for (i, card) in cards.iter().enumerate() {
        let card_str = serialize_block(card);
        for (j, line) in card_str.lines().enumerate() {
            if i == 0 && j == 0 {
                lines.push(format!("- - {line}"));
            } else {
                lines.push(format!("    {line}"));
            }
        }
    }
    lines.push(colons);
    lines.join("\n")
}

fn serialize_steps(items: &[StepItem]) -> String {
    let mut lines: Vec<String> = vec![":::steps{kind=\"secondary\"}".to_string()];
    for item in items {
        lines.push(format!(". {}{}", item.prefix, serialize_inline(&item.body)));
    }
    lines.push(":::".to_string());
    lines.join("\n")
}

fn serialize_tabs(items: &[TabItem]) -> String {
    let mut lines: Vec<String> = vec![":::tabs{kind=\"secondary\"}".to_string()];
    for item in items {
        lines.push(format!(". [{}](type={})", item.title, item.type_value));
        for line in serialize_inline(&item.body).lines() {
            lines.push(format!("  {line}"));
        }
    }
    lines.push(":::".to_string());
    lines.join("\n")
}
