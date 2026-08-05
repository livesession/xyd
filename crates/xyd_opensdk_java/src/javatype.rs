//! javatype.ts — TypeRef → Java type/decode expressions, query kind, const &
//! union helpers. Operates on serde_json::Value TypeRefs.

use serde_json::Value;
use std::collections::HashSet;

use crate::ir::{str_field, Types};
use crate::jsrt::{json_str, pascal_case};

/// (property, mapping) of a mapped union, else None.
pub fn union_mapping(ty: &Value) -> Option<(String, Vec<(String, String)>)> {
    if str_field(ty, "kind") != Some("union") {
        return None;
    }
    let disc = ty.get("discriminator")?;
    let prop = str_field(disc, "propertyName")?;
    let mapping = disc.get("mapping")?.as_object()?;
    if mapping.is_empty() {
        return None;
    }
    let entries = mapping
        .iter()
        .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
        .collect();
    Some((prop.to_string(), entries))
}

pub fn is_const_field(field: &Value) -> bool {
    let ty = field.get("type");
    ty.and_then(|t| str_field(t, "kind")) == Some("scalar")
        && ty.and_then(|t| t.get("const")).is_some()
}

/// The Java literal for a const scalar value.
pub fn const_literal(value: &Value) -> String {
    match value {
        Value::Number(_) => format!("{value}L"),
        Value::Bool(b) => b.to_string(),
        other => json_str(&js_string(other)),
    }
}

/// JS `String(value)`.
fn js_string(v: &Value) -> String {
    match v {
        Value::Null => "null".to_string(),
        Value::Bool(b) => b.to_string(),
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        _ => v.to_string(),
    }
}

pub fn is_binary_type_ref(ref_: Option<&Value>, types: &Types, seen: &mut HashSet<String>) -> bool {
    let Some(r) = ref_ else { return false };
    match str_field(r, "kind") {
        Some("scalar") => {
            str_field(r, "scalar") == Some("string") && str_field(r, "format") == Some("binary")
        }
        Some("array") => is_binary_type_ref(r.get("items"), types, seen),
        Some("ref") => {
            let Some(name) = str_field(r, "name") else {
                return false;
            };
            if seen.contains(name) {
                return false;
            }
            seen.insert(name.to_string());
            let Some(named) = types.get(name) else {
                return false;
            };
            match str_field(named, "kind") {
                Some("union") => named
                    .get("variants")
                    .and_then(|v| v.as_array())
                    .map(|vs| vs.iter().any(|v| is_binary_type_ref(Some(v), types, seen)))
                    .unwrap_or(false),
                Some("alias") => is_binary_type_ref(named.get("of"), types, seen),
                _ => false,
            }
        }
        _ => false,
    }
}

#[derive(PartialEq)]
pub enum QueryKind {
    Scalar,
    Array,
    Map,
    Object,
}

pub fn query_kind(ref_: Option<&Value>, types: &Types) -> QueryKind {
    let Some(r) = ref_ else {
        return QueryKind::Scalar;
    };
    match str_field(r, "kind") {
        Some("scalar") => QueryKind::Scalar,
        Some("array") => QueryKind::Array,
        Some("map") => QueryKind::Map,
        Some("ref") => {
            let name = str_field(r, "name");
            let named = name.and_then(|n| types.get(n));
            match named.and_then(|n| str_field(n, "kind")) {
                Some("enum") => QueryKind::Scalar,
                Some("alias") => query_kind(named.unwrap().get("of"), types),
                _ => QueryKind::Object,
            }
        }
        _ => QueryKind::Object,
    }
}

pub fn java_type(ref_: Option<&Value>, types: &Types) -> String {
    let Some(r) = ref_ else {
        return "Object".to_string();
    };
    match str_field(r, "kind") {
        Some("scalar") => java_scalar(str_field(r, "scalar"), str_field(r, "format")),
        Some("array") => format!("List<{}>", java_type(r.get("items"), types)),
        Some("map") => format!("Map<String, {}>", java_type(r.get("values"), types)),
        Some("ref") => java_ref_type(str_field(r, "name"), types),
        _ => "Object".to_string(),
    }
}

fn java_scalar(scalar: Option<&str>, format: Option<&str>) -> String {
    match scalar {
        Some("string") => if format == Some("binary") {
            "byte[]"
        } else {
            "String"
        }
        .to_string(),
        Some("integer") => "Long".to_string(),
        Some("number") => "Double".to_string(),
        Some("boolean") => "Boolean".to_string(),
        _ => "Object".to_string(),
    }
}

fn java_ref_type(name: Option<&str>, types: &Types) -> String {
    let Some(name) = name else {
        return "Object".to_string();
    };
    let Some(named) = types.get(name) else {
        return "Object".to_string();
    };
    match str_field(named, "kind") {
        Some("struct") | Some("enum") => pascal_case(name),
        Some("alias") => java_type(named.get("of"), types),
        _ => "Object".to_string(),
    }
}

fn lambda_var(depth: usize) -> String {
    if depth == 0 {
        "__e".to_string()
    } else {
        format!("__e{depth}")
    }
}

/// A Java expression decoding a parsed-JSON `Object` `src` into `ref`'s type.
pub fn java_decode(ref_: Option<&Value>, src: &str, types: &Types, depth: usize) -> String {
    let Some(r) = ref_ else {
        return src.to_string();
    };
    match str_field(r, "kind") {
        Some("scalar") => scalar_decode(str_field(r, "scalar"), str_field(r, "format"), src),
        Some("array") => {
            let v = lambda_var(depth);
            format!(
                "Json.mapList({src}, {v} -> {})",
                java_decode(r.get("items"), &v, types, depth + 1)
            )
        }
        Some("map") => {
            let v = lambda_var(depth);
            format!(
                "Json.mapValues({src}, {v} -> {})",
                java_decode(r.get("values"), &v, types, depth + 1)
            )
        }
        Some("ref") => ref_decode(str_field(r, "name"), src, types),
        _ => src.to_string(),
    }
}

fn scalar_decode(scalar: Option<&str>, format: Option<&str>, src: &str) -> String {
    match scalar {
        Some("string") => {
            if format == Some("binary") {
                format!("Json.asBytes({src})")
            } else {
                format!("Json.asString({src})")
            }
        }
        Some("integer") => format!("Json.asLong({src})"),
        Some("number") => format!("Json.asDouble({src})"),
        Some("boolean") => format!("Json.asBoolean({src})"),
        _ => src.to_string(),
    }
}

fn ref_decode(name: Option<&str>, src: &str, types: &Types) -> String {
    let Some(name) = name else {
        return src.to_string();
    };
    let Some(named) = types.get(name) else {
        return src.to_string();
    };
    match str_field(named, "kind") {
        Some("struct") | Some("enum") => format!("{}.fromJson({src})", pascal_case(name)),
        Some("alias") => java_decode(named.get("of"), src, types, 0),
        Some("union") if union_mapping(named).is_some() => {
            format!("{}.fromJson({src})", pascal_case(name))
        }
        _ => src.to_string(),
    }
}
