//! Port of packages/xyd-opensdk-ruby/src/naming.rs — identifier casing +
//! Ruby keyword guarding, byte-identical to the TS naming.ts.

/// splitWords: camel/ACRONYM boundaries, then split on any non-alphanumeric,
/// lowercased.
pub fn split_words(input: &str) -> Vec<String> {
    let chars: Vec<char> = input.chars().collect();
    // replace(/([a-z0-9])([A-Z])/g, '$1 $2')
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
    safe_ident(&s)
}

pub fn snake_case(input: &str) -> String {
    let s = safe_ident(&split_words(input).join("_"));
    if is_ruby_keyword(&s) {
        format!("{s}_")
    } else {
        s
    }
}

pub fn screaming_snake_case(input: &str) -> String {
    let joined = split_words(input).join("_").to_uppercase();
    let filtered: String = joined
        .chars()
        .filter(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || *c == '_')
        .collect();
    // A Ruby CONSTANT must start with an uppercase letter. A purely-numeric enum
    // value ("4", "1024") would otherwise start with a digit; a bare `_` prefix
    // (`_4`) is not a valid constant AND — for _1.._9 — is a reserved numbered
    // parameter, a SyntaxError on Ruby >= 2.7. Prefix `NUMBER_` so the member
    // stays a valid, referenceable constant. Mirrors the JS twin in
    // packages/xyd-opensdk-ruby/src/naming.ts (kept in parity).
    if filtered
        .chars()
        .next()
        .map(|c| c.is_ascii_digit())
        .unwrap_or(false)
    {
        format!("NUMBER_{filtered}")
    } else {
        filtered
    }
}

/// rubyGemName: snake_case, alnum + underscore; "client" fallback.
pub fn ruby_gem_name(input: &str) -> String {
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

/// rubyMethodName: snake_case (keyword-guarded).
pub fn ruby_method_name(action: &str) -> String {
    snake_case(action)
}

fn is_ruby_keyword(s: &str) -> bool {
    // Exactly the TS RUBY_KEYWORDS set (36 lowercase keywords).
    const KW: [&str; 36] = [
        "alias", "and", "begin", "break", "case", "class", "def", "defined", "do", "else", "elsif",
        "end", "ensure", "false", "for", "if", "in", "module", "next", "nil", "not", "or", "redo",
        "rescue", "retry", "return", "self", "super", "then", "true", "undef", "unless", "until",
        "when", "while", "yield",
    ];
    KW.contains(&s)
}
