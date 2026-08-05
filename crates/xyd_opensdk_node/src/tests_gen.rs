//! The generated SDK's OWN test suite (`generateTests`): `tsconfig.test.json`,
//! the ambient `tests/_shims.d.ts`, the shared `tests/setup.ts`, and one
//! `tests/<resource>.test.ts` per top-level resource. Ports `tests-node.ts`
//! (the `generateTests` slice; the doc `generateUsage` view is out of fork
//! scope). The two fixed files are `include_str!` templates; the per-resource
//! suite is generated from the shared example planner.

use serde_json::json;

use crate::example::render_node_example;
use crate::example_plan::{plan_method_example, MethodExample};
use crate::ir::{Method, Resource};
use crate::jsrt::{camel_case, json_string, node_method_name, slug};
use crate::plan::{plan_operation, OperationPlan, PrimaryResponseKind};
use crate::project::pretty;
use crate::resource::{params_required, NodeCtx};

const SHIMS_TEMPLATE: &str = include_str!("tests_shims.d.ts.txt");
const SETUP_TEMPLATE: &str = include_str!("tests_setup.ts.txt");

/// `tsconfig.test.json` — type-check `src` + the generated tests in one pass
/// (keeps `tsc` build src-only).
pub fn test_tsconfig() -> String {
    let config = json!({
        "extends": "./tsconfig.json",
        "compilerOptions": { "noEmit": true },
        "include": ["src", "tests"]
    });
    format!("{}\n", pretty(&config))
}

/// `tests/_shims.d.ts` — minimal ambient decls for the stdlib test modules.
pub fn ts_node_shims() -> String {
    SHIMS_TEMPLATE.to_string()
}

/// `tests/setup.ts` — the shared client (pointed at the mock base URL) + a server
/// probe + a structural check.
pub fn test_setup_file(client_name: &str, default_export: bool) -> String {
    let import_line = if default_export {
        "import Client from '../src/index';".to_string()
    } else {
        format!("import {{ {client_name} as Client }} from '../src/index';")
    };
    SETUP_TEMPLATE.replace("__XYD_IMPORT_LINE__", &import_line)
}

/// One collected method: its client accessor chain + a test-name prefix.
struct FlatMethod<'a> {
    method: &'a Method,
    /// Attribute chain from `client`, e.g. ["videos", "characters"].
    chain: Vec<String>,
    /// Test-name qualifier for nested resources (empty for a top-level method).
    name_prefix: String,
}

/// Walk the resource subtree, flattening every method with its client chain.
fn collect_methods<'a>(
    resource: &'a Resource,
    chain: &[String],
    name_prefix: &str,
    out: &mut Vec<FlatMethod<'a>>,
) {
    for method in &resource.methods {
        out.push(FlatMethod {
            method,
            chain: chain.to_vec(),
            name_prefix: name_prefix.to_string(),
        });
    }
    for sub in &resource.resources {
        let attr = camel_case(&sub.name);
        let mut nested = chain.to_vec();
        nested.push(attr.clone());
        collect_methods(sub, &nested, &format!("{name_prefix}{attr}."), out);
    }
}

/// The first required string path param of a method (drives the guard test).
fn first_string_path_param(method: &Method) -> Option<&str> {
    method.path_params.iter().find_map(|p| {
        let is_string = p.ty.kind() == "scalar" && p.ty.scalar.as_deref() == Some("string");
        if is_string && p.required != Some(false) {
            Some(p.name.as_str())
        } else {
            None
        }
    })
}

/// Whether the method has a response worth asserting (binary, page, or a primary type).
fn has_response(op: &OperationPlan) -> bool {
    op.binary_content_type.is_some()
        || op.page_name.is_some()
        || op.primary_response != PrimaryResponseKind::None
}

/// The params object literal for an example's fields, or `{}` when a required
/// arg has no fields, or None when the arg is optional and empty.
fn params_object(ex: &MethodExample, required_arg: bool) -> Option<String> {
    if !ex.fields.is_empty() {
        let entries: Vec<String> = ex
            .fields
            .iter()
            .map(|f| {
                format!(
                    "{}: {}",
                    crate::jsrt::prop_key(&f.name),
                    render_node_example(&f.value)
                )
            })
            .collect();
        Some(format!("{{ {} }}", entries.join(", ")))
    } else if required_arg {
        Some("{}".to_string())
    } else {
        None
    }
}

/// Positional path args followed by a single params object literal for one example.
fn render_call_args(ex: &MethodExample, required_arg: bool) -> String {
    let mut parts: Vec<String> = ex
        .path_args
        .iter()
        .map(|pa| render_node_example(&pa.value))
        .collect();
    if let Some(params) = params_object(ex, required_arg) {
        parts.push(params);
    }
    parts.join(", ")
}

