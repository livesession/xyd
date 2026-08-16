//! Identifier casing helpers, ported verbatim from `naming.ts`.

fn is_upper(c: char) -> bool {
    c.is_ascii_uppercase()
}
fn is_lower(c: char) -> bool {
    c.is_ascii_lowercase()
}
fn is_lower_or_digit(c: char) -> bool {
    c.is_ascii_lowercase() || c.is_ascii_digit()
}

/// `s.replace(/([a-z0-9])([A-Z])/g, '$1 $2')` — space between a lower/digit and an upper.
fn split_lower_upper(s: &str) -> String {
    let chars: Vec<char> = s.chars().collect();
    let mut out = String::new();
    for i in 0..chars.len() {
        if i > 0 && is_lower_or_digit(chars[i - 1]) && is_upper(chars[i]) {
            out.push(' ');
        }
        out.push(chars[i]);
    }
    out
}

/// `s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')` — split an all-caps run that is
/// immediately followed by a lowercase (e.g. "APIKey" -> "API Key"). Matches the
/// greedy, left-to-right, non-overlapping regex semantics.
fn split_upper_run(s: &str) -> String {
    let chars: Vec<char> = s.chars().collect();
    let mut out = String::new();
    let mut i = 0;
    while i < chars.len() {
        if is_upper(chars[i]) {
            let mut j = i;
            while j < chars.len() && is_upper(chars[j]) {
                j += 1;
            }
            // group1 = [A-Z]+ (>=1), group2 = [A-Z][a-z]: needs run len >=2 and a
            // trailing lowercase; the greedy [A-Z]+ leaves the last upper to group2.
            if j - i >= 2 && j < chars.len() && is_lower(chars[j]) {
                for &c in &chars[i..j - 1] {
                    out.push(c);
                }
                out.push(' ');
                out.push(chars[j - 1]);
                out.push(chars[j]);
                i = j + 1;
                continue;
            }
            for &c in &chars[i..j] {
                out.push(c);
            }
            i = j;
            continue;
        }
        out.push(chars[i]);
        i += 1;
    }
    out
}

/// Split an identifier (camel/snake/kebab/space/dot) into lowercase words.
pub fn split_words(input: &str) -> Vec<String> {
    let transformed = split_upper_run(&split_lower_upper(input));
    transformed
        .split(|c: char| !c.is_ascii_alphanumeric())
        .filter(|w| !w.is_empty())
        .map(str::to_ascii_lowercase)
        .collect()
}

/// Prefix `_` when an identifier would start with a digit (illegal in Python).
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

/// PascalCase, e.g. "pet-list" -> "PetList".
pub fn pascal_case(input: &str) -> String {
    let s: String = split_words(input)
        .iter()
        .map(|w| {
            let mut c = w.chars();
            match c.next() {
                Some(first) => first.to_ascii_uppercase().to_string() + c.as_str(),
                None => String::new(),
            }
        })
        .collect();
    safe_ident(&s)
}

/// snake_case (Python identifiers), e.g. "petId" -> "pet_id".
pub fn snake_case(input: &str) -> String {
    let s = safe_ident(&split_words(input).join("_"));
    if PY_KEYWORDS.contains(&s.as_str()) {
        format!("{s}_")
    } else {
        s
    }
}

/// A Python module/package name: snake_case, alphanumerics + underscore only.
pub fn py_module_name(input: &str) -> String {
    let s: String = split_words(input)
        .join("_")
        .chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == '_')
        .collect();
    if s.is_empty() {
        "client".to_string()
    } else {
        s
    }
}

/// SCREAMING_SNAKE_CASE, e.g. "petstore" -> "PETSTORE".
pub fn screaming_snake_case(input: &str) -> String {
    let joined: String = split_words(input)
        .join("_")
        .to_ascii_uppercase()
        .chars()
        .filter(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || *c == '_')
        .collect();
    safe_ident(&joined)
}

const PY_KEYWORDS: &[&str] = &[
    "and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif",
    "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda",
    "none", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield",
];
