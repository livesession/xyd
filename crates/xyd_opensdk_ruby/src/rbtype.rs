//! Port of rbtype.ts — IR TypeRef → YARD doc-type string (used only in
//! `@param`/`@return` comments).

use serde_json::Value;

use crate::naming::pascal_case;

pub fn rb_doc_type(ref_: Option<&Value>) -> String {
    let Some(r) = ref_ else {
        return "Object".to_string();
    };
    match r.get("kind").and_then(|k| k.as_str()) {
        Some("scalar") => rb_scalar(
            r.get("scalar").and_then(|s| s.as_str()),
            r.get("format").and_then(|f| f.as_str()),
        ),
        Some("ref") => match r.get("name").and_then(|n| n.as_str()) {
            Some(n) if !n.is_empty() => format!("Models::{}", pascal_case(n)),
            _ => "Object".to_string(),
        },
        Some("array") => format!("Array<{}>", rb_doc_type(r.get("items"))),
        Some("map") => format!("Hash{{String => {}}}", rb_doc_type(r.get("values"))),
        _ => "Object".to_string(),
    }
}

fn rb_scalar(scalar: Option<&str>, format: Option<&str>) -> String {
    match scalar {
        Some("string") => {
            if format == Some("binary") {
                "IO, String".to_string()
            } else {
                "String".to_string()
            }
        }
        Some("integer") => "Integer".to_string(),
        Some("number") => "Float".to_string(),
        Some("boolean") => "Boolean".to_string(),
        _ => "Object".to_string(),
    }
}
