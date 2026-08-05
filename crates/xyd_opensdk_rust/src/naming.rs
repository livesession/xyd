//! Rust naming — port of packages/xyd-opensdk-rust/src/naming.ts. Keyword
//! guards + snake/pascal/screaming/crate rules, byte-identical.

/// splitWords: camel + ACRONYM boundaries, split on any non-alphanumeric,
/// lowercased.
pub fn split_words(input: &str) -> Vec<String> {
    // replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    let chars: Vec<char> = input.chars().collect();
    let mut p1 = String::with_capacity(input.len() + 8);
    for (i, &c) in chars.iter().enumerate() {
        p1.push(c);
        if let Some(&n) = chars.get(i + 1) {
            if (c.is_ascii_lowercase() || c.is_ascii_digit()) && n.is_ascii_uppercase() {
                p1.push(' ');
            }
        }
    }
    // replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    let c2: Vec<char> = p1.chars().collect();
    let mut p2 = String::with_capacity(p1.len() + 8);
    for (i, &c) in c2.iter().enumerate() {
        p2.push(c);
        if c.is_ascii_uppercase() {
            if let (Some(&n1), Some(&n2)) = (c2.get(i + 1), c2.get(i + 2)) {
                if n1.is_ascii_uppercase() && n2.is_ascii_lowercase() {
                    p2.push(' ');
                }
            }
        }
    }
    p2.split(|c: char| !c.is_ascii_alphanumeric())
        .map(|w| w.trim().to_lowercase())
        .filter(|w| !w.is_empty())
        .collect()
}

/// Prefix `_` when an identifier would start with a digit.
fn safe_ident(s: &str) -> String {
    if s.chars()
        .next()
        .map(|c| c.is_ascii_digit())
        .unwrap_or(false)
    {
        format!("_{s}")
    } else {
        s.to_string()
    }
}

pub fn pascal_case(input: &str) -> String {
    let s: String = split_words(input)
        .iter()
        .map(|w| {
            let mut cs = w.chars();
            match cs.next() {
                Some(f) => f.to_uppercase().collect::<String>() + cs.as_str(),
                None => String::new(),
            }
        })
        .collect();
    let s = safe_ident(&s);
    if s.is_empty() {
        "Value".to_string()
    } else {
        s
    }
}

pub fn snake_case(input: &str) -> String {
    let joined = safe_ident(&split_words(input).join("_"));
    let s = if joined.is_empty() {
        "field".to_string()
    } else {
        joined
    };
    if RUST_KEYWORDS.contains(&s.as_str()) {
        format!("{s}_")
    } else {
        s
    }
}

pub fn screaming_snake_case(input: &str) -> String {
    let up = split_words(input).join("_").to_uppercase();
    let filtered: String = up
        .chars()
        .filter(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || *c == '_')
        .collect();
    let s = safe_ident(&filtered);
    if s.is_empty() {
        "VALUE".to_string()
    } else {
        s
    }
}

pub fn crate_name(input: &str) -> String {
    let joined = split_words(input).join("_");
    let s: String = joined
        .chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == '_')
        .collect();
    if s.is_empty() {
        "client".to_string()
    } else {
        s
    }
}

pub fn rust_method_name(action: &str) -> String {
    snake_case(action)
}

const RUST_KEYWORDS: &[&str] = &[
    "as", "break", "const", "continue", "crate", "dyn", "else", "enum", "extern", "false", "fn",
    "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref",
    "return", "self", "static", "struct", "super", "trait", "true", "type", "unsafe", "use",
    "where", "while", "async", "await", "abstract", "become", "box", "do", "final", "macro",
    "override", "priv", "typeof", "unsized", "virtual", "yield", "try", "union",
];
