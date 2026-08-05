//! model.ts — Models.cs emission: struct → POCO, enum → enum + JsonConverter,
//! union (mapped discriminator) → static decoder.

use std::collections::BTreeSet;

use serde_json::Value;

use crate::cstype::{cs_type, nullable, Types};
use crate::cswriter::{cs_doc, cs_file, indent};
use crate::jsrt::{json_string, pascal_case, struct_property_names};

/// Emit `Models.cs` from the ordered `types` array + the lookup table.
pub fn render_models_file(types: &[Value], namespace_name: &str, table: Types) -> String {
    let mut usings: BTreeSet<String> = BTreeSet::new();
    let mut decls: Vec<String> = Vec::new();
    for ty in types {
        match ty.get("kind").and_then(Value::as_str) {
            Some("struct") => decls.push(struct_type(ty, table, &mut usings)),
            Some("enum") => decls.extend(enum_type(ty, &mut usings)),
            Some("union") => {
                if let Some(d) = union_decoder(ty, &mut usings) {
                    decls.push(d);
                }
            }
            _ => {} // alias / open union: resolved structurally by cs_type
        }
    }
    let usings_vec: Vec<String> = usings.into_iter().collect();
    cs_file(&usings_vec, namespace_name, &decls)
}

/// The generated converter class name for an enum, e.g. `PetStatusConverter`.
fn enum_converter_name(type_name: &str) -> String {
    format!("{}Converter", pascal_case(type_name))
}

/// The generated discriminated-union decoder class name, e.g. `ShapeUnion`.
pub fn union_decoder_name(type_name: &str) -> String {
    format!("{}Union", pascal_case(type_name))
}

/// One enum member identifier from a value (name override, else the wire value).
fn enum_member_name(value: &Value) -> String {
    let raw = match value.get("name") {
        Some(n) if !n.is_null() => crate::jsrt::js_string(n),
        _ => crate::jsrt::js_string(value.get("value").unwrap_or(&Value::Null)),
    };
    let p = pascal_case(&raw);
    if p.is_empty() {
        "Value".to_string()
    } else {
        p
    }
}

/// Whether a field's type is a fixed-literal scalar (JSON Schema const).
fn is_const_field(field: &Value) -> bool {
    let t = field.get("type");
    t.and_then(|r| r.get("kind")).and_then(Value::as_str) == Some("scalar")
        && t.and_then(|r| r.get("const"))
            .map(|c| !c.is_null())
            .unwrap_or(false)
}

/// The C# literal for a const scalar value (string quoted, number/bool verbatim).
fn cs_const_literal(value: &Value) -> String {
    match value {
        Value::Bool(b) => {
            if *b {
                "true".to_string()
            } else {
                "false".to_string()
            }
        }
        Value::Number(n) => n.to_string(),
        other => json_string(&crate::jsrt::js_string(other)),
    }
}

/// The mapped discriminator (propertyName + non-empty mapping), else None.
pub fn union_mapping(ty: &Value) -> Option<(String, Vec<(String, String)>)> {
    if ty.get("kind").and_then(Value::as_str) != Some("union") {
        return None;
    }
    let disc = ty.get("discriminator")?;
    let property = disc.get("propertyName").and_then(Value::as_str)?;
    if property.is_empty() {
        return None;
    }
    let mapping = disc.get("mapping").and_then(Value::as_object)?;
    if mapping.is_empty() {
        return None;
    }
    let pairs: Vec<(String, String)> = mapping
        .iter()
        .map(|(k, v)| (k.clone(), crate::jsrt::js_string(v)))
        .collect();
    Some((property.to_string(), pairs))
}

fn struct_type(ty: &Value, table: Types, usings: &mut BTreeSet<String>) -> String {
    let name = pascal_case(ty.get("name").and_then(Value::as_str).unwrap_or(""));
    let doc = cs_doc(ty.get("description").and_then(Value::as_str));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    let fields = ty
        .get("fields")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    if fields.is_empty() {
        return format!("{head}public sealed class {name}\n{{\n}}");
    }
    usings.insert("System.Text.Json.Serialization".to_string());
    let field_names: Vec<String> = fields
        .iter()
        .map(|f| {
            f.get("name")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string()
        })
        .collect();
    let idents = struct_property_names(&name, &field_names);
    let members = fields
        .iter()
        .enumerate()
        .map(|(i, f)| struct_property(f, &idents[i].1, table, usings))
        .collect::<Vec<_>>()
        .join("\n\n");
    format!(
        "{head}public sealed class {name}\n{{\n{}\n}}",
        indent(&members)
    )
}

/// One `[JsonPropertyName("wire")] public T? Prop { get; set; }` member.
fn struct_property(
    field: &Value,
    prop_name: &str,
    table: Types,
    usings: &mut BTreeSet<String>,
) -> String {
    let ty = cs_type(field.get("type"), table);
    if ty.contains("List<") || ty.contains("Dictionary<") {
        usings.insert("System.Collections.Generic".to_string());
    }
    let doc = cs_doc(field.get("description").and_then(Value::as_str));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    let init = if is_const_field(field) {
        format!(
            " = {};",
            cs_const_literal(
                field
                    .get("type")
                    .and_then(|t| t.get("const"))
                    .unwrap_or(&Value::Null)
            )
        )
    } else {
        String::new()
    };
    let wire = json_string(field.get("name").and_then(Value::as_str).unwrap_or(""));
    format!(
        "{head}[JsonPropertyName({wire})]\npublic {} {prop_name} {{ get; set; }}{init}",
        nullable(&ty)
    )
}

