//! IR TypeRef → Rust type expression — port of rstype.ts.

use serde_json::Value;

use crate::naming::pascal_case;

/// Map a TypeRef (a JSON object) to a Rust type expression.
pub fn rs_type(ref_: Option<&Value>) -> String {
    let Some(r) = ref_ else {
        return "serde_json::Value".to_string();
    };
    match r.get("kind").and_then(|k| k.as_str()) {
        Some("scalar") => rs_scalar(
            r.get("scalar").and_then(|s| s.as_str()),
            r.get("format").and_then(|f| f.as_str()),
        ),
        Some("ref") => match r
            .get("name")
            .and_then(|n| n.as_str())
            .filter(|n| !n.is_empty())
        {
            Some(name) => pascal_case(name),
            None => "serde_json::Value".to_string(),
        },
        Some("array") => format!("Vec<{}>", rs_type(r.get("items"))),
        Some("map") => format!(
            "std::collections::HashMap<String, {}>",
            rs_type(r.get("values"))
        ),
        _ => "serde_json::Value".to_string(),
    }
}

fn rs_scalar(scalar: Option<&str>, format: Option<&str>) -> String {
    if format.unwrap_or("").to_lowercase() == "binary" {
        return "Vec<u8>".to_string();
    }
    match scalar {
        Some("string") => "String".to_string(),
        Some("integer") => {
            if format == Some("int32") {
                "i32".to_string()
            } else {
                "i64".to_string()
            }
        }
        Some("number") => {
            if format == Some("float") {
                "f32".to_string()
            } else {
                "f64".to_string()
            }
        }
        Some("boolean") => "bool".to_string(),
        _ => "serde_json::Value".to_string(),
    }
}

/// Whether a TypeRef is a `binary`-format scalar (rendered `Vec<u8>`).
pub fn is_binary_ref(ref_: Option<&Value>) -> bool {
    let Some(r) = ref_ else { return false };
    r.get("kind").and_then(|k| k.as_str()) == Some("scalar")
        && r.get("format")
            .and_then(|f| f.as_str())
            .unwrap_or("")
            .to_lowercase()
            == "binary"
}
