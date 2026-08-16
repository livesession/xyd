//! JS-runtime semantics helpers (Rust mirrors of the exact behaviors the JS
//! impl relies on). `js_object_keys` is a copy of the one in `xyd_openapi`
//! (small pure function; the two crates stay self-contained).

use serde_json::{Map, Value};
use std::collections::HashSet;

/// `Object.keys()` ordering for a JSON-derived object: array-index keys
/// (canonical unsigned ints < 2^32-1) ascending FIRST, then the remaining
/// keys in insertion order.
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

/// naming.ts `splitWords`: camelCase + ACRONYMBoundary splits, then split on
/// ANY non-alphanumeric run, lowercased.
pub fn split_words(input: &str) -> Vec<String> {
    // replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    let mut pass1 = String::with_capacity(input.len() + 8);
    let chars: Vec<char> = input.chars().collect();
    for (i, &c) in chars.iter().enumerate() {
        pass1.push(c);
        if let Some(&next) = chars.get(i + 1) {
            if (c.is_ascii_lowercase() || c.is_ascii_digit()) && next.is_ascii_uppercase() {
                pass1.push(' ');
            }
        }
    }
    // replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    let chars2: Vec<char> = pass1.chars().collect();
    let mut pass2 = String::with_capacity(pass1.len() + 8);
    for (i, &c) in chars2.iter().enumerate() {
        pass2.push(c);
        if c.is_ascii_uppercase() {
            if let (Some(&n1), Some(&n2)) = (chars2.get(i + 1), chars2.get(i + 2)) {
                if n1.is_ascii_uppercase() && n2.is_ascii_lowercase() {
                    pass2.push(' ');
                }
            }
        }
    }
    pass2
        .split(|c: char| !c.is_ascii_alphanumeric())
        .map(|w| w.trim().to_lowercase())
        .filter(|w| !w.is_empty())
        .collect()
}

pub fn kebab_case(input: &str) -> String {
    split_words(input).join("-")
}

pub fn pascal_case(input: &str) -> String {
    split_words(input)
        .iter()
        .map(|w| {
            let mut cs = w.chars();
            match cs.next() {
                Some(f) => f.to_uppercase().collect::<String>() + cs.as_str(),
                None => String::new(),
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

/// unique.ts `uniqueName`: suffix 2, 3, … on collision; registers the result.
pub fn unique_name(base: &str, used: &mut HashSet<String>) -> String {
    let mut name = base.to_string();
    let mut i = 2u32;
    while used.contains(&name) {
        name = format!("{base}{i}");
        i += 1;
    }
    used.insert(name.clone());
    name
}

/// JSON.stringify-style stable stringify with SORTED object keys — the
/// structural-hash key for inline-type dedup (nominal.ts `stableStringify`).
/// Integral f64s collapse to integer text so 1 and 1.0 land in the same
/// equality class, matching the single JS Number type.
pub fn stable_stringify(v: &Value) -> String {
    match v {
        Value::Array(arr) => {
            let inner: Vec<String> = arr.iter().map(stable_stringify).collect();
            format!("[{}]", inner.join(","))
        }
        Value::Object(map) => {
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            let entries: Vec<String> = keys
                .into_iter()
                .map(|k| {
                    format!(
                        "{}:{}",
                        serde_json::to_string(k).unwrap(),
                        stable_stringify(&map[k])
                    )
                })
                .collect();
            format!("{{{}}}", entries.join(","))
        }
        Value::Number(n) => {
            if let Some(f) = n.as_f64() {
                if f.fract() == 0.0 && f.abs() < 9.007_199_254_740_992e15 {
                    return format!("{}", f as i64);
                }
            }
            n.to_string()
        }
        other => serde_json::to_string(other).unwrap(),
    }
}
