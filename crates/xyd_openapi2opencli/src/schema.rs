//! schema.rs helpers — port of the OpenCLI schema.ts. Operates on already
//! `$ref`-resolved schema values (`ctx.resolve()` is applied at the call
//! sites); `type` is read as a plain string (the openapi-types 3.0 shape the
//! JS assumes — a 3.1 array-type yields "not a scalar", matching JS).

use serde_json::{Map, Value};
use std::collections::HashSet;

use crate::jsrt::js_string;

const SCALAR_TYPES: [&str; 4] = ["string", "number", "integer", "boolean"];

fn type_str(schema: Option<&Value>) -> Option<&str> {
    // JS `typeof schema.type === 'string' ? schema.type : undefined`.
    schema?.get("type")?.as_str()
}

pub fn scalar_type(schema: Option<&Value>) -> Option<&'static str> {
    let t = type_str(schema)?;
    SCALAR_TYPES.iter().copied().find(|&s| s == t)
}

pub fn is_boolean(schema: Option<&Value>) -> bool {
    scalar_type(schema) == Some("boolean")
}

pub fn is_array(schema: Option<&Value>) -> bool {
    type_str(schema) == Some("array")
}

pub fn array_items(schema: Option<&Value>) -> Option<&Value> {
    let s = schema?;
    if s.get("type").and_then(|t| t.as_str()) != Some("array") {
        return None;
    }
    s.get("items")
}

/// Object by explicit `type: object` or by having non-empty properties.
pub fn is_object_schema(schema: Option<&Value>) -> bool {
    let Some(s) = schema else { return false };
    if s.get("type").and_then(|t| t.as_str()) == Some("object") {
        return true;
    }
    matches!(s.get("properties"), Some(Value::Object(p)) if !p.is_empty())
}

/// Enum values rendered as strings via JS `String(v)`; None when not an enum.
pub fn get_enum(schema: Option<&Value>) -> Option<Vec<String>> {
    let arr = schema?.get("enum")?.as_array()?;
    if arr.is_empty() {
        return None;
    }
    Some(arr.iter().map(js_string).collect())
}

pub fn get_default(schema: Option<&Value>) -> Option<&Value> {
    schema?.get("default")
}

pub fn is_binary(schema: Option<&Value>) -> bool {
    let Some(s) = schema else { return false };
    s.get("type").and_then(|t| t.as_str()) == Some("string")
        && s.get("format").and_then(|f| f.as_str()) == Some("binary")
}

/// `mergeAllOf` — merge an allOf chain into one object schema. Non-allOf
/// returns a clone. Address-based cycle guard (the JS WeakSet).
pub fn merge_all_of(schema: &Value, seen: &mut HashSet<usize>) -> Value {
    let all_of = match schema.get("allOf") {
        Some(Value::Array(arr)) if !arr.is_empty() => arr,
        _ => return schema.clone(),
    };
    let addr = schema as *const Value as usize;
    if seen.contains(&addr) {
        return schema.clone();
    }
    seen.insert(addr);

    let mut props: Map<String, Value> = Map::new();
    let mut required: Vec<String> = Vec::new();
    let mut required_seen: HashSet<String> = HashSet::new();

    for sub in all_of {
        let resolved = merge_all_of(sub, seen);
        if let Some(Value::Object(p)) = resolved.get("properties") {
            for (k, v) in p {
                props.insert(k.clone(), v.clone());
            }
        }
        if let Some(Value::Array(req)) = resolved.get("required") {
            for r in req {
                if let Some(rs) = r.as_str() {
                    if required_seen.insert(rs.to_string()) {
                        required.push(rs.to_string());
                    }
                }
            }
        }
    }
    if let Some(Value::Object(p)) = schema.get("properties") {
        for (k, v) in p {
            props.insert(k.clone(), v.clone());
        }
    }

    let mut merged = Map::new();
    merged.insert("type".into(), Value::String("object".into()));
    merged.insert("properties".into(), Value::Object(props));
    merged.insert(
        "required".into(),
        Value::Array(required.into_iter().map(Value::String).collect()),
    );
    if let Some(desc) = schema.get("description") {
        merged.insert("description".into(), desc.clone());
    }
    Value::Object(merged)
}

pub struct ResolvedBody {
    pub object: Option<Value>,
    #[allow(dead_code)]
    pub complex: bool,
}

/// `resolveObjectSchema` — merge allOf, take the object; else the first object
/// branch of oneOf/anyOf (marked complex).
pub fn resolve_object_schema(schema: Option<&Value>) -> ResolvedBody {
    let Some(schema) = schema else {
        return ResolvedBody {
            object: None,
            complex: false,
        };
    };
    let mut seen = HashSet::new();
    let merged = merge_all_of(schema, &mut seen);
    if is_object_schema(Some(&merged)) {
        return ResolvedBody {
            object: Some(merged),
            complex: false,
        };
    }
    let branches = merged
        .get("oneOf")
        .or_else(|| merged.get("anyOf"))
        .and_then(|b| b.as_array());
    if let Some(branches) = branches {
        for branch in branches {
            let mut s = HashSet::new();
            let b = merge_all_of(branch, &mut s);
            if is_object_schema(Some(&b)) {
                return ResolvedBody {
                    object: Some(b),
                    complex: true,
                };
            }
        }
        return ResolvedBody {
            object: None,
            complex: true,
        };
    }
    ResolvedBody {
        object: None,
        complex: false,
    }
}
