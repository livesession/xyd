//! Port of model.ts — `lib/<pkg>/models.rb` emission.

use serde_json::Value;

use crate::naming::{pascal_case, screaming_snake_case, snake_case};
use crate::writer::{block, indent, rb_comment, rb_string};

pub fn render_models_file(spec: &Value, module_name: &str) -> String {
    let types = spec
        .get("types")
        .and_then(|t| t.as_array())
        .cloned()
        .unwrap_or_default();
    let decls: Vec<String> = types
        .iter()
        .map(render_named_type)
        .filter(|s| !s.is_empty())
        .collect();
    let body = if decls.is_empty() {
        "# No named types in this spec.".to_string()
    } else {
        decls.join("\n\n")
    };
    format!(
        "{}\n",
        block(
            &format!("module {module_name}"),
            &block("module Models", &body)
        )
    )
}

fn render_named_type(type_: &Value) -> String {
    match type_.get("kind").and_then(|k| k.as_str()) {
        Some("enum") => render_enum(type_),
        Some("union") => {
            if union_mapping(type_).is_some() {
                render_union_decoder(type_)
            } else {
                render_passthrough(type_)
            }
        }
        Some("alias") => render_passthrough(type_),
        _ => render_struct(type_),
    }
}

/// (propertyName, sorted mapping entries) of a mapped discriminated union.
pub fn union_mapping(type_: &Value) -> Option<(String, Vec<(String, String)>)> {
    if type_.get("kind").and_then(|k| k.as_str()) != Some("union") {
        return None;
    }
    let disc = type_.get("discriminator")?;
    let property = disc.get("propertyName").and_then(|p| p.as_str())?;
    if property.is_empty() {
        return None;
    }
    let mapping = disc.get("mapping").and_then(|m| m.as_object())?;
    if mapping.is_empty() {
        return None;
    }
    let entries: Vec<(String, String)> = mapping
        .iter()
        .map(|(k, v)| (k.clone(), v.as_str().unwrap_or("").to_string()))
        .collect();
    Some((property.to_string(), entries))
}

pub fn union_decoder_ref(module_name: &str, type_: &Value) -> String {
    let name = type_.get("name").and_then(|n| n.as_str()).unwrap_or("");
    format!("{module_name}::Models::{}", pascal_case(name))
}

