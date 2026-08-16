//! `replaceEnvVars` — port of packages/cli-sdk/src/utils.ts. Recursively
//! substitutes `$VAR_NAME` placeholders in string values. The env map is
//! passed in from JS (a snapshot of `process.env`) so substitution is
//! byte-identical to the JS `process.env[varName]` read regardless of how
//! dotenv/setenv propagate to the addon's own environment.

use serde_json::{Map, Value};

/// Recursively replace `$VAR` placeholders. `remove_undefined` mirrors the JS
/// flag: a missing var → "" when true, else the placeholder is KEPT (JS also
/// warns; we don't emit the warning from Rust — the shim can if needed).
pub fn replace_env_vars(value: &Value, env: &Map<String, Value>, remove_undefined: bool) -> Value {
    match value {
        Value::Null => Value::Null,
        Value::String(s) => Value::String(replace_in_string(s, env, remove_undefined)),
        Value::Array(arr) => Value::Array(
            arr.iter()
                .map(|v| replace_env_vars(v, env, remove_undefined))
                .collect(),
        ),
        Value::Object(obj) => {
            let mut out = Map::new();
            for (k, v) in obj {
                out.insert(k.clone(), replace_env_vars(v, env, remove_undefined));
            }
            Value::Object(out)
        }
        // Numbers/bools pass through unchanged (JS `return obj`).
        other => other.clone(),
    }
}

/// JS: `if (obj.includes("$")) obj.replace(/\$([A-Z_][A-Z0-9_]*)/g, ...)`.
/// The regex is a bare (non-global-unicode) match on ASCII `$` + an
/// upper-snake identifier.
fn replace_in_string(s: &str, env: &Map<String, Value>, remove_undefined: bool) -> String {
    if !s.contains('$') {
        return s.to_string();
    }
    let bytes = s.as_bytes();
    let mut out = String::with_capacity(s.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'$' {
            // Match [A-Z_][A-Z0-9_]* immediately after '$'.
            let start = i + 1;
            if start < bytes.len() && (bytes[start].is_ascii_uppercase() || bytes[start] == b'_') {
                let mut j = start + 1;
                while j < bytes.len()
                    && (bytes[j].is_ascii_uppercase()
                        || bytes[j].is_ascii_digit()
                        || bytes[j] == b'_')
                {
                    j += 1;
                }
                let var_name = &s[start..j];
                match env.get(var_name).and_then(|v| v.as_str()) {
                    Some(val) => out.push_str(val),
                    None => {
                        if remove_undefined {
                            // "" — nothing appended
                        } else {
                            // keep the placeholder verbatim ("$VAR")
                            out.push_str(&s[i..j]);
                        }
                    }
                }
                i = j;
                continue;
            }
        }
        // Not a placeholder start — copy this byte (safe: '$' is 1 byte, and
        // we only get here on non-match, so pushing the char at a boundary).
        let ch_len = utf8_len(bytes[i]);
        out.push_str(&s[i..i + ch_len]);
        i += ch_len;
    }
    out
}

fn utf8_len(b: u8) -> usize {
    if b < 0x80 {
        1
    } else if b >> 5 == 0b110 {
        2
    } else if b >> 4 == 0b1110 {
        3
    } else {
        4
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn env(pairs: &[(&str, &str)]) -> Map<String, Value> {
        pairs
            .iter()
            .map(|(k, v)| (k.to_string(), Value::String(v.to_string())))
            .collect()
    }

    #[test]
    fn substitutes_present_keeps_missing() {
        let e = env(&[("API", "https://api.example.com")]);
        let v = json!({ "url": "$API/v1", "miss": "$NOPE", "plain": "hi", "n": 3 });
        assert_eq!(
            replace_env_vars(&v, &e, false),
            json!({ "url": "https://api.example.com/v1", "miss": "$NOPE", "plain": "hi", "n": 3 })
        );
    }

    #[test]
    fn remove_undefined_blanks() {
        let e = env(&[]);
        assert_eq!(replace_env_vars(&json!("$X/y"), &e, true), json!("/y"));
    }

    #[test]
    fn lowercase_after_dollar_is_not_a_var() {
        // regex requires [A-Z_] start — `$var` (lowercase) is left verbatim.
        let e = env(&[("VAR", "x")]);
        assert_eq!(replace_env_vars(&json!("$var"), &e, false), json!("$var"));
    }

    #[test]
    fn recurses_arrays_and_objects() {
        let e = env(&[("T", "tok")]);
        let v = json!({ "a": ["$T", { "b": "$T" }] });
        assert_eq!(
            replace_env_vars(&v, &e, false),
            json!({ "a": ["tok", { "b": "tok" }] })
        );
    }
}
