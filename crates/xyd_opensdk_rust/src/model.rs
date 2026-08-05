//! src/models.rs — port of model.ts. Named types → serde declarations.

use serde_json::Value;
use std::collections::HashSet;

use crate::naming::{pascal_case, screaming_snake_case, snake_case};
use crate::rstype::rs_type;
use crate::rswriter::{braced, derive_line, rs_doc, rs_string};

const NULL_VEC_HELPER: &str = r#"fn null_vec<'de, D, T>(deserializer: D) -> Result<Option<Vec<T>>, D::Error>
where
    D: serde::Deserializer<'de>,
    T: serde::de::DeserializeOwned,
{
    let opt: Option<Vec<serde_json::Value>> = Option::deserialize(deserializer)?;
    Ok(opt.map(|items| items.into_iter().filter_map(|value| serde_json::from_value(value).ok()).collect()))
}"#;

/// JS `String(value)` for enum names/values (scalars in practice).
fn js_string(v: &Value) -> String {
    match v {
        Value::Null => "null".to_string(),
        Value::Bool(b) => b.to_string(),
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        other => other.to_string(),
    }
}

pub fn render_models_file(spec: &Value) -> String {
    let decls: Vec<String> = spec
        .get("types")
        .and_then(|t| t.as_array())
        .map(|arr| {
            arr.iter()
                .map(render_named_type)
                .filter(|s| !s.is_empty())
                .collect()
        })
        .unwrap_or_default();
    let body = if decls.is_empty() {
        "// No named types in this spec.".to_string()
    } else {
        decls.join("\n\n")
    };
    format!("use serde::{{Deserialize, Serialize}};\n\n{NULL_VEC_HELPER}\n\n{body}\n")
}

fn render_named_type(type_: &Value) -> String {
    match type_.get("kind").and_then(|k| k.as_str()) {
        Some("enum") => {
            if type_.get("base").and_then(|b| b.as_str()) == Some("integer") {
                render_int_enum(type_)
            } else {
                render_string_enum(type_)
            }
        }
        Some("union") => {
            if union_mapping(type_).is_some() {
                render_tagged_union(type_)
            } else {
                render_untagged_union(type_)
            }
        }
        Some("alias") => render_alias(type_),
        _ => render_struct(type_),
    }
}

/// The mapped discriminator (propertyName + non-empty mapping), else None.
pub(crate) fn union_mapping(type_: &Value) -> Option<(String, serde_json::Map<String, Value>)> {
    if type_.get("kind").and_then(|k| k.as_str()) != Some("union") {
        return None;
    }
    let disc = type_.get("discriminator")?;
    let prop = disc.get("propertyName").and_then(|p| p.as_str())?;
    if prop.is_empty() {
        return None;
    }
    let mapping = disc.get("mapping").and_then(|m| m.as_object())?;
    if mapping.is_empty() {
        return None;
    }
    Some((prop.to_string(), mapping.clone()))
}

fn unique_name(base: &str, seen: &mut HashSet<String>) -> String {
    let mut name = if base.is_empty() {
        "field".to_string()
    } else {
        base.to_string()
    };
    let mut i = 2u32;
    while seen.contains(&name) {
        name = format!("{base}{i}");
        i += 1;
    }
    seen.insert(name.clone());
    name
}

fn field_name(field: &Value) -> &str {
    field.get("name").and_then(|n| n.as_str()).unwrap_or("")
}

fn render_field(field: &Value, seen: &mut HashSet<String>) -> String {
    let wire = field_name(field);
    let rust_name = unique_name(&snake_case(wire), seen);
    let mut attrs = vec![
        "default".to_string(),
        "skip_serializing_if = \"Option::is_none\"".to_string(),
    ];
    if field
        .get("type")
        .and_then(|t| t.get("kind"))
        .and_then(|k| k.as_str())
        == Some("array")
    {
        attrs.push("deserialize_with = \"null_vec\"".to_string());
    }
    if rust_name != wire {
        attrs.push(format!("rename = {}", rs_string(wire)));
    }
    let doc = rs_doc(field.get("description").and_then(|d| d.as_str()));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    format!(
        "{head}#[serde({})]\npub {rust_name}: Option<{}>,",
        attrs.join(", "),
        rs_type(field.get("type"))
    )
}

fn doc_head(description: Option<&str>) -> String {
    let doc = rs_doc(description);
    if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    }
}

