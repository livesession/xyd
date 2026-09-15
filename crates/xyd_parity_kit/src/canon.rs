//! JSON canonicalization for fixture parity (S6+).
//!
//! The committed `__fixtures__/*/output.json` oracles are
//! `JSON.stringify(result, null, 2)` artifacts and the existing vitest gate is
//! `expect(a).toEqual(b)` — STRUCTURAL equality. This module reproduces those
//! semantics on the Rust side so `cargo test` parity means the same thing:
//!
//! - **Key order**: irrelevant — comparison is `serde_json::Value` equality
//!   (with `preserve_order`, maps are IndexMaps whose `PartialEq` is
//!   order-insensitive), matching `toEqual`.
//! - **Numbers**: JS has one number type; `JSON.stringify(1.0)` → `"1"`.
//!   [`canonicalize`] collapses any integral f64 within ±2^53 to i64 and
//!   normalizes `-0` → `0`, so Rust `1.0` equals oracle `1`.
//! - **null vs missing**: NOT conflated — the oracles can't contain
//!   `undefined`, so strict null/missing distinction is safe and stricter.

use serde_json::{Map, Number, Value};

const MAX_SAFE: f64 = 9_007_199_254_740_992.0; // 2^53

/// Normalize a JSON tree to JS number semantics (integral floats → ints,
/// `-0` → `0`), recursively. Key order is preserved (irrelevant for equality,
/// keeps dump diffs minimal).
pub fn canonicalize(v: &Value) -> Value {
    match v {
        Value::Number(n) => Value::Number(canon_number(n)),
        Value::Array(items) => Value::Array(items.iter().map(canonicalize).collect()),
        Value::Object(map) => {
            let mut out = Map::with_capacity(map.len());
            for (k, val) in map {
                out.insert(k.clone(), canonicalize(val));
            }
            Value::Object(out)
        }
        other => other.clone(),
    }
}

fn canon_number(n: &Number) -> Number {
    if let Some(f) = n.as_f64() {
        if n.is_f64() {
            // -0.0 → 0, and integral floats within the JS safe range → i64
            // (JSON.stringify(1.0) === "1"; serde would keep "1.0").
            if f == 0.0 {
                return Number::from(0);
            }
            if f.fract() == 0.0 && f.abs() < MAX_SAFE {
                return Number::from(f as i64);
            }
        }
    }
    n.clone()
}

/// Structural equality under JS semantics — the Rust mirror of vitest `toEqual`
/// on JSON-parsed values.
pub fn canon_eq(a: &Value, b: &Value) -> bool {
    canonicalize(a) == canonicalize(b)
}

/// Walk two canonicalized trees and collect the first `limit` divergences as
/// (JSON-pointer, left, right) — an `assert_eq!` on a multi-MB tree is
/// unreadable; this is the parity harness's main DX feature.
pub fn diff_paths(a: &Value, b: &Value, limit: usize) -> Vec<(String, Value, Value)> {
    let mut out = Vec::new();
    walk(
        &canonicalize(a),
        &canonicalize(b),
        String::new(),
        &mut out,
        limit,
    );
    out
}

fn walk(a: &Value, b: &Value, path: String, out: &mut Vec<(String, Value, Value)>, limit: usize) {
    if out.len() >= limit {
        return;
    }
    match (a, b) {
        (Value::Object(ma), Value::Object(mb)) => {
            for (k, va) in ma {
                let p = format!("{path}/{}", escape_pointer(k));
                match mb.get(k) {
                    Some(vb) => walk(va, vb, p, out, limit),
                    None => out.push((p, va.clone(), Value::String("<missing>".into()))),
                }
                if out.len() >= limit {
                    return;
                }
            }
            for (k, vb) in mb {
                if !ma.contains_key(k) {
                    let p = format!("{path}/{}", escape_pointer(k));
                    out.push((p, Value::String("<missing>".into()), vb.clone()));
                    if out.len() >= limit {
                        return;
                    }
                }
            }
        }
        (Value::Array(xa), Value::Array(xb)) => {
            if xa.len() != xb.len() {
                out.push((
                    format!("{path}/(length)"),
                    Value::from(xa.len()),
                    Value::from(xb.len()),
                ));
            }
            for (i, (va, vb)) in xa.iter().zip(xb.iter()).enumerate() {
                walk(va, vb, format!("{path}/{i}"), out, limit);
                if out.len() >= limit {
                    return;
                }
            }
        }
        _ => {
            if a != b {
                out.push((
                    if path.is_empty() { "/".into() } else { path },
                    a.clone(),
                    b.clone(),
                ));
            }
        }
    }
}

/// RFC 6901 escaping for JSON-pointer segments.
fn escape_pointer(seg: &str) -> String {
    seg.replace('~', "~0").replace('/', "~1")
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn integral_floats_collapse_to_ints() {
        assert!(canon_eq(&json!(1.0), &json!(1)));
        assert!(canon_eq(&json!({"a": [2.0, 3]}), &json!({"a": [2, 3.0]})));
        assert!(!canon_eq(&json!(1.5), &json!(1)));
    }

    #[test]
    fn negative_zero_normalizes() {
        assert!(canon_eq(&json!(-0.0), &json!(0)));
    }

    #[test]
    fn key_order_is_irrelevant() {
        let a: Value = serde_json::from_str(r#"{"x":1,"y":2}"#).unwrap();
        let b: Value = serde_json::from_str(r#"{"y":2,"x":1}"#).unwrap();
        assert!(canon_eq(&a, &b));
    }

    #[test]
    fn null_is_not_missing() {
        assert!(!canon_eq(&json!({"a": null}), &json!({})));
    }

    #[test]
    fn large_floats_stay_floats() {
        // beyond 2^53 an f64 can't be a faithful JS int — leave untouched
        let big = 9.1e15_f64;
        assert!(canon_eq(&json!(big), &json!(big)));
    }

    #[test]
    fn diff_reports_pointer_paths() {
        let a = json!({"refs": [{"title": "A", "n": 1}]});
        let b = json!({"refs": [{"title": "B", "n": 1.0}]});
        let d = diff_paths(&a, &b, 10);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].0, "/refs/0/title");
    }

    #[test]
    fn diff_reports_missing_keys() {
        let d = diff_paths(&json!({"a": 1}), &json!({"a": 1, "b": 2}), 10);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].0, "/b");
    }
}
