//! Port of `example-cs.ts` `renderRefValue`: render the framework's neutral
//! `ExampleValue` tree into a C# literal for the generated test suite, TYPED
//! against the declared TypeRef so container element types are exact
//! (`List<T>`, `Dictionary<string,T>`, `new Model { ... }`, an enum member, a
//! `byte[]` upload) and a bottomed-out example falls back to the C# default the
//! field accepts.

use std::collections::HashMap;

use serde_json::Value;

use crate::cstype::{cs_type, Types};
use crate::example_plan::ExampleValue;
use crate::jsrt::{js_string, json_string, pascal_case, struct_property_names};

/// A binary example: bytes from a fixed sample string.
const BINARY_LITERAL: &str = "System.Text.Encoding.UTF8.GetBytes(\"Example data\")";

/// Whether a TypeRef is a binary blob (string, format=binary) — an upload payload.
fn is_binary_ref(ref_: &Value) -> bool {
    ref_.get("kind").and_then(Value::as_str) == Some("scalar")
        && ref_.get("scalar").and_then(Value::as_str) == Some("string")
        && ref_.get("format").and_then(Value::as_str) == Some("binary")
}

/// Render an example value against its DECLARED TypeRef.
pub fn render_ref_value(ref_: Option<&Value>, value: &ExampleValue, types: Types) -> String {
    let Some(r) = ref_ else {
        return render_scalar_like(value);
    };
    if matches!(value, ExampleValue::Any) {
        return zero_value(Some(r), types);
    }
    match r.get("kind").and_then(Value::as_str) {
        Some("array") => {
            let ExampleValue::Array(item) = value else {
                return zero_value(Some(r), types);
            };
            let item_ty = cs_type(r.get("items"), types);
            format!(
                "new List<{item_ty}> {{ {} }}",
                render_ref_value(r.get("items"), item, types)
            )
        }
        Some("map") => {
            let ExampleValue::Map(v) = value else {
                return zero_value(Some(r), types);
            };
            let val_ty = cs_type(r.get("values"), types);
            format!(
                "new Dictionary<string, {val_ty}> {{ [\"key\"] = {} }}",
                render_ref_value(r.get("values"), v, types)
            )
        }
        Some("ref") => {
            let named = r
                .get("name")
                .and_then(Value::as_str)
                .filter(|n| !n.is_empty())
                .and_then(|n| types.get(n));
            let Some(named) = named else {
                return render_scalar_like(value);
            };
            match named.get("kind").and_then(Value::as_str) {
                Some("alias") => render_ref_value(named.get("of"), value, types),
                Some("union") => {
                    let ExampleValue::Union(variant) = value else {
                        return "null".to_string();
                    };
                    let first = named
                        .get("variants")
                        .and_then(Value::as_array)
                        .and_then(|a| a.first());
                    render_ref_value(first, variant, types)
                }
                Some("enum") => render_enum(named, value),
                _ => {
                    let ExampleValue::Object(_) = value else {
                        return zero_value(Some(r), types);
                    };
                    render_object(named, value, types)
                }
            }
        }
        _ => {
            if is_binary_ref(r) {
                BINARY_LITERAL.to_string()
            } else {
                render_scalar_like(value)
            }
        }
    }
}

fn render_object(named: &Value, value: &ExampleValue, types: Types) -> String {
    let type_name = pascal_case(named.get("name").and_then(Value::as_str).unwrap_or(""));
    let ExampleValue::Object(fields) = value else {
        return format!("new {type_name}()");
    };
    if fields.is_empty() {
        return format!("new {type_name}()");
    }
    let struct_fields = named
        .get("fields")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    // wire-name -> field TypeRef
    let by_name: HashMap<String, Value> = struct_fields
        .iter()
        .filter_map(|f| {
            f.get("name")
                .and_then(Value::as_str)
                .map(|n| (n.to_string(), f.get("type").cloned().unwrap_or(Value::Null)))
        })
        .collect();
    // Object-initializer property names MUST match the collision-resolved model
    // declaration, so reuse the same allocator.
    let names: Vec<String> = struct_fields
        .iter()
        .map(|f| {
            f.get("name")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string()
        })
        .collect();
    let idents: HashMap<String, String> = struct_property_names(&type_name, &names)
        .into_iter()
        .collect();

    let parts: Vec<String> = fields
        .iter()
        .map(|f| {
            let prop = idents
                .get(&f.name)
                .cloned()
                .unwrap_or_else(|| pascal_case(&f.name));
            let field_ref = by_name.get(&f.name).filter(|v| !v.is_null());
            format!("{prop} = {}", render_ref_value(field_ref, &f.value, types))
        })
        .collect();
    format!("new {type_name} {{ {} }}", parts.join(", "))
}

