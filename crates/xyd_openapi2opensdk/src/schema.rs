//! Loose schema helpers over raw JSON values — port of src/schema.ts.
//! Schemas span OpenAPI 3.0 (`nullable: true`) and 3.1 (`type: [..,"null"]`,
//! `const`); everything operates on `&Value` from the raw document tree.

use serde_json::{Map, Value};
use std::collections::HashSet;

const SCALAR_TYPES: [&str; 4] = ["string", "number", "integer", "boolean"];

/// True for `{ $ref: "<string>" }`-shaped nodes.
pub fn is_ref(v: &Value) -> bool {
    v.as_object()
        .and_then(|o| o.get("$ref"))
        .map(|r| r.is_string())
        .unwrap_or(false)
}

pub fn ref_str(v: &Value) -> Option<&str> {
    v.as_object()?.get("$ref")?.as_str()
}

/// The declared type(s) with any `"null"` stripped.
pub fn non_null_types(schema: Option<&Value>) -> Vec<&str> {
    let Some(t) = schema.and_then(|s| s.get("type")) else {
        return vec![];
    };
    match t {
        Value::String(s) => vec![s.as_str()],
        Value::Array(arr) => arr
            .iter()
            .filter_map(|v| v.as_str())
            .filter(|s| *s != "null")
            .collect(),
        _ => vec![],
    }
    .into_iter()
    .filter(|s| *s != "null")
    .collect()
}

/// 3.0 `nullable: true` or 3.1 `type: [..., "null"]`.
pub fn is_nullable(schema: Option<&Value>) -> bool {
    let Some(s) = schema else { return false };
    if s.get("nullable") == Some(&Value::Bool(true)) {
        return true;
    }
    match s.get("type") {
        Some(Value::Array(arr)) => arr.iter().any(|v| v.as_str() == Some("null")),
        _ => false,
    }
}

pub fn scalar_type(schema: Option<&Value>) -> Option<&str> {
    let t = *non_null_types(schema).first()?;
    if SCALAR_TYPES.contains(&t) {
        Some(t)
    } else {
        None
    }
}

pub fn is_array(schema: Option<&Value>) -> bool {
    non_null_types(schema).contains(&"array")
}

pub fn array_items(schema: Option<&Value>) -> Option<&Value> {
    if !is_array(schema) {
        return None;
    }
    schema?.get("items")
}

/// The additionalProperties VALUE schema for a map-shaped object.
pub fn map_values(schema: Option<&Value>) -> Option<&Value> {
    let ap = schema?.get("additionalProperties")?;
    if ap.is_object() {
        Some(ap)
    } else {
        None
    }
}

/// Object by explicit type or by having properties.
pub fn is_object_schema(schema: Option<&Value>) -> bool {
    let Some(s) = schema else { return false };
    if non_null_types(Some(s)).contains(&"object") {
        return true;
    }
    matches!(s.get("properties"), Some(Value::Object(p)) if !p.is_empty())
}

/// Enum values (3.1 `const` counts as a 1-value enum). None when not an enum.
pub fn get_enum(schema: Option<&Value>) -> Option<Vec<&Value>> {
    let s = schema?;
    if let Some(Value::Array(arr)) = s.get("enum") {
        if !arr.is_empty() {
            return Some(arr.iter().collect());
        }
    }
    if let Some(c) = s.get("const") {
        return Some(vec![c]);
    }
    None
}

pub fn get_default(schema: Option<&Value>) -> Option<&Value> {
    schema?.get("default")
}

pub fn get_description(schema: Option<&Value>) -> Option<&str> {
    // JS truthiness: an empty-string description does NOT emit.
    schema?
        .get("description")
        .and_then(|d| d.as_str())
        .filter(|d| !d.is_empty())
}

fn truthy_bool(schema: &Value, key: &str) -> bool {
    match schema.get(key) {
        Some(Value::Bool(b)) => *b,
        Some(Value::Null) | None => false,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64().map(|f| f != 0.0).unwrap_or(true),
        Some(_) => true,
    }
}

pub fn is_truthy_flag(schema: &Value, key: &str) -> bool {
    truthy_bool(schema, key)
}

/// Merge an `allOf` chain into one object schema (properties + required).
/// Port of schema.ts `mergeAllOf`: non-allOf schemas return unchanged (as a
/// clone); the cycle guard tracks doc-node addresses (the JS WeakSet).
/// `resolve_ref(member)` resolves a `$ref` member to its raw schema (the
/// SymbolTable supplies one); a `$ref` member with no resolver contributes
/// nothing.
pub fn merge_all_of<'a>(
    schema: Option<&'a Value>,
    resolve_ref: &dyn Fn(&'a Value) -> Option<&'a Value>,
    seen: &mut HashSet<usize>,
) -> Option<Value> {
    let s = schema?;
    let all_of = match s.get("allOf") {
        Some(Value::Array(arr)) if !arr.is_empty() => arr,
        _ => return Some(s.clone()),
    };
    let addr = s as *const Value as usize;
    if seen.contains(&addr) {
        return Some(s.clone());
    }
    seen.insert(addr);

    let mut merged_props: Map<String, Value> = Map::new();
    // Set<string> insertion order = first-add order.
    let mut required: Vec<String> = Vec::new();
    let mut required_seen: HashSet<String> = HashSet::new();
    if let Some(Value::Array(req)) = s.get("required") {
        for r in req {
            if let Some(rs) = r.as_str() {
                if required_seen.insert(rs.to_string()) {
                    required.push(rs.to_string());
                }
            }
        }
    }

    for raw in all_of {
        // JS: `resolveRef?.(raw) ?? raw` — the resolver returns undefined for
        // non-ref members, falling back to the member itself.
        let sub: &Value = resolve_ref(raw).unwrap_or(raw);
        let sub_addr = sub as *const Value as usize;
        if !sub.is_object() || seen.contains(&sub_addr) {
            continue;
        }
        let resolved = merge_all_of(Some(sub), resolve_ref, seen).unwrap_or_else(|| sub.clone());
        if let Some(Value::Object(props)) = resolved.get("properties") {
            for (k, v) in props {
                merged_props.insert(k.clone(), v.clone());
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
    if let Some(Value::Object(props)) = s.get("properties") {
        for (k, v) in props {
            merged_props.insert(k.clone(), v.clone());
        }
    }

    let mut merged = Map::new();
    merged.insert("type".into(), Value::String("object".into()));
    merged.insert("properties".into(), Value::Object(merged_props));
    merged.insert(
        "required".into(),
        Value::Array(required.into_iter().map(Value::String).collect()),
    );
    if let Some(desc) = s.get("description") {
        // JS truthiness gate on the description copy.
        if desc.as_str().map(|d| !d.is_empty()).unwrap_or(false) {
            merged.insert("description".into(), desc.clone());
        }
    }
    Some(Value::Object(merged))
}
