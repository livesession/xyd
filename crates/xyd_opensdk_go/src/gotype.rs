//! IR TypeRef → Go type — port of gotype.ts. Operates on serde_json::Value.

use serde_json::Value;

use crate::naming::pascal_case;

pub fn go_type(ref_: Option<&Value>) -> String {
    let Some(r) = ref_ else {
        return "any".to_string();
    };
    match r.get("kind").and_then(|k| k.as_str()) {
        Some("scalar") => go_scalar(
            r.get("scalar").and_then(|s| s.as_str()),
            r.get("format").and_then(|f| f.as_str()),
        ),
        Some("ref") => match r.get("name").and_then(|n| n.as_str()) {
            Some(n) if !n.is_empty() => pascal_case(n),
            _ => "any".to_string(),
        },
        Some("array") => format!("[]{}", go_type(r.get("items"))),
        Some("map") => format!("map[string]{}", go_type(r.get("values"))),
        _ => "any".to_string(),
    }
}

fn go_scalar(scalar: Option<&str>, format: Option<&str>) -> String {
    match scalar {
        Some("string") => "string",
        Some("integer") => {
            if format == Some("int32") {
                "int32"
            } else {
                "int64"
            }
        }
        Some("number") => {
            if format == Some("float") {
                "float32"
            } else {
                "float64"
            }
        }
        Some("boolean") => "bool",
        _ => "any",
    }
    .to_string()
}

pub fn is_scalar_ref(ref_: Option<&Value>) -> bool {
    ref_.and_then(|r| r.get("kind")).and_then(|k| k.as_str()) == Some("scalar")
}

pub fn is_binary_ref(ref_: Option<&Value>) -> bool {
    let Some(r) = ref_ else { return false };
    r.get("kind").and_then(|k| k.as_str()) == Some("scalar")
        && r.get("scalar").and_then(|s| s.as_str()) == Some("string")
        && r.get("format").and_then(|f| f.as_str()) == Some("binary")
}
