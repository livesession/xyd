//! Naming helpers shared (as per-crate copies, the workspace convention) with
//! the other converter crates — see xyd_openapi2opensdk/src/jsrt.rs and
//! xyd_openapi2opencli/src/jsrt.rs. Small pure functions; the crates stay
//! self-contained.

use serde_json::Value;
use std::collections::HashSet;

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

pub fn camel_case(input: &str) -> String {
    split_words(input)
        .iter()
        .enumerate()
        .map(|(i, w)| if i == 0 { w.clone() } else { capitalize(w) })
        .collect()
}

pub fn pascal_case(input: &str) -> String {
    split_words(input).iter().map(|w| capitalize(w)).collect()
}

fn capitalize(w: &str) -> String {
    let mut cs = w.chars();
    match cs.next() {
        Some(f) => f.to_uppercase().collect::<String>() + cs.as_str(),
        None => String::new(),
    }
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
/// structural-hash key for enum-type dedup. Integral f64s collapse to integer
/// text so 1 and 1.0 land in the same equality class.
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn casing() {
        assert_eq!(camel_case("log-level"), "logLevel");
        assert_eq!(camel_case("logLevel"), "logLevel");
        assert_eq!(camel_case("component"), "component");
        assert_eq!(kebab_case("logLevel"), "log-level");
        assert_eq!(kebab_case("migrateme"), "migrateme");
        assert_eq!(
            pascal_case("components install component"),
            "ComponentsInstallComponent"
        );
        assert_eq!(screaming_snake_case("xyd"), "XYD");
        assert_eq!(screaming_snake_case("my-cli"), "MY_CLI");
        assert_eq!(slug("My CLI!"), "my-cli");
    }

    #[test]
    fn unique_names_suffix() {
        let mut used = HashSet::new();
        assert_eq!(unique_name("Shell", &mut used), "Shell");
        assert_eq!(unique_name("Shell", &mut used), "Shell2");
        assert_eq!(unique_name("Shell", &mut used), "Shell3");
    }

    #[test]
    fn stable_stringify_sorts_keys() {
        let v: Value = serde_json::from_str(r#"{"b":1,"a":[2,3]}"#).unwrap();
        assert_eq!(stable_stringify(&v), r#"{"a":[2,3],"b":1}"#);
    }
}
