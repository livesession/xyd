//! cstype.ts — IR TypeRef → C# type expression + binary-payload detection.

use std::collections::BTreeMap;

use serde_json::Value;

use crate::jsrt::pascal_case;

/// The symbol table: name → NamedType (as raw JSON Value).
pub type Types<'a> = &'a BTreeMap<String, Value>;

/// Map an IR TypeRef to a C# type expression.
pub fn cs_type(ref_: Option<&Value>, types: Types) -> String {
    let r = match ref_ {
        Some(r) => r,
        None => return "object".to_string(),
    };
    match r.get("kind").and_then(Value::as_str) {
        Some("scalar") => cs_scalar(
            r.get("scalar").and_then(Value::as_str),
            r.get("format").and_then(Value::as_str),
        ),
        Some("ref") => {
            let name = match r.get("name").and_then(Value::as_str) {
                Some(n) if !n.is_empty() => n,
                _ => return "object".to_string(),
            };
            if let Some(named) = types.get(name) {
                match named.get("kind").and_then(Value::as_str) {
                    Some("alias") => return cs_type(named.get("of"), types),
                    Some("union") => return "object".to_string(),
                    _ => {}
                }
            }
            pascal_case(name)
        }
        Some("array") => format!("List<{}>", cs_type(r.get("items"), types)),
        Some("map") => format!("Dictionary<string, {}>", cs_type(r.get("values"), types)),
        _ => "object".to_string(),
    }
}

fn cs_scalar(scalar: Option<&str>, format: Option<&str>) -> String {
    match scalar {
        Some("string") => {
            if format == Some("binary") {
                "byte[]".to_string()
            } else {
                "string".to_string()
            }
        }
        Some("integer") => {
            if format == Some("int32") {
                "int".to_string()
            } else {
                "long".to_string()
            }
        }
        Some("number") => {
            if format == Some("float") {
                "float".to_string()
            } else {
                "double".to_string()
            }
        }
        Some("boolean") => "bool".to_string(),
        _ => "object".to_string(),
    }
}

/// Wrap a C# type in a nullable (`T?`) unless it already is one.
pub fn nullable(t: &str) -> String {
    if t.ends_with('?') {
        t.to_string()
    } else {
        format!("{t}?")
    }
}

/// Whether a TypeRef ultimately carries binary bytes (`format: binary`),
/// following array items and named union/alias refs (`seen` guards recursion).
pub fn is_binary_type_ref(ref_: Option<&Value>, types: Types, seen: &mut Vec<String>) -> bool {
    let r = match ref_ {
        Some(r) => r,
        None => return false,
    };
    match r.get("kind").and_then(Value::as_str) {
        Some("scalar") => {
            r.get("scalar").and_then(Value::as_str) == Some("string")
                && r.get("format").and_then(Value::as_str) == Some("binary")
        }
        Some("array") => is_binary_type_ref(r.get("items"), types, seen),
        Some("ref") => {
            let name = match r.get("name").and_then(Value::as_str) {
                Some(n) if !n.is_empty() => n,
                _ => return false,
            };
            if seen.iter().any(|s| s == name) {
                return false;
            }
            seen.push(name.to_string());
            let named = match types.get(name) {
                Some(n) => n,
                None => return false,
            };
            match named.get("kind").and_then(Value::as_str) {
                Some("union") => named
                    .get("variants")
                    .and_then(Value::as_array)
                    .map(|vs| vs.iter().any(|v| is_binary_type_ref(Some(v), types, seen)))
                    .unwrap_or(false),
                Some("alias") => is_binary_type_ref(named.get("of"), types, seen),
                _ => false,
            }
        }
        _ => false,
    }
}
