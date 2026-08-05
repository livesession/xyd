//! `src/models.ts` emission + IR TypeRef -> TS type mapping.
//! Ports `src/model.ts` and `src/nodetype.ts`.

use std::collections::BTreeSet;

use crate::ir::{Field, NamedType, Spec, TypeRef};
use crate::jsrt::{js_doc, json_string, pascal_case, prop_key};

/// Tracks the model type names a rendered file references (sorted for imports).
pub type ModelRefs = BTreeSet<String>;

/// Map an IR TypeRef to a TS type expression (nullable -> ` | null`).
pub fn node_type(ref_: Option<&TypeRef>, refs: &mut ModelRefs) -> String {
    let Some(r) = ref_ else {
        return "unknown".to_string();
    };
    let base = node_base(r, refs);
    if r.nullable == Some(true) {
        format!("{base} | null")
    } else {
        base
    }
}

fn node_base(r: &TypeRef, refs: &mut ModelRefs) -> String {
    if let Some(c) = &r.const_val {
        return const_literal(c);
    }
    match r.kind() {
        "scalar" => node_scalar(r.scalar.as_deref(), r.format.as_deref()),
        "ref" => match r.name.as_deref() {
            Some(name) if !name.is_empty() => {
                let n = pascal_case(name);
                refs.insert(n.clone());
                n
            }
            _ => "unknown".to_string(),
        },
        "array" => format!("{}[]", maybe_paren(&node_type(r.items.as_deref(), refs))),
        "map" => format!("Record<string, {}>", node_type(r.values.as_deref(), refs)),
        _ => "unknown".to_string(),
    }
}

fn maybe_paren(t: &str) -> String {
    if t.contains(' ') {
        format!("({t})")
    } else {
        t.to_string()
    }
}

fn node_scalar(scalar: Option<&str>, format: Option<&str>) -> String {
    match scalar {
        Some("string") => {
            if format == Some("binary") {
                "Uint8Array | Blob".to_string()
            } else {
                "string".to_string()
            }
        }
        Some("integer") | Some("number") => "number".to_string(),
        Some("boolean") => "boolean".to_string(),
        _ => "unknown".to_string(),
    }
}

fn const_literal(value: &serde_json::Value) -> String {
    match value {
        serde_json::Value::String(s) => json_string(s),
        serde_json::Value::Number(n) => n.to_string(),
        serde_json::Value::Bool(b) => b.to_string(),
        _ => "unknown".to_string(),
    }
}

/// Whether a TypeRef ultimately carries binary bytes (`format: binary`),
/// following array items and named union/alias refs.
pub fn is_binary_type_ref(
    ref_: Option<&TypeRef>,
    types: &[&NamedType],
    seen: &mut BTreeSet<String>,
) -> bool {
    let Some(r) = ref_ else {
        return false;
    };
    match r.kind() {
        "scalar" => r.scalar.as_deref() == Some("string") && r.format.as_deref() == Some("binary"),
        "array" => is_binary_type_ref(r.items.as_deref(), types, seen),
        "ref" => {
            let Some(name) = r.name.as_deref() else {
                return false;
            };
            if seen.contains(name) {
                return false;
            }
            seen.insert(name.to_string());
            let Some(named) = types.iter().find(|t| t.name == name) else {
                return false;
            };
            match named.kind.as_str() {
                "union" => named
                    .variants
                    .iter()
                    .any(|v| is_binary_type_ref(Some(v), types, seen)),
                "alias" => is_binary_type_ref(named.of.as_ref(), types, seen),
                _ => false,
            }
        }
        _ => false,
    }
}

