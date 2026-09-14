//! The JavaScript value semantics `diff.ts` leans on.
//!
//! The TS differ runs on `JSON.parse`d specs and uses plain JS operators —
//! truthiness (`!b.required`), nullish coalescing (`b.wireName ?? b.name`),
//! strict equality (`b.path !== h.path`), template interpolation
//! (`` `${b.encoding}` ``), `Array.prototype.join` and `JSON.stringify`. Each of
//! those has semantics a naive Rust port gets wrong, so they live here as
//! explicit, unit-tested functions.
//!
//! `Option<&Value>` models a JS value slot: `None` is `undefined` (a missing
//! property), `Some(Value::Null)` is `null`. The two are NOT interchangeable —
//! `JSON.stringify(undefined)` is `undefined` while `JSON.stringify(null)` is
//! `"null"`, and `[undefined].join()` is `""` while `${undefined}` is
//! `"undefined"`.

use serde_json::{Map, Value};

/// `obj.prop` — property read. Only objects have named properties; reading a
/// property off a string/number/array/null yields `undefined` for every key
/// `diff.ts` touches.
pub fn prop<'a>(v: Option<&'a Value>, key: &str) -> Option<&'a Value> {
    match v {
        Some(Value::Object(map)) => map.get(key),
        _ => None,
    }
}

/// `Boolean(v)` — JS truthiness. `undefined`, `null`, `false`, `0`, `-0`, `NaN`
/// and `""` are falsy; **every** object and array (even empty ones) is truthy.
pub fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().map(|f| f != 0.0 && !f.is_nan()).unwrap_or(true),
        Some(Value::String(s)) => !s.is_empty(),
        Some(_) => true,
    }
}

/// `a ?? b` — nullish coalescing. Only `undefined`/`null` fall through; `""`,
/// `0` and `false` do NOT (this is why an empty `wireName` is a real change).
pub fn nullish_or<'a>(a: Option<&'a Value>, b: Option<&'a Value>) -> Option<&'a Value> {
    match a {
        None | Some(Value::Null) => b,
        other => other,
    }
}

/// `a === b` for values parsed from two independent documents.
///
/// Numbers compare numerically (`1 === 1.0`), strings/booleans by value,
/// `undefined === undefined` and `null === null` hold — but objects and arrays
/// compare by REFERENCE, and two separately parsed documents never share one,
/// so they are always unequal.
pub fn strict_eq(a: Option<&Value>, b: Option<&Value>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(Value::Null), Some(Value::Null)) => true,
        (Some(Value::Bool(x)), Some(Value::Bool(y))) => x == y,
        (Some(Value::String(x)), Some(Value::String(y))) => x == y,
        (Some(Value::Number(x)), Some(Value::Number(y))) => match (x.as_f64(), y.as_f64()) {
            (Some(x), Some(y)) => x == y,
            _ => x == y,
        },
        _ => false,
    }
}

/// `` `${v}` `` / `String(v)` — template-literal interpolation.
pub fn display(v: Option<&Value>) -> String {
    match v {
        None => "undefined".to_string(),
        Some(Value::Null) => "null".to_string(),
        Some(Value::Bool(b)) => b.to_string(),
        Some(Value::Number(n)) => number(n),
        Some(Value::String(s)) => s.clone(),
        // Array.prototype.toString delegates to join(","), where null/undefined
        // render as the empty string.
        Some(Value::Array(items)) => items
            .iter()
            .map(|i| join_component(Some(i)))
            .collect::<Vec<_>>()
            .join(","),
        Some(Value::Object(_)) => "[object Object]".to_string(),
    }
}

/// One element of `Array.prototype.join` — like [`display`] except `null` and
/// `undefined` render as `""`. This is what makes a resource with no `name`
/// produce the method key `"empty.."` rather than `"empty.undefined."`.
pub fn join_component(v: Option<&Value>) -> String {
    match v {
        None | Some(Value::Null) => String::new(),
        other => display(other),
    }
}

/// `JSON.stringify(v)`. Returns `None` for JS `undefined` (a missing property),
/// which is what makes an enum entry with no `value` key land in the Set as the
/// JS value `undefined` and render as the path segment `"undefined"`.
pub fn stringify(v: Option<&Value>) -> Option<String> {
    let v = v?;
    let mut out = String::new();
    write_value(v, &mut out);
    Some(out)
}

