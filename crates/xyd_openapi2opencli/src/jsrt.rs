//! JS-runtime semantics helpers — ports of naming.ts + unique.ts + the
//! Object.keys / String() coercions openapi2opencli relies on.

use serde_json::{Map, Value};
use std::collections::HashSet;

/// naming.ts `splitWords`: camelCase + ACRONYM boundaries, then split on
/// `[\s_\-./]+`, lowercased.
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
    pass2
        .split(|c: char| c.is_whitespace() || matches!(c, '_' | '-' | '.' | '/'))
        .map(|w| w.trim().to_lowercase())
        .filter(|w| !w.is_empty())
        .collect()
}

pub fn kebab_case(input: &str) -> String {
    split_words(input).join("-")
}

pub fn camel_case(input: &str) -> String {
    split_words(input)
        .iter()
        .enumerate()
        .map(|(i, w)| {
            if i == 0 {
                w.clone()
            } else {
                let mut cs = w.chars();
                match cs.next() {
                    Some(f) => f.to_uppercase().collect::<String>() + cs.as_str(),
                    None => String::new(),
                }
            }
        })
        .collect()
}

pub fn screaming_snake_case(input: &str) -> String {
    split_words(input).join("_").to_uppercase()
}

/// naming.ts `slug`: join('-') then strip anything outside [a-z0-9-].
pub fn slug(input: &str) -> String {
    split_words(input)
        .join("-")
        .chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == '-')
        .collect()
}

/// unique.ts `uniqueName`: suffix `-2`, `-3`, … on collision.
pub fn unique_name(base: &str, used: &mut HashSet<String>) -> String {
    let mut name = base.to_string();
    let mut i = 2u32;
    while used.contains(&name) {
        name = format!("{base}-{i}");
        i += 1;
    }
    used.insert(name.clone());
    name
}

/// `Object.keys()` ordering: array-index keys ascending first, then the rest
/// in insertion order.
pub fn js_object_keys(map: &Map<String, Value>) -> Vec<&String> {
    let mut numeric: Vec<(&String, u32)> = Vec::new();
    let mut rest: Vec<&String> = Vec::new();
    for k in map.keys() {
        match as_array_index(k) {
            Some(n) => numeric.push((k, n)),
            None => rest.push(k),
        }
    }
    numeric.sort_by_key(|(_, n)| *n);
    numeric.into_iter().map(|(k, _)| k).chain(rest).collect()
}

fn as_array_index(key: &str) -> Option<u32> {
    if key.is_empty() || key.len() > 10 {
        return None;
    }
    if key != "0" && key.starts_with('0') {
        return None;
    }
    let n: u64 = key.parse().ok()?;
    if n < u32::MAX as u64 {
        Some(n as u32)
    } else {
        None
    }
}

/// JS `String(value)` coercion for enum values (getEnum maps `String(v)`).
pub fn js_string(v: &Value) -> String {
    match v {
        Value::Null => "null".to_string(),
        Value::Bool(b) => b.to_string(),
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        // Objects/arrays: JS String() → "[object Object]" / comma-joined; enum
        // values are scalars in practice, so this branch is inert.
        Value::Array(a) => a.iter().map(js_string).collect::<Vec<_>>().join(","),
        Value::Object(_) => "[object Object]".to_string(),
    }
}

/// JS truthiness for a JSON value.
pub fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64().map(|f| f != 0.0).unwrap_or(true),
        Some(_) => true,
    }
}

/// `String.prototype.localeCompare` for ASCII command names — the tree sort
/// key. For the kebab-case ASCII names produced here this is byte ordering.
pub fn locale_compare(a: &str, b: &str) -> std::cmp::Ordering {
    a.cmp(b)
}
