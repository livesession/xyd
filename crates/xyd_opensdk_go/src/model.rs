//! types.go emitter — port of model.ts.

use serde_json::Value;

use crate::gotype::go_type;
use crate::gowriter::{go_doc, go_field, go_file, go_struct, Imports};
use crate::naming::{json_string, pascal_case};

pub fn render_types_file(spec: &Value, pkg: &str) -> String {
    let mut imports = Imports::new();
    let mut decls: Vec<String> = Vec::new();
    if let Some(types) = spec.get("types").and_then(|t| t.as_array()) {
        for t in types {
            decls.push(render_named_type(t, &mut imports));
        }
    }
    go_file(pkg, &imports, &decls)
}

fn render_named_type(t: &Value, imports: &mut Imports) -> String {
    match t.get("kind").and_then(|k| k.as_str()) {
        Some("enum") => render_enum(t),
        Some("alias") => render_alias(t),
        Some("union") => render_union(t, imports),
        _ => render_struct(t),
    }
}

pub fn is_const_field(field: &Value) -> bool {
    let r = field.get("type");
    r.and_then(|r| r.get("kind")).and_then(|k| k.as_str()) == Some("scalar")
        && r.and_then(|r| r.get("const")).is_some()
}

pub fn const_field_name(type_name: &str, field_name: &str) -> String {
    format!("{}{}Const", pascal_case(type_name), pascal_case(field_name))
}

pub fn go_enum_const_name(enum_type_name: &str, value: &Value) -> String {
    if let Some(name) = value.get("name").and_then(|n| n.as_str()) {
        return pascal_case(name);
    }
    format!(
        "{}{}",
        pascal_case(enum_type_name),
        pascal_case(&js_string_of(value.get("value")))
    )
}

/// JS `String(value)` of the enum value field.
fn js_string_of(v: Option<&Value>) -> String {
    match v {
        Some(Value::String(s)) => s.clone(),
        Some(Value::Number(n)) => n.to_string(),
        Some(Value::Bool(b)) => b.to_string(),
        Some(Value::Null) | None => "null".to_string(),
        Some(other) => other.to_string(),
    }
}

pub fn go_const_literal(value: Option<&Value>) -> String {
    match value {
        Some(Value::Number(n)) => n.to_string(),
        Some(Value::Bool(b)) => b.to_string(),
        other => json_string(&js_string_of(other)),
    }
}

pub fn go_zero_literal(go_scalar: &str) -> String {
    match go_scalar {
        "string" => "\"\"".to_string(),
        "bool" => "false".to_string(),
        _ => "0".to_string(),
    }
}