fn render_struct(type_: &Value) -> String {
    let name = pascal_case(type_.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let head = doc_head(type_.get("description").and_then(|d| d.as_str()));
    let derives = derive_line(&["Debug", "Clone", "Default", "Serialize", "Deserialize"]);
    let empty = Vec::new();
    let fields = type_
        .get("fields")
        .and_then(|f| f.as_array())
        .unwrap_or(&empty);
    if fields.is_empty() {
        return format!("{head}{derives}\npub struct {name} {{}}");
    }
    let mut seen = HashSet::new();
    let body = fields
        .iter()
        .map(|f| render_field(f, &mut seen))
        .collect::<Vec<_>>()
        .join("\n");
    format!(
        "{head}{derives}\n{}",
        braced(&format!("pub struct {name}"), &body)
    )
}

fn variant_name(v: &Value) -> String {
    let src = v
        .get("name")
        .filter(|x| !x.is_null())
        .unwrap_or_else(|| v.get("value").unwrap_or(&Value::Null));
    let p = pascal_case(&js_string(src));
    if p.is_empty() {
        "Value".to_string()
    } else {
        p
    }
}

fn render_string_enum(type_: &Value) -> String {
    let name = pascal_case(type_.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let head = doc_head(type_.get("description").and_then(|d| d.as_str()));
    let derives = derive_line(&["Debug", "Clone", "PartialEq", "Serialize", "Deserialize"]);
    let empty = Vec::new();
    let values = type_
        .get("values")
        .and_then(|v| v.as_array())
        .unwrap_or(&empty);
    let mut seen = HashSet::new();
    let mut variants: Vec<String> = values
        .iter()
        .map(|v| {
            let val = v.get("value").unwrap_or(&Value::Null);
            format!(
                "#[serde(rename = {})]\n{},",
                rs_string(&js_string(val)),
                unique_name(&variant_name(v), &mut seen)
            )
        })
        .collect();
    let catch_all = unique_name("Unknown", &mut seen);
    variants.push(format!(
        "/// A value the SDK does not yet know about.\n#[serde(other)]\n{catch_all},"
    ));
    format!(
        "{head}{derives}\n{}",
        braced(&format!("pub enum {name}"), &variants.join("\n"))
    )
}

fn render_int_enum(type_: &Value) -> String {
    let name = pascal_case(type_.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let head = doc_head(type_.get("description").and_then(|d| d.as_str()));
    let derives = derive_line(&[
        "Debug",
        "Clone",
        "Copy",
        "PartialEq",
        "Eq",
        "Default",
        "Serialize",
        "Deserialize",
    ]);
    let newtype = format!("{head}{derives}\npub struct {name}(pub i64);");
    let empty = Vec::new();
    let values = type_
        .get("values")
        .and_then(|v| v.as_array())
        .unwrap_or(&empty);
    let mut seen = HashSet::new();
    let consts: Vec<String> = values
        .iter()
        .map(|v| {
            let src = v
                .get("name")
                .filter(|x| !x.is_null())
                .unwrap_or_else(|| v.get("value").unwrap_or(&Value::Null));
            let cname = unique_name(&screaming_snake_case(&js_string(src)), &mut seen);
            // `${Number(v.value)}` — JS number coercion.
            let num = number_str(v.get("value"));
            format!("pub const {cname}: {name} = {name}({num});")
        })
        .collect();
    if consts.is_empty() {
        return newtype;
    }
    format!(
        "{newtype}\n\n{}",
        braced(&format!("impl {name}"), &consts.join("\n"))
    )
}

/// JS `Number(v.value)` rendered — integers print bare, non-numeric → "NaN".
fn number_str(v: Option<&Value>) -> String {
    match v {
        Some(Value::Number(n)) => n.to_string(),
        Some(Value::String(s)) => {
            // Number("5") === 5; Number("x") === NaN
            match s.trim().parse::<f64>() {
                Ok(f) if f.fract() == 0.0 => (f as i64).to_string(),
                Ok(f) => f.to_string(),
                Err(_) => "NaN".to_string(),
            }
        }
        Some(Value::Bool(b)) => if *b { "1" } else { "0" }.to_string(),
        _ => "NaN".to_string(),
    }
}

fn render_tagged_union(type_: &Value) -> String {
    let name = pascal_case(type_.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let head = doc_head(type_.get("description").and_then(|d| d.as_str()));
    let Some((property, mapping)) = union_mapping(type_) else {
        return render_untagged_union(type_);
    };
    let derives = derive_line(&["Debug", "Clone", "Serialize", "Deserialize"]);
    // Sorted for deterministic output regardless of IR key order.
    let mut entries: Vec<(&String, &Value)> = mapping.iter().collect();
    entries.sort_by(|(a, _), (b, _)| a.cmp(b));
    let mut seen = HashSet::new();
    let variants: Vec<String> = entries
        .iter()
        .map(|(value, variant)| {
            let vp = pascal_case(variant.as_str().unwrap_or(""));
            format!(
                "#[serde(rename = {})]\n{}({}),",
                rs_string(value),
                unique_name(&vp, &mut seen),
                vp
            )
        })
        .collect();
    format!(
        "{head}{derives}\n#[serde(tag = {})]\n{}",
        rs_string(&property),
        braced(&format!("pub enum {name}"), &variants.join("\n"))
    )
}

fn render_untagged_union(type_: &Value) -> String {
    let name = pascal_case(type_.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let head = doc_head(type_.get("description").and_then(|d| d.as_str()));
    let derives = derive_line(&["Debug", "Clone", "Serialize", "Deserialize"]);
    let empty = Vec::new();
    let variants_src = type_
        .get("variants")
        .and_then(|v| v.as_array())
        .unwrap_or(&empty);
    let mut variants: Vec<String> = variants_src
        .iter()
        .enumerate()
        .map(|(i, v)| format!("Variant{i}({}),", rs_type(Some(v))))
        .collect();
    variants.push("Other(serde_json::Value),".to_string());
    format!(
        "{head}{derives}\n#[serde(untagged)]\n{}",
        braced(&format!("pub enum {name}"), &variants.join("\n"))
    )
}

fn render_alias(type_: &Value) -> String {
    let name = pascal_case(type_.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let head = doc_head(type_.get("description").and_then(|d| d.as_str()));
    format!("{head}pub type {name} = {};", rs_type(type_.get("of")))
}
