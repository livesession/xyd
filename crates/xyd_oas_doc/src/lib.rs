//! OpenAPI document loading + `$ref` resolution — the leaf both the docs engine
//! and the SDK/CLI toolchain stand on.
//!
//! Split out of `xyd_openapi` for the `opensdk` extraction. `xyd_openapi` is
//! xyd's OpenAPI→Uniform converter and stays in xyd; `xyd_openapi2opencli` and
//! `xyd_opensdk_cli` move to the opensdk repo but still need `DocCtx`, whose
//! `preprocess` / `with_merged_stamps` / `resolve` trio IS the deref engine —
//! deep enough that reimplementing it on the other side of the boundary would
//! be a second, drifting copy of the semantics every fixture is frozen against.
//!
//! This crate is therefore the SHARED half, and it is a genuine leaf: `std`,
//! `serde`, `serde_json`, `serde_yaml`. It deliberately does NOT depend on
//! `xyd_uniform` — the docs data model stays behind in xyd, which is what lets
//! the toolchain move without dragging it along.
//!
//! `xyd_openapi` re-exports everything here, so `xyd_openapi::{DocCtx,
//! read_spec, parse_spec, OasError}` keeps resolving for existing callers.

mod doc;

use serde_json::Value;

pub use doc::{DocCtx, MergedStamp};

#[derive(Debug)]
pub struct OasError(pub String);

impl std::fmt::Display for OasError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}
impl std::error::Error for OasError {}

/// Read + parse a spec file (yaml/json by extension — the JS `readOpenApiSpec`
/// minus URLs, which the shim pre-fetches).
pub fn read_spec(path: &str) -> Result<Value, OasError> {
    let content =
        std::fs::read_to_string(path).map_err(|e| OasError(format!("read {path}: {e}")))?;
    parse_spec(&content, path)
}

/// Parse spec content by extension hint (or best-effort).
pub fn parse_spec(content: &str, path_hint: &str) -> Result<Value, OasError> {
    let lower = path_hint.to_lowercase();
    if lower.ends_with(".json")
        || (!lower.ends_with(".yaml")
            && !lower.ends_with(".yml")
            && content.trim_start().starts_with('{'))
    {
        return serde_json::from_str(content).map_err(|e| OasError(format!("json: {e}")));
    }
    // YAML with JS number semantics: js-yaml coerces out-of-i64/u64-range
    // integers to lossy floats (the OpenAI spec carries ±9223372036854776000
    // bounds), while serde targets reject them — a custom visitor accepts
    // i128/u128 lossily.
    let js: JsValue = serde_yaml::from_str(content).map_err(|e| OasError(format!("yaml: {e}")))?;
    Ok(js.0)
}

/// A serde_json::Value wrapper whose Deserialize mirrors js-yaml number
/// coercion (i128/u128 → lossy f64) and stringifies non-string map keys.
struct JsValue(Value);

impl<'de> serde::Deserialize<'de> for JsValue {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        struct V;
        impl<'de> serde::de::Visitor<'de> for V {
            type Value = JsValue;
            fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                f.write_str("any YAML value")
            }
            fn visit_unit<E>(self) -> Result<JsValue, E> {
                Ok(JsValue(Value::Null))
            }
            fn visit_none<E>(self) -> Result<JsValue, E> {
                Ok(JsValue(Value::Null))
            }
            fn visit_bool<E>(self, b: bool) -> Result<JsValue, E> {
                Ok(JsValue(Value::Bool(b)))
            }
            fn visit_i64<E>(self, i: i64) -> Result<JsValue, E> {
                Ok(JsValue(Value::from(i)))
            }
            fn visit_u64<E>(self, u: u64) -> Result<JsValue, E> {
                Ok(JsValue(Value::from(u)))
            }
            fn visit_i128<E>(self, i: i128) -> Result<JsValue, E> {
                Ok(JsValue(Value::from(i as f64)))
            }
            fn visit_u128<E>(self, u: u128) -> Result<JsValue, E> {
                Ok(JsValue(Value::from(u as f64)))
            }
            fn visit_f64<E>(self, f: f64) -> Result<JsValue, E> {
                Ok(JsValue(Value::from(f)))
            }
            fn visit_str<E>(self, s: &str) -> Result<JsValue, E> {
                Ok(JsValue(Value::String(s.to_string())))
            }
            fn visit_seq<A: serde::de::SeqAccess<'de>>(
                self,
                mut seq: A,
            ) -> Result<JsValue, A::Error> {
                let mut out = Vec::new();
                while let Some(JsValue(v)) = seq.next_element()? {
                    out.push(v);
                }
                Ok(JsValue(Value::Array(out)))
            }
            fn visit_map<A: serde::de::MapAccess<'de>>(
                self,
                mut map: A,
            ) -> Result<JsValue, A::Error> {
                let mut out = serde_json::Map::new();
                while let Some((JsValue(k), JsValue(v))) = map.next_entry()? {
                    let key = match k {
                        Value::String(s) => s,
                        Value::Bool(b) => b.to_string(),
                        Value::Number(n) => n.to_string(),
                        Value::Null => "null".to_string(),
                        other => other.to_string(),
                    };
                    out.insert(key, v);
                }
                Ok(JsValue(Value::Object(out)))
            }
        }
        d.deserialize_any(V)
    }
}
