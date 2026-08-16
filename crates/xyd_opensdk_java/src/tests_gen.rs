//! example-java.ts `generateJavaTests`: the generated SDK's OWN dependency-free
//! assertion test suite — one `<Service>Test` per top-level resource (covering
//! the whole subtree). Each method is called with shared-planner example values
//! (a "with all params" variant when it has optionals); a required string path
//! param gets an empty-arg guard. Pure: IR in, GenFile[] out.

use serde_json::Value;

use crate::example::render_java_example;
use crate::example_plan::{arr, plan_method_example, MethodExample};
use crate::ir::{str_field, Types};
use crate::javatype::is_const_field;
use crate::javawriter::java_file;
use crate::jsrt::{
    camel_case, java_method_name, json_str, pascal_case, resource_qualifier, service_type_name,
};
use crate::model::GenFile;
use crate::project::JavaCtx;

const MOCK_BASE_URL: &str = "http://localhost:4010";

/// One rendered test: the private-method name (called from main) + its full body.
struct TestMethod {
    name: String,
    body: String,
}

/// The SDK's own test suite: one `<Service>Test` class per top-level resource.
pub fn generate_java_tests(spec: &Value, ctx: &JavaCtx) -> Vec<GenFile> {
    let mut files = Vec::new();
    for resource in arr(spec, "resources") {
        if let Some(file) = resource_test_file(resource, ctx) {
            files.push(file);
        }
    }
    files
}

fn resource_test_file(top: &Value, ctx: &JavaCtx) -> Option<GenFile> {
    let top_name = str_field(top, "name").unwrap_or("").to_string();
    let service = service_type_name(std::slice::from_ref(&top_name));
    let class_name = format!("{service}Test");
    let mut calls: Vec<String> = Vec::new();
    let mut methods: Vec<TestMethod> = Vec::new();
    let mut needs_require_contains = false;

    walk(
        top,
        &[top_name],
        ctx,
        &mut calls,
        &mut methods,
        &mut needs_require_contains,
    );
    if methods.is_empty() {
        return None;
    }

    let helper = if needs_require_contains {
        "\n\n  private static void requireContains(String actual, String needle) {\n    if (actual == null || !actual.contains(needle)) {\n      throw new AssertionError(\"missing substring [\" + needle + \"] in: \" + actual);\n    }\n  }".to_string()
    } else {
        String::new()
    };

    let body = format!(
        "/**\n * A dependency-free assertion test for {service} — run with plain `java {class_name}`.\n */\npublic final class {class_name} {{\n  private static final String BASE_URL =\n      System.getenv().getOrDefault(\"TEST_API_BASE_URL\", {mock});\n\n  public static void main(String[] args) {{\n    Client client = Client.builder().baseUrl(BASE_URL).apiKey(\"My API Key\").build();\n{calls}\n    System.out.println({ok});\n  }}\n\n{method_bodies}{helper}\n}}",
        mock = json_str(MOCK_BASE_URL),
        calls = calls.join("\n"),
        ok = json_str(&format!("{class_name} OK")),
        method_bodies = methods
            .iter()
            .map(|m| m.body.clone())
            .collect::<Vec<_>>()
            .join("\n\n"),
    );

    Some(GenFile {
        path: format!("{}{}.java", ctx.src_dir, class_name),
        content: java_file(&ctx.full_package, &[], &body),
    })
}

fn walk(
    resource: &Value,
    segments: &[String],
    ctx: &JavaCtx,
    calls: &mut Vec<String>,
    methods: &mut Vec<TestMethod>,
    needs_require_contains: &mut bool,
) {
    for method in arr(resource, "methods") {
        for t in render_method_tests(segments, method, ctx) {
            calls.push(format!("    {}(client);", t.name));
            if t.name.ends_with("PathParams") {
                *needs_require_contains = true;
            }
            methods.push(t);
        }
    }
    for sub in arr(resource, "resources") {
        let mut seg = segments.to_vec();
        seg.push(str_field(sub, "name").unwrap_or("").to_string());
        walk(sub, &seg, ctx, calls, methods, needs_require_contains);
    }
}

