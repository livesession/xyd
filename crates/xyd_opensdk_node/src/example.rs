//! Port of `example-node.ts` `renderNodeExample`: renders the framework's
//! language-neutral `ExampleValue` tree into a TypeScript literal for the
//! generated test suite. The planner decides WHAT an example is; this only
//! decides how TypeScript spells it.

use serde_json::Value;

use crate::example_plan::ExampleValue;
use crate::jsrt::{json_string, prop_key};

/// A JS number rendered the way `String(number)` would (integral floats lose the
/// trailing `.0`; the test planner only ever yields `0`).
fn js_number(f: f64) -> String {
    if f.fract() == 0.0 && f.is_finite() && f.abs() < 1e15 {
        (f as i64).to_string()
    } else {
        f.to_string()
    }
}

/// Render one `ExampleValue` as a TypeScript literal expression.
pub fn render_node_example(value: &ExampleValue) -> String {
    match value {
        ExampleValue::Str(s) => json_string(s),
        ExampleValue::Integer(i) => i.to_string(),
        ExampleValue::Number(n) => js_number(*n),
        ExampleValue::Boolean(b) => if *b { "true" } else { "false" }.to_string(),
        ExampleValue::Binary => "new Uint8Array([1, 2, 3])".to_string(),
        ExampleValue::Enum(v) => ts_literal(v),
        ExampleValue::Const(v) => ts_literal(v),
        ExampleValue::Array(item) => format!("[{}]", render_node_example(item)),
        ExampleValue::Map(v) => format!("{{ key: {} }}", render_node_example(v)),
        ExampleValue::Object(fields) => {
            // A depth-capped / cycle-guarded struct yields no fields; a bare `{}`
            // fails to type-check against a variant requiring properties, so cast
            // it opaque.
            if fields.is_empty() {
                "{} as any".to_string()
            } else {
                let entries: Vec<String> = fields
                    .iter()
                    .map(|f| format!("{}: {}", prop_key(&f.name), render_node_example(&f.value)))
                    .collect();
                format!("{{ {} }}", entries.join(", "))
            }
        }
        ExampleValue::Union(variant) => render_node_example(variant),
        // 'any' (incl. the planner's depth-cap bottom): opaque so it satisfies
        // ANY strictly-typed field.
        ExampleValue::Any => "{} as any".to_string(),
    }
}

/// A JSON scalar (enum/const wire value) as a TypeScript literal.
fn ts_literal(v: &Value) -> String {
    match v {
        Value::Null => "null".to_string(),
        Value::Bool(b) => if *b { "true" } else { "false" }.to_string(),
        Value::Number(n) => n.to_string(),
        Value::String(s) => json_string(s),
        // objects/arrays: JSON.stringify(String(v)) stringifies the coercion.
        other => json_string(&other.to_string()),
    }
}
