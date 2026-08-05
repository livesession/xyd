//! `renderJavaExample` from example-java.ts: render a language-neutral
//! `ExampleValue` into a compilable Java expression. Kept next to the planner so
//! the two evolve together; the generated test suite drives it.

use serde_json::Value;

use crate::example_plan::ExampleValue;
use crate::ir::Types;
use crate::javatype::const_literal;
use crate::jsrt::{json_str, pascal_case, screaming_snake_case};

/// Render a language-neutral example value into a compilable Java expression.
pub fn render_java_example(value: &ExampleValue, types: &Types) -> String {
    match value {
        ExampleValue::Str(s) => json_str(s),
        ExampleValue::Integer(v) => format!("{v}L"),
        ExampleValue::Number(v) => {
            if v.fract() == 0.0 {
                format!("{}.0", *v as i64)
            } else {
                format!("{v}")
            }
        }
        ExampleValue::Boolean(b) => {
            if *b {
                "true".to_string()
            } else {
                "false".to_string()
            }
        }
        ExampleValue::Null => "null".to_string(),
        ExampleValue::Binary => {
            "\"Example data\".getBytes(java.nio.charset.StandardCharsets.UTF_8)".to_string()
        }
        ExampleValue::Enum { type_name, value } => render_enum_const(type_name, value, types),
        ExampleValue::Const(v) => const_literal(v),
        ExampleValue::Array(item) => {
            if is_renderable_element(item) {
                format!("java.util.List.of({})", render_java_example(item, types))
            } else {
                "java.util.List.of()".to_string()
            }
        }
        ExampleValue::Map(v) => {
            if is_renderable_element(v) {
                format!(
                    "java.util.Map.of(\"key\", {})",
                    render_java_example(v, types)
                )
            } else {
                "java.util.Map.of()".to_string()
            }
        }
        // An open union field is typed Object; render its planned variant so a
        // REQUIRED union field gets a non-null value the builder's required-guard
        // accepts (a scalar/enum variant is Object-assignable).
        ExampleValue::Union(variant) => render_java_example(variant, types),
        // A model POJO is decode-only (no builder), but every generated struct has
        // a public no-arg constructor, so a REQUIRED object-typed field gets a
        // valid non-null instance. Falls back to null for a type with no class.
        ExampleValue::Object { type_name, .. } => match type_name {
            Some(name)
                if types
                    .get(name)
                    .and_then(|n| n.get("kind"))
                    .and_then(Value::as_str)
                    == Some("struct") =>
            {
                format!("new {}()", pascal_case(name))
            }
            _ => "null".to_string(),
        },
        ExampleValue::Any => "null".to_string(),
    }
}

/// Whether an example element renders to a self-typed literal (safe inside
/// List.of / Map.of).
fn is_renderable_element(value: &ExampleValue) -> bool {
    matches!(
        value,
        ExampleValue::Str(_)
            | ExampleValue::Integer(_)
            | ExampleValue::Number(_)
            | ExampleValue::Boolean(_)
            | ExampleValue::Enum { .. }
            | ExampleValue::Const(_)
            | ExampleValue::Binary
    )
}

/// JS `String(value)` for an enum member seed.
fn js_string(v: &Value) -> String {
    match v {
        Value::Null => "null".to_string(),
        Value::Bool(b) => b.to_string(),
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        _ => v.to_string(),
    }
}

/// The generated Java enum constant for an example enum value (matches model.ts
/// enumMember).
fn render_enum_const(type_name: &str, raw_value: &Value, types: &Types) -> String {
    let named = types.get(type_name);
    let ev = named
        .and_then(|n| n.get("values"))
        .and_then(Value::as_array)
        .and_then(|vals| vals.iter().find(|v| v.get("value") == Some(raw_value)));
    let seed = ev
        .and_then(|e| e.get("name"))
        .or_else(|| ev.and_then(|e| e.get("value")))
        .map(js_string)
        .unwrap_or_else(|| js_string(raw_value));
    let member = {
        let m = screaming_snake_case(&seed);
        if m.is_empty() {
            "VALUE".to_string()
        } else {
            m
        }
    };
    format!("{}.{}", pascal_case(type_name), member)
}
