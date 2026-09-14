//! The two DOCS capabilities (port of `generateRubyUsage` in `tests-rb.ts` and
//! `generateRubyTypeReference` in `service.ts`): the per-operation SDK view
//! Atlas renders on an API-reference page.
//!
//! * [`generate_ruby_usage`] — a self-contained runnable snippet: require the
//!   gem, construct the client, make ONE call.
//! * [`generate_ruby_type_reference`] — the idiomatic call signature plus the
//!   request kwargs' and response type's field rows.
//!
//! Both reuse the emitter's existing machinery (`plan_operation`, the example
//! planner + Ruby value renderer, `rb_doc_type`, `return_doc`) so a docs snippet
//! can never describe a call the generated SDK does not expose. The one
//! docs-only difference is the plan: a snippet is read by humans, so it plans
//! `realistic` + `with_optional` values where the generated test suite plans
//! neutral required-only ones.

use std::collections::HashMap;

use serde_json::Value;
use xyd_opensdk_core::emitter::{
    opt_str, RenderedTypeField, RenderedTypeGroup, RenderedTypeReference, RenderedTypeResponse,
};

use crate::example_plan::plan_method_example;
use crate::naming::snake_case;
use crate::plan::{plan_operation, OperationPlan, PrimaryResponse};
use crate::rbtype::rb_doc_type;
use crate::service::return_doc;
use crate::tests_gen::render_call_args;
use crate::type_plan::{plan_type_reference, ref_schema_name, NeutralTypeField};
use crate::writer::rb_string;

/// The spec's symbol table, keyed by type name (the `ctx.types` map the TS
/// emitter context carries).
pub(crate) fn symbol_table(spec: &Value) -> HashMap<String, Value> {
    spec.get("types")
        .and_then(Value::as_array)
        .map(|arr| {
            arr.iter()
                .filter_map(|t| {
                    t.get("name")
                        .and_then(Value::as_str)
                        .map(|n| (n.to_string(), t.clone()))
                })
                .collect()
        })
        .unwrap_or_default()
}

fn str_field<'a>(v: &'a Value, key: &str) -> &'a str {
    v.get(key).and_then(Value::as_str).unwrap_or("")
}

/// `method.primaryResponse != null` — an absent OR explicitly-null key means no
/// response to capture.
fn has_primary_response(method: &Value) -> bool {
    method
        .get("primaryResponse")
        .map(|v| !v.is_null())
        .unwrap_or(false)
}

/// `client.<attr>.<attr>.<action>` — the same snake_case accessor chain the
/// generated resource tree exposes. `chain` is the resource-name path
/// (root→owner) the method hangs off.
fn call_chain(chain: &[String], method: &Value) -> String {
    let mut parts: Vec<String> = chain.iter().map(|s| snake_case(s)).collect();
    parts.push(snake_case(str_field(method, "action")));
    format!("client.{}", parts.join("."))
}

/// A single per-operation USAGE SNIPPET (docs): a self-contained,
/// runnable-looking Ruby example that requires the gem, constructs the client
/// and makes ONE call with realistic values for ALL parameters.
///
/// `options` is the `emitterOptions` bag (`Value::Null` for none). Beyond the
/// usual `packageName`/`moduleName`, it honors the DOCS-ONLY `baseUrlEnv`: when
/// set, the snippet also reads its base URL from that env var so it can target a
/// recording server. Unset, the output is byte-identical to the default.
pub fn generate_ruby_usage(
    spec: &Value,
    chain: &[String],
    method: &Value,
    options: &Value,
) -> String {
    let opts = crate::resolve_options(spec, options);
    let types = symbol_table(spec);

    // A doc usage snippet: ALL fields with realistic (spec example/default) values.
    let example = plan_method_example(method, &types, true, true);
    let args = render_call_args(&example);
    let chain_expr = call_chain(chain, method);
    let call = if args.is_empty() {
        chain_expr
    } else {
        format!("{chain_expr}({args})")
    };

    // Capture + print the result only when the method returns one (binary
    // download, paginated list, or a primary response) — mirrors resultAssertion.
    let op = plan_operation(method, &types);
    let has_result =
        op.binary_content_type.is_some() || op.page_name.is_some() || has_primary_response(method);

    let mut client_args = vec![format!("api_key: ENV[{}]", rb_string(&opts.env_var))];
    if let Some(base_url_env) = opt_str(options, "baseUrlEnv").filter(|s| !s.is_empty()) {
        client_args.push(format!("base_url: ENV[{}]", rb_string(base_url_env)));
    }
    let client_line = format!(
        "client = {}::Client.new({})",
        opts.module_name,
        client_args.join(", ")
    );

    let mut lines = vec![
        format!("require {}", rb_string(&opts.pkg)),
        String::new(),
        client_line,
        String::new(),
    ];
    if has_result {
        lines.push(format!("result = {call}"));
        lines.push("pp result".to_string());
    } else {
        lines.push(call);
    }
    format!("{}\n", lines.join("\n"))
}