fn render_struct(t: &Value) -> String {
    let name = pascal_case(t.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let empty: Vec<Value> = Vec::new();
    let fields = t.get("fields").and_then(|f| f.as_array()).unwrap_or(&empty);
    let field_lines: Vec<String> = fields
        .iter()
        .map(|f| {
            let go_name = pascal_case(f.get("name").and_then(|n| n.as_str()).unwrap_or(""));
            let tag = format!(
                "json:{}",
                json_string(f.get("name").and_then(|n| n.as_str()).unwrap_or(""))
            );
            go_field(&go_name, &go_type(f.get("type")), Some(&tag))
        })
        .collect();
    let doc = go_doc(t.get("description").and_then(|d| d.as_str()), Some(&name));
    let mut decls = vec![go_struct(&name, &field_lines, &doc)];

    for f in fields {
        if !is_const_field(f) {
            continue;
        }
        let fname = f.get("name").and_then(|n| n.as_str()).unwrap_or("");
        let ident = const_field_name(t.get("name").and_then(|n| n.as_str()).unwrap_or(""), fname);
        let doc = format!(
            "// {ident} is the fixed value of {name}.{}. Request\n// marshaling auto-fills it when the field is zero; response decoding\n// leaves it a plain field.",
            pascal_case(fname)
        );
        decls.push(format!(
            "{doc}\nconst {ident} {} = {}",
            go_type(f.get("type")),
            go_const_literal(f.get("type").and_then(|t| t.get("const")))
        ));
    }
    decls.join("\n\n")
}

fn render_enum(t: &Value) -> String {
    let name = pascal_case(t.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let base = if t.get("base").and_then(|b| b.as_str()) == Some("integer") {
        "int64"
    } else {
        "string"
    };
    let doc = go_doc(t.get("description").and_then(|d| d.as_str()), Some(&name));
    let head = format!(
        "{}type {name} {base}",
        if doc.is_empty() {
            String::new()
        } else {
            format!("{doc}\n")
        }
    );

    let empty: Vec<Value> = Vec::new();
    let values = t.get("values").and_then(|v| v.as_array()).unwrap_or(&empty);
    if values.is_empty() {
        return head;
    }
    let consts = values
        .iter()
        .map(|v| {
            format!(
                "\t{} {name} = {}",
                go_enum_const_name(t.get("name").and_then(|n| n.as_str()).unwrap_or(""), v),
                literal(v.get("value"), base)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    format!("{head}\n\nconst (\n{consts}\n)")
}

fn literal(value: Option<&Value>, base: &str) -> String {
    if base == "int64" {
        js_string_of(value)
    } else {
        json_string(&js_string_of(value))
    }
}

fn render_alias(t: &Value) -> String {
    let name = pascal_case(t.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let doc = go_doc(t.get("description").and_then(|d| d.as_str()), Some(&name));
    format!(
        "{}type {name} = {}",
        if doc.is_empty() {
            String::new()
        } else {
            format!("{doc}\n")
        },
        go_type(t.get("of"))
    )
}

pub fn union_mapping(t: &Value) -> Option<(String, Vec<(String, String)>)> {
    if t.get("kind").and_then(|k| k.as_str()) != Some("union") {
        return None;
    }
    let disc = t.get("discriminator")?;
    let property = disc.get("propertyName").and_then(|p| p.as_str())?;
    let mapping = disc.get("mapping").and_then(|m| m.as_object())?;
    if property.is_empty() || mapping.is_empty() {
        return None;
    }
    let entries: Vec<(String, String)> = mapping
        .iter()
        .map(|(k, v)| (k.clone(), v.as_str().unwrap_or("").to_string()))
        .collect();
    Some((property.to_string(), entries))
}

pub fn union_unmarshaler_name(t: &Value) -> String {
    format!(
        "Unmarshal{}JSON",
        pascal_case(t.get("name").and_then(|n| n.as_str()).unwrap_or(""))
    )
}

fn render_union(t: &Value, imports: &mut Imports) -> String {
    let name = pascal_case(t.get("name").and_then(|n| n.as_str()).unwrap_or(""));
    let doc = go_doc(t.get("description").and_then(|d| d.as_str()), Some(&name));
    let decl = format!(
        "{}type {name} interface{{}}",
        if doc.is_empty() {
            String::new()
        } else {
            format!("{doc}\n")
        }
    );

    let Some((property, mut mapping)) = union_mapping(t) else {
        return decl;
    };
    imports.add("encoding/json", None);
    mapping.sort_by(|a, b| a.0.cmp(&b.0));

    let cases = mapping
        .iter()
        .map(|(value, variant)| {
            format!(
                "\tcase {}:\n\t\tvar variant {}\n\t\tif err := json.Unmarshal(data, &variant); err != nil {{\n\t\t\treturn nil, err\n\t\t}}\n\t\treturn variant, nil",
                json_string(value),
                pascal_case(variant)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let un = union_unmarshaler_name(t);
    let helper_doc = format!(
        "// {un} decodes JSON into the concrete {name} variant selected\n// by the {} discriminator property. An unknown (or absent)\n// discriminator value retains the raw JSON as a json.RawMessage so no data is lost.",
        json_string(&property)
    );
    let helper = format!(
        "{helper_doc}\nfunc {un}(data []byte) ({name}, error) {{\n\tvar probe struct {{\n\t\tDiscriminator string `json:{}`\n\t}}\n\tif err := json.Unmarshal(data, &probe); err != nil {{\n\t\treturn nil, err\n\t}}\n\tswitch probe.Discriminator {{\n{cases}\n\t}}\n\treturn json.RawMessage(append([]byte(nil), data...)), nil\n}}",
        json_string(&property)
    );
    format!("{decl}\n\n{helper}")
}
