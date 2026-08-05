//! Port of `tests-rb.ts` `generateTests`: the generated SDK's own minitest suite
//! — one `test/test_<resource>.rb` per top-level resource plus the shared
//! `test/test_helper.rb`. Each method is called with shared-planner example
//! values (a required-only case, a "with all params" case when it has optionals)
//! and lightly checked; a required string path param gets an empty-arg guard.

use std::collections::HashMap;

use serde_json::Value;

use crate::example::render_rb_example;
use crate::example_plan::{arr, plan_method_example, MethodExample};
use crate::naming::{pascal_case, snake_case};
use crate::plan::plan_operation;
use crate::writer::rb_string;

fn str_field(v: &Value, key: &str) -> String {
    v.get(key).and_then(Value::as_str).unwrap_or("").to_string()
}

/// `test/test_helper.rb` — the shared Client factory bound to a mock base URL.
pub fn test_helper_rb(module_name: &str, pkg: &str) -> String {
    let lines: Vec<String> = vec![
        "require \"minitest/autorun\"".to_string(),
        "require \"stringio\"".to_string(),
        format!("require_relative {}", rb_string(&format!("../lib/{pkg}"))),
        String::new(),
        "# Shared setup for the generated SDK test suite: a Client bound to a mock base"
            .to_string(),
        "# URL (override with TEST_API_BASE_URL). Running the suite against a mock server"
            .to_string(),
        "# is a follow-up; these tests exist to be syntactically and structurally sound."
            .to_string(),
        "module TestHelper".to_string(),
        "  BASE_URL = ENV.fetch(\"TEST_API_BASE_URL\", \"http://localhost:4010\")".to_string(),
        String::new(),
        "  def build_client".to_string(),
        format!("    {module_name}::Client.new(api_key: \"My API Key\", base_url: BASE_URL)"),
        "  end".to_string(),
        "end".to_string(),
    ];
    format!("{}\n", lines.join("\n"))
}

/// One collected method: its client accessor chain + a test-name prefix.
struct Flat<'a> {
    method: &'a Value,
    chain: Vec<String>,
    name_prefix: String,
}

/// Walk the resource subtree, flattening every method with its client chain.
fn collect<'a>(resource: &'a Value, chain: &[String], prefix: &str, out: &mut Vec<Flat<'a>>) {
    for method in arr(resource, "methods") {
        out.push(Flat {
            method,
            chain: chain.to_vec(),
            name_prefix: prefix.to_string(),
        });
    }
    for sub in arr(resource, "resources") {
        let attr = snake_case(&str_field(sub, "name"));
        let mut nested = chain.to_vec();
        nested.push(attr.clone());
        collect(sub, &nested, &format!("{prefix}{attr}_"), out);
    }
}

/// The first required string path param of a method (drives the guard test).
fn first_string_path_param(method: &Value) -> Option<String> {
    for p in arr(method, "pathParams") {
        let t = p.get("type");
        let is_string = t.and_then(|t| t.get("kind")).and_then(Value::as_str) == Some("scalar")
            && t.and_then(|t| t.get("scalar")).and_then(Value::as_str) == Some("string");
        let not_false = p.get("required").and_then(Value::as_bool) != Some(false);
        if is_string && not_false {
            return Some(str_field(p, "name"));
        }
    }
    None
}

/// The minitest assertion for a call result: `String` for a binary download,
/// `<Module>::Page` for a paginated list, a non-nil check for a method with a
/// response, or None (no assertion) for a response-less method.
fn result_assertion(
    method: &Value,
    types: &HashMap<String, Value>,
    module_name: &str,
) -> Option<String> {
    let plan = plan_operation(method, types);
    if plan.binary_content_type.is_some() {
        return Some("assert_instance_of(String, result)".to_string());
    }
    if plan.page_name.is_some() {
        return Some(format!("assert_instance_of({module_name}::Page, result)"));
    }
    if method.get("primaryResponse").is_some() {
        return Some("refute_nil(result)".to_string());
    }
    None
}

