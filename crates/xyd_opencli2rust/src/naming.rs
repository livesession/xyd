//! Rust naming helpers — port of naming.ts. NOTE this package's `splitWords`
//! splits on ANY non-alphanumeric run (unlike some sibling generators).

use std::collections::HashSet;

/// Split an identifier (camel/snake/kebab/space/dot) into lowercase words.
pub fn split_words(input: &str) -> Vec<String> {
    // replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    let chars: Vec<char> = input.chars().collect();
    let mut pass1 = String::with_capacity(input.len() + 8);
    for (i, &c) in chars.iter().enumerate() {
        pass1.push(c);
        if let Some(&next) = chars.get(i + 1) {
            if (c.is_ascii_lowercase() || c.is_ascii_digit()) && next.is_ascii_uppercase() {
                pass1.push(' ');
            }
        }
    }
    // replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    let c2: Vec<char> = pass1.chars().collect();
    let mut pass2 = String::with_capacity(pass1.len() + 8);
    for (i, &c) in c2.iter().enumerate() {
        pass2.push(c);
        if c.is_ascii_uppercase() {
            if let (Some(&n1), Some(&n2)) = (c2.get(i + 1), c2.get(i + 2)) {
                if n1.is_ascii_uppercase() && n2.is_ascii_lowercase() {
                    pass2.push(' ');
                }
            }
        }
    }
    // split(/[^a-zA-Z0-9]+/)
    pass2
        .split(|c: char| !c.is_ascii_alphanumeric())
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

/// PascalCase for Rust structs/enums/variants.
#[allow(dead_code)]
pub fn pascal_case(input: &str) -> String {
    let joined: String = split_words(input)
        .iter()
        .map(|w| {
            let mut cs = w.chars();
            match cs.next() {
                Some(f) => f.to_uppercase().collect::<String>() + cs.as_str(),
                None => String::new(),
            }
        })
        .collect();
    let s = safe_ident(&joined);
    if s.is_empty() {
        "Value".to_string()
    } else {
        s
    }
}

/// snake_case for Rust modules/fields/fns, keyword-guarded with a trailing `_`.
pub fn snake_case(input: &str) -> String {
    let joined = safe_ident(&split_words(input).join("_"));
    let s = if joined.is_empty() {
        "field".to_string()
    } else {
        joined
    };
    if rust_keywords().contains(s.as_str()) {
        format!("{s}_")
    } else {
        s
    }
}

/// SCREAMING_SNAKE_CASE env-var prefix.
pub fn screaming_snake_case(input: &str) -> String {
    let up: String = split_words(input)
        .join("_")
        .to_uppercase()
        .chars()
        .filter(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || *c == '_')
        .collect();
    let s = safe_ident(&up);
    if s.is_empty() {
        "VALUE".to_string()
    } else {
        s
    }
}

/// A Cargo package name (snake_case, alnum + underscore).
pub fn crate_name(input: &str) -> String {
    let cleaned: String = split_words(input)
        .join("_")
        .chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == '_')
        .collect();
    let s = safe_ident(&cleaned);
    if s.is_empty() {
        "cli".to_string()
    } else {
        s
    }
}

/// Slug for a binary name.
pub fn slug(input: &str) -> String {
    split_words(input)
        .join("-")
        .chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == '-')
        .collect()
}

fn rust_keywords() -> &'static HashSet<&'static str> {
    use std::sync::OnceLock;
    static KW: OnceLock<HashSet<&'static str>> = OnceLock::new();
    KW.get_or_init(|| {
        [
            "as", "break", "const", "continue", "crate", "dyn", "else", "enum", "extern", "false",
            "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub",
            "ref", "return", "self", "static", "struct", "super", "trait", "true", "type",
            "unsafe", "use", "where", "while", "async", "await", "abstract", "become", "box", "do",
            "final", "macro", "override", "priv", "typeof", "unsized", "virtual", "yield", "try",
            "union",
        ]
        .into_iter()
        .collect()
    })
}
