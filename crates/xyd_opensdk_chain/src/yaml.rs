//! YAML in / YAML out, matching `js-yaml` (the library the TS drives).
//!
//! * [`from_str`] parses with `serde_yaml` and converts to `serde_json::Value`.
//! * [`dump`] is a port of js-yaml's `dump()` for the JSON value subset, with
//!   js-yaml's defaults (`indent: 2`, `lineWidth: 80`, `quotingType: '`,
//!   `noArrayIndent: false`, `noCompatMode: false`). `serializeDoc` writes this for a
//!   `.yaml`/`.yml` `output`, and the result is a committed golden, so style choices
//!   (plain vs single-quoted vs literal `|` vs folded `>-`) are load-bearing.
//!
//! ## Known loader divergence
//!
//! js-yaml's DEFAULT_SCHEMA resolves the `!!timestamp` implicit type, so a *plain*
//! `2020-01-02` scalar becomes a JS `Date` (and serialises as
//! `"2020-01-02T00:00:00.000Z"`). `serde_yaml` yields a plain `String` and — crucially —
//! does not report whether a scalar was quoted, so this port cannot tell
//! `d: 2020-01-02` from `d: '2020-01-02'`. Converting every date-shaped string would
//! corrupt the (much more common) quoted form — e.g. an OpenAPI `version: '2024-01-01'`.
//! Timestamps are therefore left as strings. `tests/oracle.rs` lists this as a declared
//! divergence rather than hiding it.

use serde_json::{Map, Value};

mod dumper;
mod implicit;

pub use dumper::dump;

/// Parse YAML into a JSON value, matching what js-yaml + `JSON.stringify` observe.
pub fn from_str(text: &str) -> Result<Value, serde_yaml::Error> {
    let raw: serde_yaml::Value = serde_yaml::from_str(text)?;
    Ok(convert(raw))
}

fn convert(v: serde_yaml::Value) -> Value {
    match v {
        serde_yaml::Value::Null => Value::Null,
        serde_yaml::Value::Bool(b) => Value::Bool(b),
        serde_yaml::Value::Number(n) => convert_number(n),
        serde_yaml::Value::String(s) => Value::String(s),
        serde_yaml::Value::Sequence(items) => {
            Value::Array(items.into_iter().map(convert).collect())
        }
        serde_yaml::Value::Mapping(map) => {
            let mut out = Map::new();
            for (k, val) in map {
                out.insert(key_to_string(k), convert(val));
            }
            Value::Object(out)
        }
        // js-yaml applies the tag's constructor; for the tags a spec can realistically
        // carry (`!!str`, `!!int`, ...) the payload is the value itself.
        serde_yaml::Value::Tagged(t) => convert(t.value),
    }
}

fn convert_number(n: serde_yaml::Number) -> Value {
    if let Some(i) = n.as_i64() {
        return Value::from(i);
    }
    if let Some(u) = n.as_u64() {
        return Value::from(u);
    }
    match n.as_f64() {
        // `.inf` / `.nan` have no JSON form; `JSON.stringify(Infinity)` is `null`, which
        // is what the JS oracle records, so collapse them here too.
        Some(f) if f.is_finite() => Value::from(f),
        _ => Value::Null,
    }
}

/// JS object keys are strings; `js-yaml` assigns non-string keys onto a plain object,
/// which coerces them with `String(key)`.
fn key_to_string(k: serde_yaml::Value) -> String {
    match k {
        serde_yaml::Value::String(s) => s,
        serde_yaml::Value::Bool(b) => b.to_string(),
        serde_yaml::Value::Null => "null".to_string(),
        serde_yaml::Value::Number(n) => match convert_number(n) {
            Value::Number(num) => crate::jsnum::stringify_pretty(&Value::Number(num)),
            other => other.to_string(),
        },
        other => crate::jsnum::stringify_pretty(&convert(other)),
    }
}
