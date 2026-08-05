//! Port of `tests-rs.ts` `generateTests`: the generated SDK's own `#[tokio::test]`
//! suite — one `tests/<resource>.rs` per top-level resource plus the shared
//! `tests/common/mod.rs`. Each method is called with shared-planner example values
//! (a required-only case + a "with all params" case when it has optionals) and
//! `?`-propagates; a required string path param gets an empty-arg guard. Example
//! VALUES come from the language-neutral planner so the Go/Python/Ruby/Rust suites
//! exercise identical shapes and can never drift.

use serde_json::{Map, Value};

use crate::example::render_rs_example;
use crate::example_plan::{arr, plan_method_example, MethodExample};
use crate::naming::snake_case;
use crate::service::{method_has_params, params_struct_name, resource_class_name};

fn s<'v>(v: &'v Value, k: &str) -> &'v str {
    v.get(k).and_then(Value::as_str).unwrap_or("")
}

/// `tests/common/mod.rs` — the shared Client factory bound to a mock base URL.
pub fn common_mod_rs(crate_: &str) -> String {
    format!(
        "#![allow(dead_code, unused_imports)]\n\n/// A Client bound to a mock base URL (override with TEST_API_BASE_URL).\npub fn build_client() -> {crate_}::Client {{\n    let base_url = std::env::var(\"TEST_API_BASE_URL\").unwrap_or_else(|_| \"http://localhost:4010\".to_string());\n    {crate_}::Client::builder()\n        .api_key(\"My API Key\")\n        .base_url(base_url)\n        .build()\n}}\n"
    )
}

/// One collected method with the resource-name chain from the root to its owner.
struct Collected<'a> {
    method: &'a Value,
    segments: Vec<String>,
}

fn collect_methods<'a>(resource: &'a Value, segments: &[String], out: &mut Vec<Collected<'a>>) {
    for method in arr(resource, "methods") {
        out.push(Collected {
            method,
            segments: segments.to_vec(),
        });
    }
    for sub in arr(resource, "resources") {
        let mut seg = segments.to_vec();
        seg.push(s(sub, "name").to_string());
        collect_methods(sub, &seg, out);
    }
}

/// The first required string path param of a method (drives the guard test), by name.
fn first_string_path_param(method: &Value) -> Option<String> {
    for p in arr(method, "pathParams") {
        let t = p.get("type");
        let is_string = t.and_then(|t| t.get("kind")).and_then(Value::as_str) == Some("scalar")
            && t.and_then(|t| t.get("scalar")).and_then(Value::as_str) == Some("string");
        let not_false = p.get("required").and_then(Value::as_bool) != Some(false);
        if is_string && not_false {
            return Some(s(p, "name").to_string());
        }
    }
    None
}

/// The accessor chain from `client`, e.g. `client.pets().inventory()`.
fn chain_call(segments: &[String]) -> String {
    let calls: Vec<String> = segments
        .iter()
        .map(|seg| format!("{}()", snake_case(seg)))
        .collect();
    format!("client.{}", calls.join("."))
}

/// Test-name qualifier for nested resources (empty for a top-level method).
fn name_prefix(segments: &[String]) -> String {
    segments
        .iter()
        .skip(1)
        .map(|seg| format!("{}_", snake_case(seg)))
        .collect()
}

/// The params-struct literal for one example (or `::default()` when it has no fields).
fn params_literal(name: &str, ex: &MethodExample, types: &Map<String, Value>) -> String {
    if ex.fields.is_empty() {
        return format!("{name}::default()");
    }
    let rows: Vec<String> = ex
        .fields
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

/// Positional path args (borrowed), then the params struct literal when present.
fn call_args(method: &Value, cls: &str, ex: &MethodExample, types: &Map<String, Value>) -> String {
    let mut parts: Vec<String> = ex
        .path_args
        .iter()
        .map(|pa| render_rs_example(&pa.value, types, false))
        .collect();
    if method_has_params(method, types) {
        parts.push(params_literal(
            &params_struct_name(cls, s(method, "action")),
            ex,
            types,
        ));
    }
    parts.join(", ")
}

/// The guard-call args: the target path param forced empty, others as examples.
fn guard_args(
    method: &Value,
    cls: &str,
    ex: &MethodExample,
    target: &str,
    types: &Map<String, Value>,
) -> String {
    let mut parts: Vec<String> = ex
        .path_args
        .iter()
        .map(|pa| {
            if pa.name == target {
                "\"\"".to_string()
            } else {
                render_rs_example(&pa.value, types, false)
            }
        })
        .collect();
    if method_has_params(method, types) {
        parts.push(params_literal(
            &params_struct_name(cls, s(method, "action")),
            ex,
            types,
        ));
    }
    parts.join(", ")
}

/// A `#[tokio::test]` that invokes a method and `?`-propagates any error.
fn method_test(name: &str, call: &str) -> String {
    format!(
        "#[tokio::test]\nasync fn {name}() -> Result<(), Box<dyn std::error::Error>> {{\n    let client = build_client();\n    let _ = {call}.await?;\n    Ok(())\n}}"
    )
}

/// A `#[tokio::test]` asserting an empty required path param is rejected.
fn guard_test(name: &str, call: &str) -> String {
    format!(
        "#[tokio::test]\nasync fn {name}() {{\n    let client = build_client();\n    let error = {call}.await.unwrap_err();\n    assert!(matches!(error, Error::InvalidArgument(_)));\n}}"
    )
}

/// `tests/<resource>.rs` for one top-level resource (walks its whole subtree).
pub fn resource_test_rs(resource: &Value, crate_: &str, types: &Map<String, Value>) -> String {
    let mut collected: Vec<Collected> = Vec::new();
    collect_methods(resource, &[s(resource, "name").to_string()], &mut collected);

    let mut blocks: Vec<String> = Vec::new();
    for c in &collected {
        let cls = resource_class_name(&c.segments);
        let chain = chain_call(&c.segments);
        let action = snake_case(s(c.method, "action"));
        let base = format!("{}{action}", name_prefix(&c.segments));

        let required = plan_method_example(c.method, types, false, false);
        blocks.push(method_test(
            &format!("test_method_{base}"),
            &format!(
                "{chain}.{action}({})",
                call_args(c.method, &cls, &required, types)
            ),
        ));

        if required.has_optional {
            let all = plan_method_example(c.method, types, true, false);
            blocks.push(method_test(
                &format!("test_method_{base}_with_all_params"),
                &format!(
                    "{chain}.{action}({})",
                    call_args(c.method, &cls, &all, types)
                ),
            ));
        }

        if let Some(target) = first_string_path_param(c.method) {
            blocks.push(guard_test(
                &format!("test_path_params_{base}"),
                &format!(
                    "{chain}.{action}({})",
                    guard_args(c.method, &cls, &required, &target, types)
                ),
            ));
        }
    }

    let body = if blocks.is_empty() {
        "// no methods".to_string()
    } else {
        blocks.join("\n\n")
    };
    format!("#![allow(dead_code, unused_imports)]\nmod common;\n\nuse common::build_client;\nuse {crate_}::*;\n\n{body}\n")
}