/// The main test (with-all-params when the method has optionals) plus an optional
/// empty-path-param guard.
fn render_method_tests(segments: &[String], method: &Value, ctx: &JavaCtx) -> Vec<TestMethod> {
    let qualifier = resource_qualifier(segments);
    let method_name = java_method_name(str_field(method, "action").unwrap_or(""));
    let pascal_method = pascal_case(&method_name);
    let chain = client_chain(segments);
    let const_names = const_body_field_names(method, &ctx.types);

    let required = plan_method_example(method, &ctx.types, false, false);
    let with_optional = required.has_optional;
    let example = if with_optional {
        plan_method_example(method, &ctx.types, true, false)
    } else {
        plan_method_example(method, &ctx.types, false, false)
    };

    let mut out: Vec<TestMethod> = Vec::new();

    let path_args: Vec<String> = example
        .path_args
        .iter()
        .map(|pa| render_java_example(&pa.value, &ctx.types))
        .collect();
    let params = if method_has_params(method, &ctx.types) {
        Some(render_params_builder(
            segments,
            &pascal_method,
            &example,
            &const_names,
            &ctx.types,
        ))
    } else {
        None
    };
    let test_name = format!(
        "test{qualifier}{pascal_method}{}",
        if with_optional {
            "WithOptionalParams"
        } else {
            ""
        }
    );
    out.push(TestMethod {
        name: test_name.clone(),
        body: render_main_test(
            &test_name,
            &call_expr(&chain, &method_name, &path_args, params.as_deref()),
        ),
    });

    let guard_idx = arr(method, "pathParams").iter().position(|p| {
        let t = p.get("type");
        t.and_then(|t| t.get("kind")).and_then(Value::as_str) == Some("scalar")
            && t.and_then(|t| t.get("scalar")).and_then(Value::as_str) == Some("string")
            && p.get("required").and_then(Value::as_bool) != Some(false)
    });
    if let Some(idx) = guard_idx {
        let guard_args: Vec<String> = required
            .path_args
            .iter()
            .enumerate()
            .map(|(i, pa)| {
                if i == idx {
                    "\"\"".to_string()
                } else {
                    render_java_example(&pa.value, &ctx.types)
                }
            })
            .collect();
        let guard_params = if method_has_params(method, &ctx.types) {
            Some(render_params_builder(
                segments,
                &pascal_method,
                &required,
                &const_names,
                &ctx.types,
            ))
        } else {
            None
        };
        let guard_name = format!("test{qualifier}{pascal_method}PathParams");
        out.push(TestMethod {
            name: guard_name.clone(),
            body: render_guard_test(
                &guard_name,
                &method_name,
                &call_expr(&chain, &method_name, &guard_args, guard_params.as_deref()),
            ),
        });
    }
    out
}

/// A method-call expression `client.pets().list(<args>)`.
fn call_expr(chain: &str, method_name: &str, path_args: &[String], params: Option<&str>) -> String {
    let mut args: Vec<String> = path_args.to_vec();
    if let Some(p) = params {
        args.push(p.to_string());
    }
    format!("{chain}.{method_name}({})", args.join(", "))
}

/// The `<Params>.builder().<setter>(...)....build()` expression.
fn render_params_builder(
    segments: &[String],
    pascal_method: &str,
    example: &MethodExample,
    const_names: &[String],
    types: &Types,
) -> String {
    let cls = format!("{}{pascal_method}Params", resource_qualifier(segments));
    let fields: Vec<&_> = example
        .fields
        .iter()
        .filter(|f| !const_names.contains(&f.name))
        .collect();
    if fields.is_empty() {
        return format!("{cls}.builder().build()");
    }
    let setters: String = fields
        .iter()
        .map(|f| {
            format!(
                "          .{}({})",
                camel_case(&f.name),
                render_java_example(&f.value, types)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    format!("{cls}.builder()\n{setters}\n          .build()")
}

/// A standard method test: call the method; an offline transport error is fine.
fn render_main_test(name: &str, call: &str) -> String {
    format!(
        "  private static void {name}(Client client) {{\n    try {{\n      {call};\n    }} catch (ApiException expected) {{\n      // Offline: no mock server answering — a transport/HTTP error is acceptable here.\n    }}\n  }}"
    )
}

/// A guard test: the empty string for a required path param must be rejected.
fn render_guard_test(name: &str, method_name: &str, call: &str) -> String {
    format!(
        "  private static void {name}(Client client) {{\n    try {{\n      {call};\n      throw new AssertionError({});\n    }} catch (IllegalArgumentException expected) {{\n      requireContains(expected.getMessage(), \"missing required\");\n    }}\n  }}",
        json_str(&format!(
            "expected a missing required path param error for {method_name}"
        ))
    )
}

/// The `client.<accessor>()...` receiver chain — the generated client accessors.
fn client_chain(segments: &[String]) -> String {
    format!(
        "client.{}",
        segments
            .iter()
            .map(|s| format!("{}()", camel_case(s)))
            .collect::<Vec<_>>()
            .join(".")
    )
}

/// Whether the method carries a params class (mirrors service.ts planParams).
fn method_has_params(method: &Value, types: &Types) -> bool {
    !request_body_fields(method, types).is_empty()
        || !arr(method, "queryParams").is_empty()
        || !arr(method, "headerParams").is_empty()
}

fn request_body_fields<'a>(method: &'a Value, types: &'a Types) -> Vec<&'a Value> {
    let ref_ = method.get("requestBody").and_then(|rb| rb.get("type"));
    if let Some(r) = ref_ {
        if r.get("kind").and_then(Value::as_str) == Some("ref") {
            if let Some(name) = r.get("name").and_then(Value::as_str) {
                if let Some(named) = types.get(name) {
                    if let Some(fields) = named.get("fields").and_then(Value::as_array) {
                        return fields.iter().collect();
                    }
                }
            }
        }
    }
    Vec::new()
}

/// The const-valued body field names (auto-filled, never a builder input).
fn const_body_field_names(method: &Value, types: &Types) -> Vec<String> {
    request_body_fields(method, types)
        .into_iter()
        .filter(|f| is_const_field(f))
        .map(|f| str_field(f, "name").unwrap_or("").to_string())
        .collect()
}