/// Resolve a request body's fields by following its TypeRef into the symbol table.
pub fn body_fields<'a>(ref_: Option<&TypeRef>, types: &'a [&'a NamedType]) -> Vec<&'a Field> {
    if let Some(r) = ref_ {
        if r.kind() == "ref" {
            if let Some(name) = r.name.as_deref() {
                if let Some(named) = types.iter().find(|t| t.name == name) {
                    return named.fields.iter().collect();
                }
            }
        }
    }
    Vec::new()
}

// ---- models.ts -----------------------------------------------------------

/// Emit `src/models.ts`.
pub fn render_models_file(spec: &Spec) -> String {
    let decls: Vec<String> = spec
        .types
        .iter()
        .map(render_named_type)
        .filter(|d| !d.is_empty())
        .collect();
    if decls.is_empty() {
        return "export {};\n".to_string();
    }
    format!("{}\n", decls.join("\n\n"))
}

fn render_named_type(t: &NamedType) -> String {
    match t.kind.as_str() {
        "enum" => render_enum(t),
        "alias" => render_alias(t),
        "union" => render_union(t),
        _ => render_interface(t),
    }
}

fn render_interface(t: &NamedType) -> String {
    let name = pascal_case(&t.name);
    let mut refs = ModelRefs::new();
    let fields: Vec<String> = t
        .fields
        .iter()
        .map(|f| interface_field_line(f, &mut refs))
        .collect();
    let body = if fields.is_empty() {
        String::new()
    } else {
        format!("\n{}\n", fields.join("\n"))
    };
    format!(
        "{}export interface {} {{{}}}",
        js_doc(t.description.as_deref()),
        name,
        body
    )
}

fn interface_field_line(f: &Field, refs: &mut ModelRefs) -> String {
    let doc = js_doc(f.description.as_deref());
    let doc_lines = if doc.is_empty() {
        String::new()
    } else {
        let joined: Vec<String> = doc
            .split('\n')
            .filter(|l| !l.is_empty())
            .map(|l| format!("  {l}"))
            .collect();
        format!("{}\n", joined.join("\n"))
    };
    let key = prop_key(&f.name);
    let optional = if f.required == Some(true) { "" } else { "?" };
    format!(
        "{}  {}{}: {};",
        doc_lines,
        key,
        optional,
        node_type(Some(&f.ty), refs)
    )
}

fn render_enum(t: &NamedType) -> String {
    let name = pascal_case(&t.name);
    if t.values.is_empty() {
        return format!(
            "{}export type {} = never;",
            js_doc(t.description.as_deref()),
            name
        );
    }
    let members: Vec<String> = t
        .values
        .iter()
        .map(|v| enum_literal(&v.value, t.base.as_deref()))
        .collect();
    format!(
        "{}export type {} = {};",
        js_doc(t.description.as_deref()),
        name,
        members.join(" | ")
    )
}

fn enum_literal(value: &serde_json::Value, base: Option<&str>) -> String {
    if base == Some("integer") {
        return value_to_js_string(value);
    }
    json_string(&value_to_js_string(value))
}

/// JS `String(value)` coercion for enum values (string passthrough, number/bool stringified).
fn value_to_js_string(value: &serde_json::Value) -> String {
    match value {
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Number(n) => n.to_string(),
        serde_json::Value::Bool(b) => b.to_string(),
        serde_json::Value::Null => "null".to_string(),
        other => other.to_string(),
    }
}

fn render_alias(t: &NamedType) -> String {
    let name = pascal_case(&t.name);
    let mut refs = ModelRefs::new();
    format!(
        "{}export type {} = {};",
        js_doc(t.description.as_deref()),
        name,
        node_type(t.of.as_ref(), &mut refs)
    )
}

fn render_union(t: &NamedType) -> String {
    let name = pascal_case(&t.name);
    let mut refs = ModelRefs::new();
    let rhs = if t.variants.is_empty() {
        "unknown".to_string()
    } else {
        t.variants
            .iter()
            .map(|v| node_type(Some(v), &mut refs))
            .collect::<Vec<_>>()
            .join(" | ")
    };
    let decl = format!(
        "{}export type {} = {};",
        js_doc(t.description.as_deref()),
        name,
        rhs
    );
    if mapped_union(t).is_some() {
        format!("{decl}\n\n{}", render_decode_union(t))
    } else {
        decl
    }
}

/// A union with a usable discriminator (propertyName + non-empty mapping).
pub fn mapped_union(t: &NamedType) -> Option<(&str, &serde_json::Map<String, serde_json::Value>)> {
    let disc = t.discriminator.as_ref()?;
    let prop = disc.property_name.as_deref()?;
    if !prop.is_empty() && !disc.mapping.is_empty() {
        Some((prop, &disc.mapping))
    } else {
        None
    }
}

/// The `decode<Union>` function name for a mapped-union type, else None.
pub fn union_decode_name(t: &NamedType) -> Option<String> {
    mapped_union(t).map(|_| format!("decode{}", pascal_case(&t.name)))
}

fn render_decode_union(t: &NamedType) -> String {
    let name = pascal_case(&t.name);
    let (property_name, mapping) = mapped_union(t).unwrap();
    let safe = crate::jsrt::prop_key(property_name) == property_name;
    let type_key = if safe {
        property_name.to_string()
    } else {
        json_string(property_name)
    };
    let accessor = if safe {
        format!("?.{property_name}")
    } else {
        format!("?.[{}]", json_string(property_name))
    };
    let cases: Vec<String> = mapping
        .iter()
        .map(|(value, variant)| {
            let variant_name = variant.as_str().unwrap_or_default();
            format!(
                "    case {}:\n      return data as {};",
                json_string(value),
                pascal_case(variant_name)
            )
        })
        .collect();
    // Built with explicit "\n" (no `\`-line-continuation, which would strip the
    // next line's indentation).
    let mut out = String::new();
    out.push_str(&format!(
        "/** Decode a `{name}` by its `{property_name}` discriminator (unknown value falls through). */\n"
    ));
    out.push_str(&format!(
        "export function decode{name}(data: unknown): {name} {{\n"
    ));
    out.push_str(&format!(
        "  switch ((data as {{ {type_key}?: string }} | null | undefined){accessor}) {{\n"
    ));
    out.push_str(&cases.join("\n"));
    out.push('\n');
    out.push_str(&format!("    default:\n      return data as {name};\n"));
    out.push_str("  }\n}");
    out
}
