//! Tiny Rust-source string writer — port of rswriter.ts. Byte-identical
//! indentation / doc-comment / brace rules.

/// Indent every non-empty line by `spaces` (blank lines stay blank).
pub fn indent(text: &str, spaces: usize) -> String {
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

/// A Rust `/// ...` doc-comment block, or "" when empty.
pub fn rs_doc(text: Option<&str>) -> String {
    let raw = text.unwrap_or("").trim();
    if raw.is_empty() {
        return String::new();
    }
    raw.split('\n')
        .map(|line| {
            if line.trim().is_empty() {
                "///".to_string()
            } else {
                format!("/// {}", line.trim())
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// A Rust double-quoted string literal (JSON escaping is Rust-compatible for
/// our inputs) — matches JS `JSON.stringify(value)`.
pub fn rs_string(value: &str) -> String {
    serde_json::to_string(value).expect("string serializes")
}

/// `#[derive(...)]` attribute line.
pub fn derive_line(traits: &[&str]) -> String {
    format!("#[derive({})]", traits.join(", "))
}

/// Wrap `body` in `<header> {\n  <body>\n}` (empty body → `<header> {}`).
pub fn braced(header: &str, body: &str) -> String {
    if body.trim().is_empty() {
        format!("{header} {{}}")
    } else {
        format!("{header} {{\n{}\n}}", indent(body, 4))
    }
}