/// One neutral field → a rendered row: snake_case name + its YARD type string.
///
/// Ruby flattens the params struct to keyword args and is duck-typed, so the
/// location (body/query/header) and optionality don't change the documented type
/// — a `nil` default rides on the arg, not the type. That is why this is a plain
/// `rb_doc_type`, exactly like `methodDoc`'s `@param`.
fn rb_render_field(f: &NeutralTypeField) -> RenderedTypeField {
    RenderedTypeField {
        name: snake_case(&f.logical_name),
        lang_type: rb_doc_type(f.type_ref.as_ref()),
        required: f.required,
        description: f.description.clone(),
        deprecated: f.deprecated,
        ref_type_name: ref_schema_name(f.type_ref.as_ref()),
    }
}

fn rb_response(
    method: &Value,
    op: &OperationPlan,
    neutral: &crate::type_plan::NeutralResponse,
) -> RenderedTypeResponse {
    let lang_type = return_doc(method, op);

    if let Some(ct) = &op.binary_content_type {
        return RenderedTypeResponse {
            type_name: None,
            fields: None,
            lang_type: Some(lang_type),
            note: Some(format!("binary download ({ct})")),
        };
    }
    if neutral.type_ref.is_none() || op.primary_response == PrimaryResponse::None {
        return RenderedTypeResponse {
            type_name: None,
            fields: None,
            lang_type: Some("nil".to_string()),
            note: Some("no response body".to_string()),
        };
    }
    let note = op.page_name.map(|_| "paginated (Page)".to_string());
    match &neutral.fields {
        Some(fields) => RenderedTypeResponse {
            type_name: Some(lang_type),
            fields: Some(fields.iter().map(rb_render_field).collect()),
            lang_type: None,
            note,
        },
        None => RenderedTypeResponse {
            type_name: Some(lang_type.clone()),
            fields: None,
            lang_type: Some(lang_type),
            note,
        },
    }
}

/// The per-operation TYPE REFERENCE for Ruby: the idiomatic call signature, the
/// request kwargs' field rows, and the response type — the SDK-native view Atlas
/// renders in place of the REST param definitions. Ruby flattens the params
/// struct to keyword args, so `request.typeName` is left unset (mirrors the
/// Go/Python emitters, using Ruby's primitives). `chain` is the resource-name
/// path (root→owner) the method hangs off.
///
/// `options` is accepted for a uniform cross-language signature; no emitter
/// option reaches this output (the TS twin builds a `RubyCtx` whose `moduleName`
/// and `pkg` it then never reads — Ruby doc types are `Models::`-qualified, not
/// module-qualified).
pub fn generate_ruby_type_reference(
    spec: &Value,
    chain: &[String],
    method: &Value,
    _options: &Value,
) -> RenderedTypeReference {
    let types = symbol_table(spec);
    let op = plan_operation(method, &types);
    let neutral = plan_type_reference(method, &types);

    // The call signature: `client.<attr>.<action>(<path args>, <kwargs>) -> <return>`.
    // Positional path params (snake), then each request field as a keyword
    // (required → `name:`, optional → `name: nil`), mirroring emit_method's order.
    let mut args: Vec<String> = op
        .path_params
        .iter()
        .map(|p| snake_case(str_field(p, "name")))
        .collect();
    for f in &neutral.request.fields {
        let n = snake_case(&f.logical_name);
        args.push(if f.required {
            format!("{n}:")
        } else {
            format!("{n}: nil")
        });
    }
    let signature = format!(
        "{}({}) -> {}",
        call_chain(chain, method),
        args.join(", "),
        return_doc(method, &op)
    );

    RenderedTypeReference {
        signature,
        request: RenderedTypeGroup {
            type_name: None,
            arg_name: None,
            fields: neutral.request.fields.iter().map(rb_render_field).collect(),
        },
        response: rb_response(method, &op, &neutral.response),
    }
}
