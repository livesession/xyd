//! Port of rbwriter.ts — the tiny string-emitting Ruby writer.

/// Indent every non-empty line by `spaces` (blank lines stay blank).
pub fn indent_n(text: &str, spaces: usize) -> String {
    let pad = " ".repeat(spaces);
    text.split('\n')
        .map(|line| {
            if line.is_empty() {
                line.to_string()
            } else {
                format!("{pad}{line}")
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// indent(text) with the default 2 spaces.
pub fn indent(text: &str) -> String {
    indent_n(text, 2)
}

/// A `# ...` comment block from free text, or "" when empty. Mirrors the TS
/// `rbComment`: trim outer whitespace, then per line `# <trimmed>` or `#`.
pub fn rb_comment(text: &str) -> String {
    let raw = text.trim();
    if raw.is_empty() {
        return String::new();
    }
    raw.split('\n')
        .map(|line| {
            let t = line.trim();
            if t.is_empty() {
                "#".to_string()
            } else {
                format!("# {t}")
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// `<header>\n  <body>\nend` block.
pub fn block(header: &str, body: &str) -> String {
    format!("{header}\n{}\nend", indent(body))
}

/// A Ruby double-quoted string literal (JSON.stringify — JSON escaping is
/// Ruby-compatible for our inputs).
pub fn rb_string(value: &str) -> String {
    serde_json::to_string(value).unwrap()
}
