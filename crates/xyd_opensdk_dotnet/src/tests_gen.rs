//! Port of `tests-cs.ts` `renderTestFiles` (`dotnetEmitter.generateTests`): the
//! SDK's OWN dependency-free test suite — one `<Resource>Tests.cs` per top-level
//! resource with a `[Fact]` per method (required-only, a `WithAllParams` variant
//! when the method has optionals, and an empty-path-param guard), plus the
//! vendored `[Fact]` framework + mock-server probe + Program entry point. Example
//! VALUES come from the shared neutral planner (`example_plan`) rendered as TYPED
//! C# by `example_cs`, so the Go/Ruby/.NET suites exercise identical shapes.

use std::collections::HashSet;

use serde_json::Value;

use crate::cstype::Types;
use crate::cswriter::{indent, CSPROJ_HEADER, CS_HEADER};
use crate::example_cs::render_ref_value;
use crate::example_plan::{method_has_optional, plan_example, PlanOpts};
use crate::jsrt::{method_name, pascal_case};
use crate::plan::plan_operation;

const PROGRAM_TEMPLATE: &str = include_str!("program.cs.txt");
const FRAMEWORK_TEMPLATE: &str = include_str!("framework.cs.txt");
const TESTSERVER_TEMPLATE: &str = include_str!("testserver.cs.txt");

pub struct DotnetTestsCtx<'a> {
    pub sdk: &'a str,
    pub namespace: &'a str,
    pub target_framework: &'a str,
    pub types: Types<'a>,
}

fn str_field(v: &Value, key: &str) -> String {
    v.get(key).and_then(Value::as_str).unwrap_or("").to_string()
}

fn arr<'a>(v: &'a Value, key: &str) -> &'a [Value] {
    v.get(key)
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

/// All generated test-project files: the csproj, the vendored framework, one
/// class per top-level resource (each covering its whole subtree).
pub fn render_test_files(resources: &[Value], ctx: &DotnetTestsCtx) -> Vec<(String, String)> {
    let dir = format!("{}.Tests", ctx.sdk);
    let test_namespace = format!("{}.Tests", ctx.namespace);
    let mut files: Vec<(String, String)> = vec![
        (format!("{dir}/{}.Tests.csproj", ctx.sdk), test_csproj(ctx)),
        (
            format!("{dir}/Program.cs"),
            PROGRAM_TEMPLATE.replace("__XYD_NAMESPACE__", &test_namespace),
        ),
        (
            format!("{dir}/TestFramework.cs"),
            FRAMEWORK_TEMPLATE.replace("__XYD_NAMESPACE__", &test_namespace),
        ),
        (
            format!("{dir}/TestServer.cs"),
            TESTSERVER_TEMPLATE.replace("__XYD_NAMESPACE__", &test_namespace),
        ),
    ];
    for resource in resources {
        files.push((
            format!(
                "{dir}/{}Tests.cs",
                pascal_case(&str_field(resource, "name"))
            ),
            resource_test(resource, ctx, &test_namespace),
        ));
    }
    files
}

/// The test project: an Exe that project-references the SDK; no PackageReference.
fn test_csproj(ctx: &DotnetTestsCtx) -> String {
    let lines = [
        CSPROJ_HEADER.to_string(),
        "<Project Sdk=\"Microsoft.NET.Sdk\">".to_string(),
        String::new(),
        "  <PropertyGroup>".to_string(),
        format!(
            "    <TargetFramework>{}</TargetFramework>",
            ctx.target_framework
        ),
        "    <LangVersion>latest</LangVersion>".to_string(),
        "    <Nullable>enable</Nullable>".to_string(),
        "    <ImplicitUsings>disable</ImplicitUsings>".to_string(),
        "    <OutputType>Exe</OutputType>".to_string(),
        format!("    <RootNamespace>{}.Tests</RootNamespace>", ctx.namespace),
        format!("    <AssemblyName>{}.Tests</AssemblyName>", ctx.sdk),
        "    <GenerateDocumentationFile>false</GenerateDocumentationFile>".to_string(),
        "  </PropertyGroup>".to_string(),
        String::new(),
        "  <ItemGroup>".to_string(),
        format!("    <ProjectReference Include=\"../{}.csproj\" />", ctx.sdk),
        "  </ItemGroup>".to_string(),
        String::new(),
        "</Project>".to_string(),
    ];
    format!("{}\n", lines.join("\n"))
}

/// One collected method with its PascalCase accessor chain + name qualifier.
struct Flat<'a> {
    method: &'a Value,
    chain: Vec<String>,
    name_prefix: String,
}

fn collect_methods<'a>(
    resource: &'a Value,
    chain: &[String],
    name_prefix: &str,
    out: &mut Vec<Flat<'a>>,
) {
    for method in arr(resource, "methods") {
        out.push(Flat {
            method,
            chain: chain.to_vec(),
            name_prefix: name_prefix.to_string(),
        });
    }
    for sub in arr(resource, "resources") {
        let seg = pascal_case(&str_field(sub, "name"));
        let mut nested = chain.to_vec();
        nested.push(seg.clone());
        collect_methods(sub, &nested, &format!("{name_prefix}{seg}"), out);
    }
}

/// The index of the first required string path param (drives the guard test).
fn first_string_path_param(method: &Value) -> Option<usize> {
    arr(method, "pathParams").iter().position(|p| {
        let t = p.get("type");
        t.and_then(|t| t.get("kind")).and_then(Value::as_str) == Some("scalar")
            && t.and_then(|t| t.get("scalar")).and_then(Value::as_str) == Some("string")
            && p.get("required").and_then(Value::as_bool) != Some(false)
    })
}

