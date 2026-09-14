//! The two DOCS capabilities from `example-java.ts` — `generateJavaUsage`
//! (`:264`) and `generateJavaTypeReference` (`:359`) — the per-operation SDK
//! view Atlas renders on an API-reference page.
//!
//! Both reuse the machinery the generated test suite already drives (the client
//! accessor chain, the params builder, the shared example planner), with two
//! docs-only differences:
//!
//!   * the example is planned `realistic` + `withOptional` — ALL fields, spec
//!     example/default values — where a test plans neutral required-only ones;
//!   * `baseUrlEnv` (docs-only emitter option) makes the snippet read its base
//!     URL from that env var. Unset ⇒ byte-identical default output.
//!
//! Java quirks worth not "fixing": a nested request-body object renders as a
//! bare `new Owner()` because generated models are decode-only POJOs, and the
//! snippet is a full `java_file(...)` so it carries the ownership header AND a
//! `package` line (unlike the other languages' snippets).

use serde_json::Value;

use xyd_opensdk_core::emitter::{
    RenderedTypeField, RenderedTypeGroup, RenderedTypeReference, RenderedTypeResponse,
};

use crate::example::render_java_example;
use crate::example_plan::plan_method_example;
use crate::ir::{build_types, str_field, Types};
use crate::javatype::java_type;
use crate::javawriter::java_file;
use crate::jsrt::{camel_case, java_method_name, json_str, pascal_case, screaming_snake_case};
use crate::plan::{plan_operation, OperationPlan, PrimaryKind};
use crate::project::{resolve_java_options, JavaCtx};
use crate::service::{plan_params, return_plan};
use crate::tests_gen::{
    call_expr, client_chain, const_body_field_names, method_has_params, render_params_builder,
};
use crate::type_plan::{plan_type_reference, ref_schema_name, NeutralTypeField};

/// Whether the method returns a value (drives `var result = ...` vs a bare
/// call) — mirrors service.rs `return_plan`: a binary download, a paginated
/// page, or a primary response other than `none` yields a result.
fn method_has_result(method: &Value, op: &OperationPlan) -> bool {
    op.binary_content_type.is_some()
        || op.page_name.is_some()
        || (method.get("primaryResponse").is_some_and(|p| !p.is_null())
            && op.primary_response != PrimaryKind::None)
}

/// A single per-operation USAGE SNIPPET (docs): a self-contained,
/// runnable-looking `Example` class whose `main` constructs the client and makes
/// ONE call. `chain` is the resource-name path (root→owner) the method hangs
/// off.
pub fn generate_java_usage(
    spec: &Value,
    chain: &[String],
    method: &Value,
    options: &Value,
) -> String {
    let ctx = resolve_java_options(spec, build_types(spec), options);
    java_usage(method, chain, &ctx)
}

fn java_usage(method: &Value, segments: &[String], ctx: &JavaCtx) -> String {
    let op = plan_operation(method, &ctx.types);
    let method_name = java_method_name(str_field(method, "action").unwrap_or(""));
    let pascal_method = pascal_case(&method_name);
    let chain = client_chain(segments);
    let const_names = const_body_field_names(method, &ctx.types);

    // A doc usage snippet: ALL fields with realistic (spec example/default)
    // values. (Nested request-body objects still render `new X()` — generated
    // Java models are decode-only POJOs; see render_java_example.)
    let example = plan_method_example(method, &ctx.types, true, true);
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
    let call = call_expr(&chain, &method_name, &path_args, params.as_deref());

    let env_var = ctx
        .env_var
        .clone()
        .unwrap_or_else(|| format!("{}_API_KEY", screaming_snake_case(&ctx.pkg)));
    let key_expr = format!("System.getenv({})", json_str(&env_var));
    let has_result = method_has_result(method, &op);

    let call_line = if has_result {
        format!("    var result = {call};")
    } else {
        format!("    {call};")
    };
    let print_line = if has_result {
        "\n    System.out.println(result);"
    } else {
        ""
    };
    // Client construction: normally the default base URL. When `baseUrlEnv` is
    // set (the snippet-run tier), also read the base URL from that env var so
    // the snippet can target a recording server. Only alters output when set.
    let builder_expr = match ctx.base_url_env.as_deref() {
        Some(env) => format!(
            "Client.builder().apiKey({key_expr}).baseUrl(System.getenv({})).build()",
            json_str(env)
        ),
        None => format!("Client.builder().apiKey({key_expr}).build()"),
    };
    let body = format!(
        "public final class Example {{\n  public static void main(String[] args) {{\n    Client client = {builder_expr};\n{call_line}{print_line}\n  }}\n}}"
    );
    java_file(&ctx.full_package, &[], &body)
}

