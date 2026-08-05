//! Port of `example-py.ts` `renderPyExample`: render the framework's language
//! -neutral `ExampleValue` tree into a Python literal for the generated test
//! suite. The planner decides WHAT a realistic example is; this only decides how
//! Python spells it, so the Go/Python/Ruby suites exercise byte-identical shapes.

use serde_json::Value;

use crate::example_plan::ExampleValue;
use crate::val::pystr;

/// Render one `ExampleValue` as a Python literal expression.
pub fn render_py_example(value: &ExampleValue) -> String {
    match value {
        ExampleValue::Str(s) => pystr(s),
        ExampleValue::Integer(n) => n.to_string(),
        ExampleValue::Number(f) => js_number(*f),
        ExampleValue::Boolean(b) => bool_lit(*b),
        ExampleValue::Binary => "b\"Example data\"".to_string(),
        ExampleValue::Enum(v) | ExampleValue::Const(v) => py_literal(v),
        ExampleValue::Array(item) => format!("[{}]", render_py_example(item)),
        ExampleValue::Map(v) => format!("{{\"key\": {}}}", render_py_example(v)),
        ExampleValue::Object(fields) => {
            if fields.is_empty() {
                "{}".to_string()
            } else {
                let parts: Vec<String> = fields
                    .iter()
                    .map(|f| format!("{}: {}", pystr(&f.name), render_py_example(&f.value)))
                    .collect();
                format!("{{{}}}", parts.join(", "))
            }
        }
        ExampleValue::Union(variant) => render_py_example(variant),
        ExampleValue::Any => "None".to_string(),
    }
}

fn bool_lit(b: bool) -> String {
    if b { "True" } else { "False" }.to_string()
}

/// JS `String(number)` for the float case: integral floats drop the fraction.
fn js_number(f: f64) -> String {
    if f.fract() == 0.0 {
        format!("{}", f as i64)
    } else {
        format!("{f}")
    }
}

/// A JSON scalar (enum/const wire value) as a Python literal (mirrors `pyLiteral`).
fn py_literal(v: &Value) -> String {
    match v {
        Value::Null => "None".to_string(),
        Value::Bool(b) => bool_lit(*b),
        Value::Number(n) => n.to_string(),
        Value::String(s) => pystr(s),
        other => pystr(&other.to_string()),
    }
}