/// Positional path args followed by `name: value` keyword args for one example.
fn render_call_args(ex: &MethodExample) -> String {
    let mut parts: Vec<String> = ex
        .path_args
        .iter()
        .map(|pa| render_rb_example(&pa.value))
        .collect();
    for f in &ex.fields {
        parts.push(format!(
            "{}: {}",
            snake_case(&f.name),
            render_rb_example(&f.value)
        ));
    }
    parts.join(", ")
}

/// A `def <name>; result = <call>; <assertion>; end` test method.
fn render_method_test(name: &str, call: &str, assertion: Option<&str>) -> String {
    let mut lines = vec![
        format!("  def {name}"),
        "    client = build_client".to_string(),
    ];
    match assertion {
        Some(a) => {
            lines.push(format!("    result = client.{call}"));
            lines.push(format!("    {a}"));
        }
        None => lines.push(format!("    client.{call}")),
    }
    lines.push("  end".to_string());
    lines.join("\n")
}

/// The empty-path-param guard test: an empty target raises ArgumentError.
fn render_path_params_test(
    name: &str,
    chain: &[String],
    action: &str,
    ex: &MethodExample,
    target: &str,
) -> String {
    let mut parts: Vec<String> = Vec::new();
    for pa in &ex.path_args {
        parts.push(if pa.name == target {
            "\"\"".to_string()
        } else {
            render_rb_example(&pa.value)
        });
    }
    for f in &ex.fields {
        parts.push(format!(
            "{}: {}",
            snake_case(&f.name),
            render_rb_example(&f.value)
        ));
    }
    let mut cc = chain.to_vec();
    cc.push(action.to_string());
    let call = format!("client.{}({})", cc.join("."), parts.join(", "));
    [
        format!("  def {name}"),
        "    client = build_client".to_string(),
        "    assert_raises(ArgumentError) do".to_string(),
        format!("      {call}"),
        "    end".to_string(),
        "  end".to_string(),
    ]
    .join("\n")
}

/// `test/test_<resource>.rb` for one top-level resource (walks its whole subtree).
pub fn resource_test_rb(
    resource: &Value,
    module_name: &str,
    types: &HashMap<String, Value>,
) -> String {
    let root_attr = snake_case(&str_field(resource, "name"));
    let mut collected: Vec<Flat> = Vec::new();
    collect(resource, &[root_attr], "", &mut collected);

    let mut blocks: Vec<String> = Vec::new();
    for f in &collected {
        let action = snake_case(&str_field(f.method, "action"));
        let base = format!("{}{action}", f.name_prefix);
        let mut cc = f.chain.clone();
        cc.push(action.clone());
        let call_chain = cc.join(".");
        let assertion = result_assertion(f.method, types, module_name);

        let required = plan_method_example(f.method, types, false, false);
        let required_args = render_call_args(&required);
        let required_call = if required_args.is_empty() {
            call_chain.clone()
        } else {
            format!("{call_chain}({required_args})")
        };
        blocks.push(render_method_test(
            &format!("test_method_{base}"),
            &required_call,
            assertion.as_deref(),
        ));

        if required.has_optional {
            let all = plan_method_example(f.method, types, true, false);
            let all_args = render_call_args(&all);
            let all_call = if all_args.is_empty() {
                call_chain.clone()
            } else {
                format!("{call_chain}({all_args})")
            };
            blocks.push(render_method_test(
                &format!("test_method_{base}_with_all_params"),
                &all_call,
                assertion.as_deref(),
            ));
        }

        if let Some(target) = first_string_path_param(f.method) {
            blocks.push(render_path_params_test(
                &format!("test_path_params_{base}"),
                &f.chain,
                &action,
                &required,
                &target,
            ));
        }
    }

    let body = if blocks.is_empty() {
        "  # no methods".to_string()
    } else {
        blocks.join("\n\n")
    };
    format!(
        "require_relative \"test_helper\"\n\nclass Test{} < Minitest::Test\n  include TestHelper\n\n{body}\nend\n",
        pascal_case(&str_field(resource, "name"))
    )
}