// ---- type reference (Atlas SDK-types view) -------------------------------

/// The params-class FIELD type as a consumer sees it — mirrors the params
/// file's accessor return type (optional fields surface as `Optional<T>`,
/// required as the bare `java_type`).
fn java_field_type_display(f: &NeutralTypeField, types: &Types) -> String {
    let base = java_type(f.type_ref, types);
    if f.required {
        base
    } else {
        format!("Optional<{base}>")
    }
}

fn java_render_field(f: &NeutralTypeField, types: &Types) -> RenderedTypeField {
    RenderedTypeField {
        name: camel_case(&f.logical_name),
        lang_type: java_field_type_display(f, types),
        required: f.required,
        description: f.description.clone(),
        deprecated: f.deprecated,
        ref_type_name: ref_schema_name(f.type_ref),
    }
}

fn java_response(
    op: &OperationPlan,
    neutral_ref: Option<&Value>,
    neutral_fields: Option<&Vec<NeutralTypeField>>,
    ctx: &JavaCtx,
) -> RenderedTypeResponse {
    if let Some(ct) = &op.binary_content_type {
        return RenderedTypeResponse {
            type_name: None,
            fields: None,
            lang_type: Some("byte[]".to_string()),
            note: Some(format!("binary download ({ct})")),
        };
    }
    if neutral_ref.is_none() || op.primary_response == PrimaryKind::None {
        return RenderedTypeResponse {
            type_name: None,
            fields: None,
            lang_type: Some("void".to_string()),
            note: Some("no response body".to_string()),
        };
    }
    let type_name = java_type(neutral_ref, &ctx.types);
    let note = op.page_name.map(|p| format!("paginated ({p})"));
    match neutral_fields {
        Some(fields) => RenderedTypeResponse {
            type_name: Some(type_name),
            fields: Some(
                fields
                    .iter()
                    .map(|rf| RenderedTypeField {
                        name: camel_case(&rf.logical_name),
                        lang_type: java_type(rf.type_ref, &ctx.types),
                        required: rf.required,
                        description: rf.description.clone(),
                        deprecated: rf.deprecated,
                        ref_type_name: ref_schema_name(rf.type_ref),
                    })
                    .collect(),
            ),
            lang_type: None,
            note,
        },
        None => RenderedTypeResponse {
            type_name: Some(type_name.clone()),
            fields: None,
            lang_type: Some(type_name),
            note,
        },
    }
}

/// The per-operation TYPE REFERENCE for Java: the call signature, the request
/// params class's field rows, and the response type — the SDK-native view Atlas
/// renders in place of the REST param definitions.
pub fn generate_java_type_reference(
    spec: &Value,
    chain: &[String],
    method: &Value,
    options: &Value,
) -> RenderedTypeReference {
    let ctx = resolve_java_options(spec, build_types(spec), options);
    java_type_reference(method, chain, &ctx)
}

fn java_type_reference(
    method: &Value,
    segments: &[String],
    ctx: &JavaCtx,
) -> RenderedTypeReference {
    let op = plan_operation(method, &ctx.types);
    let neutral = plan_type_reference(method, &op, &ctx.types);
    let method_name = java_method_name(str_field(method, "action").unwrap_or(""));
    let params = plan_params(segments, method, &op, ctx);

    let request_fields: Vec<RenderedTypeField> = neutral
        .request_fields
        .iter()
        .map(|f| java_render_field(f, &ctx.types))
        .collect();

    // Signature: `client.pets().create(params) -> Pet` — the accessor-chain
    // receiver + method + arg names (path args, then a `params` arg when
    // present), and the emitter's own return type.
    let mut arg_names: Vec<String> = op
        .path
        .iter()
        .map(|p| camel_case(str_field(p, "name").unwrap_or("")))
        .collect();
    if params.is_some() {
        arg_names.push("params".to_string());
    }
    let signature = format!(
        "{}.{}({}) -> {}",
        client_chain(segments),
        method_name,
        arg_names.join(", "),
        return_plan(method, &op, ctx).0
    );

    RenderedTypeReference {
        signature,
        request: RenderedTypeGroup {
            type_name: params.as_ref().map(|p| p.class_name.clone()),
            arg_name: params.as_ref().map(|_| "params".to_string()),
            fields: request_fields,
        },
        response: java_response(
            &op,
            neutral.response_type_ref,
            neutral.response_fields.as_ref(),
            ctx,
        ),
    }
}