fn write_value(v: &Value, out: &mut String) {
    match v {
        Value::Null => out.push_str("null"),
        Value::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
        Value::Number(n) => out.push_str(&number(n)),
        Value::String(s) => write_string(s, out),
        Value::Array(items) => {
            out.push('[');
            for (i, item) in items.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                write_value(item, out);
            }
            out.push(']');
        }
        Value::Object(map) => {
            out.push('{');
            let mut first = true;
            for key in object_key_order(map) {
                if !first {
                    out.push(',');
                }
                first = false;
                write_string(key, out);
                out.push(':');
                write_value(&map[key], out);
            }
            out.push('}');
        }
    }
}

/// JS own-property enumeration order: canonical array-index keys first, in
/// ascending numeric order, then the remaining string keys in insertion order.
/// `sdk.errors.statusCodeMap` ("400", "401", …) is exactly this case — it only
/// round-trips unchanged because those keys happen to be written ascending.
fn object_key_order(map: &Map<String, Value>) -> Vec<&String> {
    let mut indexed: Vec<(u32, &String)> = Vec::new();
    let mut rest: Vec<&String> = Vec::new();
    for key in map.keys() {
        match array_index(key) {
            Some(i) => indexed.push((i, key)),
            None => rest.push(key),
        }
    }
    indexed.sort_by_key(|(i, _)| *i);
    let mut out: Vec<&String> = indexed.into_iter().map(|(_, k)| k).collect();
    out.append(&mut rest);
    out
}

/// A key is an array index iff it is the canonical decimal form of an integer
/// in `0 ..= 2^32 - 2` (so "0" yes, "00"/"+1"/"4294967295" no).
fn array_index(key: &str) -> Option<u32> {
    if key.is_empty() || (key.len() > 1 && key.starts_with('0')) {
        return None;
    }
    if !key.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    let n: u32 = key.parse().ok()?;
    if n == u32::MAX {
        return None;
    }
    Some(n)
}

