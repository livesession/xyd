//! Port of `example-rs.ts` `renderRsExample`: render the framework's language
//! -neutral `ExampleValue` tree into a Rust literal for the generated test suite.
//! The shared planner decides WHAT a realistic example is; this only decides how
//! Rust spells it — enums as typed variants, objects as struct literals with
//! `..Default::default()`, binary as a `Vec<u8>` — so the Go/Python/Ruby/Rust
//! suites exercise byte-identical shapes and can never drift.

use serde_json::{Map, Value};

use crate::example_plan::{ExampleField, ExampleValue};
use crate::model::union_mapping;
use crate::naming::{pascal_case, snake_case};
use crate::rswriter::rs_string;

/// Render one `ExampleValue` as a Rust expression. `owned` controls scalar
/// strings: a struct/params field wants an owned `String` (`"x".to_string()`), a
/// `&str` path argument wants a borrowed literal (`"x"`).
pub fn render_rs_example(value: &ExampleValue, types: &Map<String, Value>, owned: bool) -> String {
    match value {
        ExampleValue::Str(s) => {
            if owned {
                format!("{}.to_string()", rs_string(s))
            } else {
                rs_string(s)
            }
        }
        ExampleValue::Integer(n) => n.to_string(),
        ExampleValue::Number(f) => float_literal(*f),
        ExampleValue::Boolean(b) => bool_lit(*b).to_string(),
        ExampleValue::Null => "Default::default()".to_string(),
        ExampleValue::Binary => "b\"Example data\".to_vec()".to_string(),
        ExampleValue::Enum { type_name, value } => render_enum(type_name, value, types),
        ExampleValue::Const(v) => render_literal(v, owned),
        ExampleValue::Array(item) => format!("vec![{}]", render_rs_example(item, types, true)),
        ExampleValue::Map(v) => format!(
            "std::collections::HashMap::from([(\"key\".to_string(), {})])",
            render_rs_example(v, types, true)
        ),
        ExampleValue::Object { type_name, fields } => {
            render_object(type_name.as_deref(), fields, types)
        }
        ExampleValue::Union { type_name, variant } => render_union(type_name, variant, types),
        ExampleValue::Any => "Default::default()".to_string(),
    }
}

fn bool_lit(b: bool) -> &'static str {
    if b {
        "true"
    } else {
        "false"
    }
}

/// A Rust float literal that infers to f32/f64 as needed (`0` -> `0.0`).
fn float_literal(value: f64) -> String {
    if value.fract() == 0.0 {
        format!("{}.0", value as i64)
    } else {
        format!("{value}")
    }
}

fn render_object(
    type_name: Option<&str>,
    fields: &[ExampleField],
    types: &Map<String, Value>,
) -> String {
    let name = pascal_case(type_name.unwrap_or("Value"));
    if fields.is_empty() {
        return format!("{name}::default()");
    }
    let rows: Vec<String> = fields
        .iter()
        .map(|f| {
            format!(
                "{}: Some({})",
                snake_case(&f.name),
                render_rs_example(&f.value, types, true)
            )
        })
        .collect();
    format!("{name} {{ {}, ..Default::default() }}", rows.join(", "))
}

/// An enum example: a newtype `(value)` for integer enums, else `Type::Variant`.
fn render_enum(type_name: &str, value: &Value, types: &Map<String, Value>) -> String {
    let named = types.get(type_name);
    let type_ = pascal_case(type_name);
    if named.and_then(|n| n.get("base")).and_then(Value::as_str) == Some("integer") {
        return format!("{type_}({})", js_number(value));
    }
    let target = js_string(value);
    let variant = named
        .and_then(|n| n.get("values"))
        .and_then(Value::as_array)
        .and_then(|values| {
            values
                .iter()
                .find(|v| v.get("value").map(js_string).as_deref() == Some(target.as_str()))
        })
        .map(|m| {
            let src = m
                .get("name")
                .filter(|x| !x.is_null())
                .or_else(|| m.get("value"))
                .cloned()
                .unwrap_or(Value::Null);
            js_string(&src)
        })
        .unwrap_or_else(|| target.clone());
    format!("{type_}::{}", pascal_case(&variant))
}

/// A union example wrapped in the correct enum variant. A discriminated (tagged)
/// union renders its named variant (`Type::VariantName(inner)`); an untagged union
/// renders `Type::Variant0(inner)` — the index-0 variant the model emitter emits.
fn render_union(type_name: &str, variant: &ExampleValue, types: &Map<String, Value>) -> String {
    let named = types.get(type_name);
    let tagged = named.map(|n| union_mapping(n).is_some()).unwrap_or(false);
    let inner = render_rs_example(variant, types, true);
    if tagged {
        if let ExampleValue::Object {
            type_name: Some(variant_name),
            ..
        } = variant
        {
            return format!(
                "{}::{}({inner})",
                pascal_case(type_name),
                pascal_case(variant_name)
            );
        }
    }
    format!("{}::Variant0({inner})", pascal_case(type_name))
}

/// A JSON scalar (enum/const wire value) as a Rust literal (mirrors `renderLiteral`).
fn render_literal(v: &Value, owned: bool) -> String {
    match v {
        Value::Null => "Default::default()".to_string(),
        Value::Bool(b) => bool_lit(*b).to_string(),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                i.to_string()
            } else if let Some(u) = n.as_u64() {
                u.to_string()
            } else {
                float_literal(n.as_f64().unwrap_or(0.0))
            }
        }
        Value::String(s) => {
            if owned {
                format!("{}.to_string()", rs_string(s))
            } else {
                rs_string(s)
            }
        }
        other => {
            let s = js_string(other);
            if owned {
                format!("{}.to_string()", rs_string(&s))
            } else {
                rs_string(&s)
            }
        }
    }
}

/// JS `String(value)` for scalars (used to match enum values / names).
fn js_string(v: &Value) -> String {
    match v {
        Value::Null => "null".to_string(),
        Value::Bool(b) => b.to_string(),
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        other => other.to_string(),
    }
}

/// JS `Number(value)` rendered — integers print bare, non-numeric → "NaN".
fn js_number(v: &Value) -> String {
    match v {
        Value::Number(n) => n.to_string(),
        Value::String(s) => match s.trim().parse::<f64>() {
            Ok(f) if f.fract() == 0.0 => (f as i64).to_string(),
            Ok(f) => f.to_string(),
            Err(_) => "NaN".to_string(),
        },
        Value::Bool(b) => if *b { "1" } else { "0" }.to_string(),
        Value::Null => "0".to_string(),
        _ => "NaN".to_string(),
    }
}
