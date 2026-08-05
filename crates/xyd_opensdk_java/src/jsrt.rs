//! naming.ts + the JS `JSON.stringify(string)` / `String(value)` coercions the
//! Java emitter relies on. Byte-exactness of the generated Java depends on
//! these matching the JS exactly.

use std::collections::HashSet;

/// naming.ts `splitWords`: camelCase + ACRONYM boundaries, then split on ANY
/// non-alphanumeric run, lowercased.
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

fn capitalize(w: &str) -> String {
    let mut cs = w.chars();
    match cs.next() {
        Some(f) => f.to_uppercase().collect::<String>() + cs.as_str(),
        None => String::new(),
    }
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
    safe_ident(
        &split_words(input)
            .iter()
            .map(|w| capitalize(w))
            .collect::<String>(),
    )
}

pub fn camel_case(input: &str) -> String {
    let words = split_words(input);
    if words.is_empty() {
        return "value".to_string();
    }
    let mut name = words[0].clone();
    for w in &words[1..] {
        name.push_str(&capitalize(w));
    }
    let name = safe_ident(&name);
    if java_keyword(&name) {
        format!("{name}_")
    } else {
        name
    }
}

const UNCOUNTABLE: [&str; 3] = ["data", "media", "series"];

pub fn singularize(word: &str) -> String {
    if word.len() < 3 || UNCOUNTABLE.contains(&word) {
        return word.to_string();
    }
    if word.ends_with("ies") && word.len() > 4 {
        return format!("{}y", &word[..word.len() - 3]);
    }
    // /(?:sses|xes|ches|shes|uses)$/
    if word.len() > 4
        && (word.ends_with("sses")
            || word.ends_with("xes")
            || word.ends_with("ches")
            || word.ends_with("shes")
            || word.ends_with("uses"))
    {
        return word[..word.len() - 2].to_string();
    }
    // /(?:ss|us|is)$/
    if word.ends_with("ss") || word.ends_with("us") || word.ends_with("is") {
        return word.to_string();
    }
    if let Some(stripped) = word.strip_suffix('s') {
        return stripped.to_string();
    }
    word.to_string()
}

pub fn singular_pascal_case(input: &str) -> String {
    let words = split_words(input);
    if words.is_empty() {
        return String::new();
    }
    let last = words.len() - 1;
    let joined: String = words
        .iter()
        .enumerate()
        .map(|(i, w)| {
            if i == last {
                capitalize(&singularize(w))
            } else {
                capitalize(w)
            }
        })
        .collect();
    safe_ident(&joined)
}

pub fn resource_qualifier(segments: &[String]) -> String {
    segments.iter().map(|s| singular_pascal_case(s)).collect()
}

pub fn service_type_name(segments: &[String]) -> String {
    format!("{}Service", resource_qualifier(segments))
}

pub fn java_method_name(action: &str) -> String {
    match action {
        "create" | "list" | "retrieve" | "update" | "delete" => action.to_string(),
        _ => camel_case(action),
    }
}

pub fn screaming_snake_case(input: &str) -> String {
    let s: String = split_words(input)
        .join("_")
        .to_uppercase()
        .chars()
        .filter(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || *c == '_')
        .collect();
    let s = safe_ident(&s);
    if s.is_empty() {
        "VALUE".to_string()
    } else {
        s
    }
}

pub fn java_package_name(input: &str) -> String {
    let clean: String = split_words(input)
        .join("")
        .chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
        .collect();
    if clean.is_empty() {
        "client".to_string()
    } else {
        clean
    }
}

/// JS `JSON.stringify(s)` for a string value: double-quoted, with JS escaping
/// (`"` `\` control chars → `\uXXXX`, the named short escapes; `/` and
/// non-ASCII are NOT escaped).
pub fn json_str(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            '\u{08}' => out.push_str("\\b"),
            '\u{0c}' => out.push_str("\\f"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// Dedup + lexicographic sort (`[...new Set(imports)].sort()`).
pub fn unique_sorted(items: &[String]) -> Vec<String> {
    let mut seen = HashSet::new();
    let mut uniq: Vec<String> = Vec::new();
    for i in items {
        if seen.insert(i.clone()) {
            uniq.push(i.clone());
        }
    }
    uniq.sort();
    uniq
}

fn java_keyword(s: &str) -> bool {
    const KW: &[&str] = &[
        "abstract",
        "assert",
        "boolean",
        "break",
        "byte",
        "case",
        "catch",
        "char",
        "class",
        "const",
        "continue",
        "default",
        "do",
        "double",
        "else",
        "enum",
        "extends",
        "final",
        "finally",
        "float",
        "for",
        "goto",
        "if",
        "implements",
        "import",
        "instanceof",
        "int",
        "interface",
        "long",
        "native",
        "new",
        "package",
        "private",
        "protected",
        "public",
        "return",
        "short",
        "static",
        "strictfp",
        "super",
        "switch",
        "synchronized",
        "this",
        "throw",
        "throws",
        "transient",
        "try",
        "void",
        "volatile",
        "while",
        "true",
        "false",
        "null",
        "var",
        "record",
        "yield",
    ];
    KW.contains(&s)
}