/// The same call args but with the guarded path param replaced by an empty string.
fn render_guard_args(ex: &MethodExample, target: &str, required_arg: bool) -> String {
    let mut parts: Vec<String> = ex
        .path_args
        .iter()
        .map(|pa| {
            if pa.param_name == target {
                "\"\"".to_string()
            } else {
                render_node_example(&pa.value)
            }
        })
        .collect();
    if let Some(params) = params_object(ex, required_arg) {
        parts.push(params);
    }
    parts.join(", ")
}

/// A `test("...", async (t) => { ... })` block invoking one method against the
/// mock (skips when it is down).
fn render_method_test(name: &str, call: &str, assertable: bool) -> String {
    let mut lines = vec![
        format!("test({}, async (t) => {{", json_string(name)),
        "  if (!(await checkTestServer())) return t.skip();".to_string(),
        "  const client = testClient();".to_string(),
    ];
    if assertable {
        lines.push(format!("  const result = await {call};"));
        lines.push("  assertMatchesType(result);".to_string());
    } else {
        lines.push(format!("  await {call};"));
    }
    lines.push("});".to_string());
    lines.join("\n")
}

/// The empty-path-param guard test: an empty target throws the guard message
/// synchronously (the resource method guards its path params before returning
/// the request promise), so the test asserts with `assert.throws`.
fn render_path_params_test(
    name: &str,
    call_chain: &str,
    ex: &MethodExample,
    target: &str,
    required_arg: bool,
) -> String {
    [
        format!("test({}, () => {{", json_string(name)),
        "  const client = testClient();".to_string(),
        format!(
            "  assert.throws(() => {call_chain}({}), /missing required {target} parameter/);",
            render_guard_args(ex, target, required_arg)
        ),
        "});".to_string(),
    ]
    .join("\n")
}

/// `tests/<resource>.test.ts` for one top-level resource (walks its whole subtree).
pub fn render_resource_test_file(resource: &Resource, ctx: &NodeCtx) -> String {
    let mut collected: Vec<FlatMethod> = Vec::new();
    collect_methods(resource, &[camel_case(&resource.name)], "", &mut collected);

    let mut blocks: Vec<String> = Vec::new();
    let mut uses_assert = false;
    for FlatMethod {
        method,
        chain,
        name_prefix,
    } in &collected
    {
        let action = node_method_name(&method.action);
        let label = format!("{name_prefix}{action}");
        let mut call_segments = chain.clone();
        call_segments.push(action.clone());
        let call_chain = format!("client.{}", call_segments.join("."));

        let op = plan_operation(method, &ctx.types);
        let assertable = has_response(&op);
        let required_arg = params_required(
            op.has_body,
            op.body_required,
            &method.query_params,
            &method.header_params,
        );

        let required = plan_method_example(method, &ctx.types, false);
        blocks.push(render_method_test(
            &format!("{label} (method)"),
            &format!(
                "{call_chain}({})",
                render_call_args(&required, required_arg)
            ),
            assertable,
        ));

        if required.has_optional {
            let all = plan_method_example(method, &ctx.types, true);
            blocks.push(render_method_test(
                &format!("{label} (method, all params)"),
                &format!("{call_chain}({})", render_call_args(&all, required_arg)),
                assertable,
            ));
        }

        if let Some(target) = first_string_path_param(method) {
            uses_assert = true;
            blocks.push(render_path_params_test(
                &format!("{label} (path params)"),
                &call_chain,
                &required,
                target,
                required_arg,
            ));
        }
    }

    let mut import_lines = vec!["import { test } from 'node:test';".to_string()];
    if uses_assert {
        import_lines.push("import assert from 'node:assert';".to_string());
    }
    import_lines.push(String::new());
    import_lines.push(
        "import { assertMatchesType, checkTestServer, testClient } from './setup';".to_string(),
    );
    let imports = import_lines.join("\n");
    let body = if blocks.is_empty() {
        "test(\"noop\", () => {});".to_string()
    } else {
        blocks.join("\n\n")
    };
    format!("{imports}\n\n{body}\n")
}

/// The full `generateTests` file set (path, content) — the scaffold plus one
/// suite per top-level resource. Empty when the spec declares no resources.
pub fn test_files(
    resources: &[Resource],
    ctx: &NodeCtx,
    client_name: &str,
    default_export: bool,
) -> Vec<(String, String)> {
    if resources.is_empty() {
        return Vec::new();
    }
    let mut files = vec![
        ("tsconfig.test.json".to_string(), test_tsconfig()),
        ("tests/_shims.d.ts".to_string(), ts_node_shims()),
        (
            "tests/setup.ts".to_string(),
            test_setup_file(client_name, default_export),
        ),
    ];
    for r in resources {
        files.push((
            format!("tests/{}.test.ts", slug(&r.name)),
            render_resource_test_file(r, ctx),
        ));
    }
    files
}