/// Whether the method returns a value (drives `var result = await` vs bare `await`).
fn method_has_result(method: &Value, types: Types) -> bool {
    let op = plan_operation(method, types);
    op.binary_content_type.is_some()
        || op.page_name.is_some()
        || (method
            .get("primaryResponse")
            .map(|v| !v.is_null())
            .unwrap_or(false)
            && op.primary_response != "none")
}

/// The ordered call arguments (positional, signature order): path args, then the
/// request body, then query ∪ header — required only, or required+optional when
/// `with_optional`. `target_path` (a path-param index) renders as `""`.
fn call_args(
    method: &Value,
    types: Types,
    with_optional: bool,
    target_path: Option<usize>,
) -> String {
    let mut required: Vec<String> = Vec::new();
    let mut optional: Vec<String> = Vec::new();

    for (i, p) in arr(method, "pathParams").iter().enumerate() {
        if target_path == Some(i) {
            required.push("\"\"".to_string());
        } else {
            let opts = PlanOpts {
                with_optional: false,
                string_hint: Some(str_field(p, "name")),
            };
            let value = plan_example(p.get("type"), types, &opts, &HashSet::new(), 0);
            required.push(render_ref_value(p.get("type"), &value, types));
        }
    }

    let body_ref = method.get("requestBody").and_then(|b| b.get("type"));
    if let Some(br) = body_ref {
        let opts = PlanOpts {
            with_optional,
            string_hint: None,
        };
        let value = plan_example(Some(br), types, &opts, &HashSet::new(), 0);
        let expr = render_ref_value(Some(br), &value, types);
        if method
            .get("requestBody")
            .and_then(|b| b.get("required"))
            .and_then(Value::as_bool)
            == Some(true)
        {
            required.push(expr);
        } else {
            optional.push(expr);
        }
    }

    for p in arr(method, "queryParams")
        .iter()
        .chain(arr(method, "headerParams"))
    {
        let opts = PlanOpts {
            with_optional,
            string_hint: Some(str_field(p, "name")),
        };
        let value = plan_example(p.get("type"), types, &opts, &HashSet::new(), 0);
        let expr = render_ref_value(p.get("type"), &value, types);
        if p.get("required").and_then(Value::as_bool).unwrap_or(false) {
            required.push(expr);
        } else {
            optional.push(expr);
        }
    }

    let slots: Vec<String> = if with_optional {
        required.into_iter().chain(optional).collect()
    } else {
        required
    };
    slots.join(", ")
}

fn method_test(test_name: &str, call_expr: &str, has_result: bool, sdk: &str) -> String {
    let mut lines = vec![
        "[Fact]".to_string(),
        format!("public async Task {test_name}()"),
        "{".to_string(),
        "    string baseUrl = TestServer.BaseUrl();".to_string(),
        "    if (!TestServer.Check(baseUrl))".to_string(),
        "    {".to_string(),
        "        return;".to_string(),
        "    }".to_string(),
        format!("    var client = new {sdk}Client(apiKey: \"My API Key\", baseUrl: baseUrl);"),
    ];
    if has_result {
        lines.push(format!("    var result = await {call_expr};"));
        lines.push("    Assert.NotNull(result);".to_string());
    } else {
        lines.push(format!("    await {call_expr};"));
    }
    lines.push("}".to_string());
    lines.join("\n")
}

fn guard_test(test_name: &str, call_expr: &str, sdk: &str) -> String {
    [
        "[Fact]".to_string(),
        format!("public async Task {test_name}()"),
        "{".to_string(),
        format!("    var client = new {sdk}Client(apiKey: \"My API Key\", baseUrl: \"http://localhost:4010\");"),
        format!("    await Assert.ThrowsAsync<ArgumentException>(async () => await {call_expr});"),
        "}".to_string(),
    ]
    .join("\n")
}

/// One `<Resource>Tests.cs` covering the resource's whole subtree.
fn resource_test(resource: &Value, ctx: &DotnetTestsCtx, test_namespace: &str) -> String {
    let root = pascal_case(&str_field(resource, "name"));
    let mut collected: Vec<Flat> = Vec::new();
    collect_methods(resource, std::slice::from_ref(&root), "", &mut collected);

    let mut blocks: Vec<String> = Vec::new();
    for f in &collected {
        let name = method_name(&str_field(f.method, "action"));
        let base = format!("{}{name}", f.name_prefix);
        let chain_expr = format!("client.{}.{name}", f.chain.join("."));
        let has_result = method_has_result(f.method, ctx.types);

        blocks.push(method_test(
            &format!("Method{base}"),
            &format!(
                "{chain_expr}({})",
                call_args(f.method, ctx.types, false, None)
            ),
            has_result,
            ctx.sdk,
        ));

        if method_has_optional(f.method, ctx.types) {
            blocks.push(method_test(
                &format!("Method{base}WithAllParams"),
                &format!(
                    "{chain_expr}({})",
                    call_args(f.method, ctx.types, true, None)
                ),
                has_result,
                ctx.sdk,
            ));
        }

        if let Some(target) = first_string_path_param(f.method) {
            blocks.push(guard_test(
                &format!("PathParams{base}"),
                &format!(
                    "{chain_expr}({})",
                    call_args(f.method, ctx.types, false, Some(target))
                ),
                ctx.sdk,
            ));
        }
    }

    let body = if blocks.is_empty() {
        "// no methods".to_string()
    } else {
        blocks.join("\n\n")
    };
    let cls = format!("public class {root}Tests\n{{\n{}\n}}", indent(&body));
    format!(
        "{CS_HEADER}\n\nusing System;\nusing System.Collections.Generic;\nusing System.Threading.Tasks;\n\nnamespace {test_namespace};\n\n{cls}\n"
    )
}