/// The enum declaration + its string<->member JsonConverter (string enums).
fn enum_type(ty: &Value, usings: &mut BTreeSet<String>) -> Vec<String> {
    let raw_name = ty.get("name").and_then(Value::as_str).unwrap_or("");
    let name = pascal_case(raw_name);
    let values = ty
        .get("values")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let doc = cs_doc(ty.get("description").and_then(Value::as_str));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    usings.insert("System.Text.Json.Serialization".to_string());

    // Integer-based enums serialize as their numeric value by default.
    if ty.get("base").and_then(Value::as_str) == Some("integer") {
        let members = values
            .iter()
            .map(|v| {
                format!(
                    "{} = {},",
                    enum_member_name(v),
                    number_str(v.get("value").unwrap_or(&Value::Null))
                )
            })
            .collect::<Vec<_>>()
            .join("\n");
        let body = if members.is_empty() {
            "// no values".to_string()
        } else {
            members
        };
        return vec![format!(
            "{head}public enum {name}\n{{\n{}\n}}",
            indent(&body)
        )];
    }

    // String enums: a generated converter maps each member to its wire literal.
    usings.insert("System".to_string());
    usings.insert("System.Text.Json".to_string());
    let converter = enum_converter_name(raw_name);
    let members = values
        .iter()
        .map(|v| format!("{},", enum_member_name(v)))
        .collect::<Vec<_>>()
        .join("\n");
    let members_body = if members.is_empty() {
        "// no values".to_string()
    } else {
        members
    };
    let enum_decl = format!(
        "{head}[JsonConverter(typeof({converter}))]\npublic enum {name}\n{{\n{}\n}}",
        indent(&members_body)
    );

    let read_cases = values
        .iter()
        .map(|v| {
            format!(
                "{} => {name}.{},",
                json_string(&crate::jsrt::js_string(
                    v.get("value").unwrap_or(&Value::Null)
                )),
                enum_member_name(v)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    let write_cases = values
        .iter()
        .map(|v| {
            format!(
                "{name}.{} => {},",
                enum_member_name(v),
                json_string(&crate::jsrt::js_string(
                    v.get("value").unwrap_or(&Value::Null)
                ))
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let read_inner = format!(
        "string? value = reader.GetString();\nreturn value switch\n{{\n{}\n}};",
        indent(&format!(
            "{read_cases}\n_ => throw new JsonException($\"Unknown {name} value: {{value}}\"),"
        ))
    );
    let write_inner = format!(
        "writer.WriteStringValue(value switch\n{{\n{}\n}});",
        indent(&format!(
            "{write_cases}\n_ => throw new JsonException($\"Unknown {name} value: {{value}}\"),"
        ))
    );
    let converter_body = format!(
        "public override {name} Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)\n{{\n{}\n}}\n\npublic override void Write(Utf8JsonWriter writer, {name} value, JsonSerializerOptions options)\n{{\n{}\n}}",
        indent(&read_inner),
        indent(&write_inner)
    );
    let converter_decl = format!(
        "internal sealed class {converter} : JsonConverter<{name}>\n{{\n{}\n}}",
        indent(&converter_body)
    );

    vec![enum_decl, converter_decl]
}

/// The static decoder for a union with a mapped discriminator.
fn union_decoder(ty: &Value, usings: &mut BTreeSet<String>) -> Option<String> {
    let (property, mapping) = union_mapping(ty)?;
    usings.insert("System.Text.Json".to_string());

    let raw_name = ty.get("name").and_then(Value::as_str).unwrap_or("");
    let name = pascal_case(raw_name);
    let cls = union_decoder_name(raw_name);
    // Sorted for deterministic output regardless of IR key order.
    let mut entries = mapping;
    entries.sort_by(|a, b| a.0.cmp(&b.0));
    let cases = entries
        .iter()
        .map(|(value, variant)| {
            format!(
                "case {}:\n    return JsonSerializer.Deserialize<{}>(json, Options);",
                json_string(value),
                pascal_case(variant)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let doc = cs_doc(Some(&format!(
        "Decodes a {name} from JSON by its {} discriminator, returning the raw JSON element when the value is unknown.",
        json_string(&property)
    )));
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };

    let switch_block = format!(
        "switch (discriminator.GetString())\n{{\n{}\n}}",
        indent(&cases)
    );
    let inner = format!(
        "if (string.IsNullOrEmpty(json))\n{{\n    return null;\n}}\nusing JsonDocument document = JsonDocument.Parse(json);\nJsonElement root = document.RootElement;\nif (root.ValueKind == JsonValueKind.Object &&\n    root.TryGetProperty({}, out JsonElement discriminator) &&\n    discriminator.ValueKind == JsonValueKind.String)\n{{\n{}\n}}\nreturn JsonSerializer.Deserialize<JsonElement>(json, Options);",
        json_string(&property),
        indent(&switch_block)
    );
    let body = format!(
        "private static readonly JsonSerializerOptions Options = new() {{ PropertyNameCaseInsensitive = true }};\n\npublic static object? Decode(string json)\n{{\n{}\n}}",
        indent(&inner)
    );
    Some(format!(
        "{head}internal static class {cls}\n{{\n{}\n}}",
        indent(&body)
    ))
}

/// JS `String(Number(value))` for integer enum members.
fn number_str(v: &Value) -> String {
    match v {
        Value::Number(n) => n.to_string(),
        Value::String(s) => {
            if let Ok(i) = s.parse::<i64>() {
                i.to_string()
            } else if let Ok(f) = s.parse::<f64>() {
                // JS String(Number) drops a trailing ".0"
                if f.fract() == 0.0 {
                    (f as i64).to_string()
                } else {
                    f.to_string()
                }
            } else {
                "NaN".to_string()
            }
        }
        Value::Bool(b) => {
            if *b {
                "1".to_string()
            } else {
                "0".to_string()
            }
        }
        _ => "NaN".to_string(),
    }
}
