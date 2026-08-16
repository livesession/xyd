//! Port of `example-rb.ts` `renderRbExample`: render the framework's language
//! -neutral `ExampleValue` tree into a Ruby literal for the generated test
//! suite. The planner decides WHAT a realistic example is; this only decides how
//! Ruby spells it, so the Go/Python/Ruby suites exercise byte-identical shapes.

use serde_json::Value;

use crate::example_plan::ExampleValue;
use crate::writer::rb_string;

/// Render one `ExampleValue` as a Ruby literal expression.
pub fn render_rb_example(value: &ExampleValue) -> String {
    match value {
        ExampleValue::Str(s) => rb_string(s),
        ExampleValue::Integer(n) => n.to_string(),
        ExampleValue::Number(f) => js_number(*f),
        ExampleValue::Boolean(b) => bool_lit(*b),
        ExampleValue::Null => "nil".to_string(),
        ExampleValue::Binary => "StringIO.new(\"Example data\")".to_string(),
        ExampleValue::Enum(v) | ExampleValue::Const(v) => rb_literal(v),
        ExampleValue::Array(item) => format!("[{}]", render_rb_example(item)),
        ExampleValue::Map(v) => format!("{{ \"key\" => {} }}", render_rb_example(v)),
        ExampleValue::Object(fields) => {
            if fields.is_empty() {
                "{}".to_string()
            } else {
                let parts: Vec<String> = fields
                    .iter()
                    .map(|f| format!("{} => {}", rb_string(&f.name), render_rb_example(&f.value)))
                    .collect();
                format!("{{ {} }}", parts.join(", "))
            }
        }
        ExampleValue::Union(variant) => render_rb_example(variant),
        ExampleValue::Any => "nil".to_string(),
    }
}

fn bool_lit(b: bool) -> String {
    if b { "true" } else { "false" }.to_string()
}

/// A JS `String(number)` for the float case: integral floats drop the fraction.
fn js_number(f: f64) -> String {
    if f.fract() == 0.0 {
        format!("{}", f as i64)
    } else {
        format!("{f}")
    }
}

/// A JSON scalar (enum/const wire value) as a Ruby literal (mirrors `rbLiteral`).
fn rb_literal(v: &Value) -> String {
    match v {
        Value::Null => "nil".to_string(),
        Value::Bool(b) => bool_lit(*b),
        Value::Number(n) => n.to_string(),
        Value::String(s) => rb_string(s),
        other => rb_string(&other.to_string()),
    }
}