fn render_enum(named: &Value, value: &ExampleValue) -> String {
    let raw: Option<&Value> = match value {
        ExampleValue::Enum(v) | ExampleValue::Const(v) => Some(v),
        _ => None,
    };
    let values = named.get("values").and_then(Value::as_array);
    let found = values.and_then(|vs| vs.iter().find(|v| v.get("value") == raw));
    // member source: the matched enum value, else a synthetic { value: raw }.
    let member = found
        .and_then(|ev| {
            ev.get("name")
                .filter(|n| !n.is_null())
                .or_else(|| ev.get("value"))
        })
        .or(raw);
    let ident = member
        .map(js_string)
        .map(|s| pascal_case(&s))
        .unwrap_or_default();
    let ident = if ident.is_empty() {
        "Value".to_string()
    } else {
        ident
    };
    format!(
        "{}.{ident}",
        pascal_case(named.get("name").and_then(Value::as_str).unwrap_or(""))
    )
}

/// A scalar/const/binary example rendered from the value alone (no TypeRef).
fn render_scalar_like(value: &ExampleValue) -> String {
    match value {
        ExampleValue::Str(s) => json_string(s),
        ExampleValue::Integer(n) => n.to_string(),
        ExampleValue::Number(f) => js_number(*f),
        ExampleValue::Boolean(b) => bool_lit(*b),
        ExampleValue::Binary => BINARY_LITERAL.to_string(),
        ExampleValue::Const(v) | ExampleValue::Enum(v) => cs_literal(v),
        _ => "null".to_string(),
    }
}

fn bool_lit(b: bool) -> String {
    if b { "true" } else { "false" }.to_string()
}

/// JS `String(number)`: integral floats drop the fraction.
fn js_number(f: f64) -> String {
    if f.fract() == 0.0 {
        format!("{}", f as i64)
    } else {
        format!("{f}")
    }
}

/// A JSON scalar (const/enum wire value) as a C# literal.
fn cs_literal(v: &Value) -> String {
    match v {
        Value::Null => "null".to_string(),
        Value::Bool(b) => bool_lit(*b),
        Value::Number(n) => n.to_string(),
        other => json_string(&js_string(other)),
    }
}

/// The C# default value for a TypeRef (fallback for bottomed-out examples).
fn zero_value(ref_: Option<&Value>, types: Types) -> String {
    let Some(r) = ref_ else {
        return "null".to_string();
    };
    match r.get("kind").and_then(Value::as_str) {
        Some("scalar") => {
            if let Some(c) = r.get("const") {
                return cs_literal(c);
            }
            match r.get("scalar").and_then(Value::as_str) {
                Some("integer") | Some("number") => "0".to_string(),
                Some("boolean") => "false".to_string(),
                _ => "\"\"".to_string(),
            }
        }
        Some("array") | Some("map") => "null".to_string(),
        Some("ref") => {
            let name = match r
                .get("name")
                .and_then(Value::as_str)
                .filter(|n| !n.is_empty())
            {
                Some(n) => n,
                None => return "null".to_string(),
            };
            let Some(named) = types.get(name) else {
                return "null".to_string();
            };
            match named.get("kind").and_then(Value::as_str) {
                Some("alias") => zero_value(named.get("of"), types),
                Some("enum") | Some("union") => "null".to_string(),
                _ => format!("new {}()", pascal_case(name)),
            }
        }
        _ => "null".to_string(),
    }
}