fn render_union_decoder(type_: &Value) -> String {
    let name = pascal_case(type_.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let Some((property, mut entries)) = union_mapping(type_) else {
        return render_passthrough(type_);
    };
    // Sorted for deterministic output (a < b).
    entries.sort_by(|(a, _), (b, _)| a.cmp(b));
    let mapping_lines: Vec<String> = entries
        .iter()
        .map(|(value, variant)| {
            format!(
                "{} => {}",
                rb_string(value),
                rb_string(&pascal_case(variant))
            )
        })
        .collect();
    let mapping_block = if mapping_lines.len() == 1 {
        format!("MAPPING = {{ {} }}.freeze", mapping_lines[0])
    } else {
        format!(
            "MAPPING = {{\n{}\n}}.freeze",
            indent(&mapping_lines.join(",\n"))
        )
    };

    let inner_each = block(
        "klass.members.each do |member|",
        &[
            "if value.key?(member)",
            &indent("attrs[member] = value[member]"),
            "elsif value.key?(member.to_s)",
            &indent("attrs[member] = value[member.to_s]"),
            "end",
        ]
        .join("\n"),
    );

    let decode = [
        "# Decode a parsed JSON value into the concrete variant selected by the".to_string(),
        format!(
            "# {} discriminator. An unknown or absent discriminator",
            rb_string(&property)
        ),
        "# (or a non-Hash value) returns the value unchanged.".to_string(),
        "def self.decode(value)".to_string(),
        indent("return value unless value.is_a?(Hash)"),
        indent("raw = value[DISCRIMINATOR.to_sym]"),
        indent("raw = value[DISCRIMINATOR] if raw.nil?"),
        indent("variant = MAPPING[raw.to_s]"),
        indent("return value if variant.nil?"),
        indent("klass = Models.const_get(variant)"),
        indent("attrs = {}"),
        indent(&inner_each),
        indent("klass.new(**attrs)"),
        "rescue NameError, ArgumentError".to_string(),
        indent("value"),
        "end".to_string(),
    ]
    .join("\n");

    let body = [
        format!("DISCRIMINATOR = {}", rb_string(&property)),
        mapping_block,
        decode,
    ]
    .join("\n\n");
    let doc = rb_comment(desc(type_));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    format!("{head}{}", block(&format!("module {name}"), &body))
}

fn render_struct(type_: &Value) -> String {
    let name = pascal_case(type_.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let doc = rb_comment(desc(type_));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    let fields = type_
        .get("fields")
        .and_then(|f| f.as_array())
        .cloned()
        .unwrap_or_default();
    if fields.is_empty() {
        return format!("{head}{name} = Class.new");
    }
    let members: Vec<String> = fields
        .iter()
        .map(|f| {
            format!(
                ":{}",
                snake_case(f.get("name").and_then(|n| n.as_str()).unwrap_or(""))
            )
        })
        .collect();
    format!(
        "{head}{name} = Struct.new({}, keyword_init: true)",
        members.join(", ")
    )
}

fn render_enum(type_: &Value) -> String {
    let name = pascal_case(type_.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let doc = rb_comment(desc(type_));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    let values = type_
        .get("values")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    if values.is_empty() {
        return format!("{head}module {name}\nend");
    }
    let is_int = type_.get("base").and_then(|b| b.as_str()) == Some("integer");
    let members: Vec<String> = values
        .iter()
        .map(|v| {
            let name_or_value = v
                .get("name")
                .and_then(|n| n.as_str())
                .map(|s| s.to_string())
                .unwrap_or_else(|| js_string(v.get("value")));
            let mut member = screaming_snake_case(&name_or_value);
            if member.is_empty() {
                member = "VALUE".to_string();
            }
            let literal = if is_int {
                js_string(v.get("value"))
            } else {
                rb_string(&js_string(v.get("value")))
            };
            format!("{member} = {literal}")
        })
        .collect();
    format!(
        "{head}{}",
        block(&format!("module {name}"), &members.join("\n"))
    )
}

fn render_passthrough(type_: &Value) -> String {
    let name = pascal_case(type_.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let what = if type_.get("kind").and_then(|k| k.as_str()) == Some("alias") {
        alias_of(type_.get("of"))
    } else {
        "a union".to_string()
    };
    let doc = rb_comment(desc(type_));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    format!("{head}# {name} is {what}; values flow through as decoded JSON (phase-1 passthrough).")
}

fn alias_of(ref_: Option<&Value>) -> String {
    let Some(r) = ref_ else {
        return "an alias".to_string();
    };
    match r.get("kind").and_then(|k| k.as_str()) {
        Some("array") => "an array alias".to_string(),
        Some("map") => "a map alias".to_string(),
        Some("ref") => match r.get("name").and_then(|n| n.as_str()) {
            Some(n) if !n.is_empty() => format!("an alias of {}", pascal_case(n)),
            _ => "an alias".to_string(),
        },
        _ => "an alias".to_string(),
    }
}

fn desc(type_: &Value) -> &str {
    type_
        .get("description")
        .and_then(|d| d.as_str())
        .unwrap_or("")
}

/// JS `String(v)` for enum literal values (String(number)/String(bool)).
pub fn js_string(v: Option<&Value>) -> String {
    match v {
        None | Some(Value::Null) => "null".to_string(),
        Some(Value::Bool(b)) => b.to_string(),
        Some(Value::String(s)) => s.clone(),
        Some(Value::Number(n)) => n.to_string(),
        Some(other) => other.to_string(),
    }
}