fn write_string(s: &str, out: &mut String) {
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\u{8}' => out.push_str("\\b"),
            '\u{c}' => out.push_str("\\f"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
}

/// ECMAScript `Number::toString` (radix 10) — the format both `JSON.stringify`
/// and template interpolation use for numbers.
///
/// The load-bearing bit is that JS has ONE number type: `1.0` prints as `"1"`,
/// so a spec written with `1.0` and one written with `1` are equal to the TS
/// differ. serde_json keeps the two apart (u64 vs f64), so integral floats must
/// be collapsed here.
pub fn number(n: &serde_json::Number) -> String {
    if let Some(i) = n.as_i64() {
        return i.to_string();
    }
    if let Some(u) = n.as_u64() {
        return u.to_string();
    }
    let f = match n.as_f64() {
        Some(f) => f,
        // Arbitrary-precision numbers are off by default; fall back to the raw
        // token rather than inventing a value.
        None => return n.to_string(),
    };
    format_f64(f)
}

fn format_f64(f: f64) -> String {
    if f.is_nan() {
        return "NaN".to_string();
    }
    if f.is_infinite() {
        return if f > 0.0 { "Infinity" } else { "-Infinity" }.to_string();
    }
    if f == 0.0 {
        // Covers -0.0, which JS prints as "0".
        return "0".to_string();
    }
    let sign = if f < 0.0 { "-" } else { "" };
    let abs = f.abs();

    // Shortest round-tripping decimal, as `d[.ddd]e<exp>`.
    let sci = format!("{abs:e}");
    let (mantissa, exp) = sci
        .split_once('e')
        .expect("`{:e}` always emits an exponent");
    let exp: i32 = exp.parse().expect("`{:e}` exponent is an integer");
    let digits: String = mantissa.chars().filter(|c| *c != '.').collect();
    let digits = digits.trim_end_matches('0');
    let digits = if digits.is_empty() { "0" } else { digits };
    let k = digits.len() as i32;
    // value == 0.<digits> * 10^n
    let n = exp + 1;

    // ECMA-262 Number::toString steps 5-10.
    let body = if k <= n && n <= 21 {
        format!("{digits}{}", "0".repeat((n - k) as usize))
    } else if 0 < n && n <= 21 {
        format!("{}.{}", &digits[..n as usize], &digits[n as usize..])
    } else if -6 < n && n <= 0 {
        format!("0.{}{digits}", "0".repeat((-n) as usize))
    } else {
        let e = n - 1;
        let esign = if e >= 0 { "+" } else { "-" };
        if k == 1 {
            format!("{digits}e{esign}{}", e.abs())
        } else {
            format!("{}.{}e{esign}{}", &digits[..1], &digits[1..], e.abs())
        }
    };
    format!("{sign}{body}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn num(v: Value) -> String {
        match v {
            Value::Number(n) => number(&n),
            _ => unreachable!(),
        }
    }

    #[test]
    fn truthiness_matches_js() {
        assert!(!truthy(None));
        assert!(!truthy(Some(&Value::Null)));
        assert!(!truthy(Some(&json!(false))));
        assert!(!truthy(Some(&json!(0))));
        assert!(!truthy(Some(&json!(0.0))));
        assert!(!truthy(Some(&json!(""))));
        assert!(truthy(Some(&json!("false"))));
        assert!(truthy(Some(&json!([]))));
        assert!(truthy(Some(&json!({}))));
    }

    #[test]
    fn nullish_only_falls_through_for_undefined_and_null() {
        let name = json!("limit");
        let empty = json!("");
        assert_eq!(nullish_or(None, Some(&name)), Some(&name));
        assert_eq!(nullish_or(Some(&Value::Null), Some(&name)), Some(&name));
        // "" is NOT nullish -> it wins over the fallback.
        assert_eq!(nullish_or(Some(&empty), Some(&name)), Some(&empty));
    }

    #[test]
    fn strict_eq_treats_objects_as_distinct_references() {
        assert!(strict_eq(None, None));
        assert!(!strict_eq(None, Some(&Value::Null)));
        assert!(strict_eq(Some(&json!(1)), Some(&json!(1.0))));
        assert!(!strict_eq(Some(&json!("1")), Some(&json!(1))));
        assert!(!strict_eq(Some(&json!({})), Some(&json!({}))));
    }

    #[test]
    fn display_vs_join_differ_on_nullish() {
        assert_eq!(display(None), "undefined");
        assert_eq!(join_component(None), "");
        assert_eq!(display(Some(&Value::Null)), "null");
        assert_eq!(join_component(Some(&Value::Null)), "");
        assert_eq!(display(Some(&json!({"a": 1}))), "[object Object]");
        assert_eq!(display(Some(&json!(["a", null, "b"]))), "a,,b");
    }

    #[test]
    fn stringify_matches_json_stringify() {
        assert_eq!(stringify(None), None);
        assert_eq!(stringify(Some(&Value::Null)).unwrap(), "null");
        assert_eq!(stringify(Some(&json!("a\"b\n"))).unwrap(), r#""a\"b\n""#);
        assert_eq!(
            stringify(Some(&json!({"b": 1, "a": [1, null]}))).unwrap(),
            r#"{"b":1,"a":[1,null]}"#
        );
    }

    #[test]
    fn stringify_hoists_array_index_keys_like_js() {
        // JS: JSON.stringify({z:1, "2":2, "10":3, "01":4}) === '{"2":2,"10":3,"z":1,"01":4}'
        let raw = r#"{"z":1,"2":2,"10":3,"01":4}"#;
        let v: Value = serde_json::from_str(raw).unwrap();
        assert_eq!(
            stringify(Some(&v)).unwrap(),
            r#"{"2":2,"10":3,"z":1,"01":4}"#
        );
    }

    #[test]
    fn number_formatting_matches_ecmascript() {
        assert_eq!(num(json!(1)), "1");
        assert_eq!(num(json!(1.0)), "1"); // the reason this function exists
        assert_eq!(num(json!(-0.0)), "0");
        assert_eq!(num(json!(0.25)), "0.25");
        assert_eq!(num(json!(1.5e-7)), "1.5e-7");
        assert_eq!(num(json!(1e21)), "1e+21");
        assert_eq!(num(json!(1e-7)), "1e-7");
        assert_eq!(num(json!(0.000001)), "0.000001");
        assert_eq!(num(json!(1e20)), "100000000000000000000");
        assert_eq!(num(json!(-1234.5)), "-1234.5");
    }
}
