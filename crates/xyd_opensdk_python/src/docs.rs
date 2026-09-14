//! The two DOCS-only emitter capabilities, ported from `tests-py.ts`
//! (`generatePythonUsage`) and `project.ts` (`generatePythonTypeReference`).
//!
//! Neither is part of the generated file map: Atlas renders them on an API
//! reference page in place of the REST view — a runnable snippet plus the
//! SDK-native call signature and its request/response field rows.

use std::collections::HashMap;

use serde_json::Value;
use xyd_opensdk_core::emitter::{
    opt_str, RenderedTypeField, RenderedTypeGroup, RenderedTypeReference, RenderedTypeResponse,
};

use crate::example_plan::{plan_method_example, MethodExampleOpts};
use crate::naming::snake_case;
use crate::project::resolve_options;
use crate::pytype::{optionalize, py_type, PyUses};
use crate::resources::{plan_operation, py_page_name, return_annotation, Plan};
use crate::tests::render_call_args;
use crate::type_plan::{plan_type_reference, ref_schema_name, NeutralTypeField};
use crate::val::{arr, pystr, str_field};

type TypeMap<'a> = HashMap<&'a str, &'a Value>;

/// The IR symbol table, as every renderer here wants it.
fn type_map(spec: &Value) -> TypeMap<'_> {
    arr(spec, "types")
        .iter()
        .filter_map(|t| str_field(t, "name").map(|n| (n, t)))
        .collect()
}

/// `client.<attr>.<...>.<action>` — the client accessor chain for one method.
fn call_chain(chain: &[String], method: &Value) -> String {
    let mut parts: Vec<String> = chain.iter().map(|s| snake_case(s)).collect();
    parts.push(snake_case(str_field(method, "action").unwrap_or("")));
    format!("client.{}", parts.join("."))
}

/// Whether the method yields a value worth binding to `result` (mirrors the Go
/// emitter): a binary download, a paginated list, or any primary response.
fn has_result(method: &Value, plan: &Plan) -> bool {
    plan.binary_content_type.is_some()
        || py_page_name(plan).is_some()
        || method
            .get("primaryResponse")
            .map(|v| !v.is_null())
            .unwrap_or(false)
}

/// A single per-operation USAGE SNIPPET (docs): a self-contained,
/// runnable-looking Python example that constructs the client and makes ONE
/// call with ALL fields set to realistic (spec example/default) values.
///
/// `options` is the emitter options bag (`Value::Null` for none). Only
/// `packageName` / `baseUrlEnv` alter the output; with no options the snippet is
/// byte-identical to what the TypeScript emitter froze into `docs.json`.
pub fn generate_python_usage(
    spec: &Value,
    chain: &[String],
    method: &Value,
    options: &Value,
) -> String {
    let opts = resolve_options(spec, options);
    let types = type_map(spec);

    // A doc usage snippet: ALL fields with realistic (spec example/default) values.
    let example = plan_method_example(method, &types, MethodExampleOpts::realistic_all());
    let call = format!(
        "{}({})",
        call_chain(chain, method),
        render_call_args(&example)
    );

    // Client construction: normally the default base URL. When the caller sets
    // `baseUrlEnv` (the snippet-run tier), read the base URL from that env var
    // so the snippet can target a recording server.
    let mut client_args = vec![format!(
        "    api_key=os.environ.get({}),",
        pystr(&opts.env_var)
    )];
    if let Some(base_url_env) = opt_str(options, "baseUrlEnv") {
        client_args.push(format!(
            "    base_url=os.environ.get({}),",
            pystr(base_url_env)
        ));
    }

    let mut lines: Vec<String> = vec![
        "import os".to_string(),
        String::new(),
        format!("from {} import Client", opts.pkg),
        String::new(),
        "client = Client(".to_string(),
    ];
    lines.extend(client_args);
    lines.push(")".to_string());
    lines.push(String::new());

    let plan = plan_operation(method);
    if has_result(method, &plan) {
        lines.push(format!("result = {call}"));
        lines.push("print(result)".to_string());
    } else {
        lines.push(call);
    }
    format!("{}\n", lines.join("\n"))
}

/// The params-KWARG Python type — mirrors `method_def`'s param/body field types:
/// `py_type(...)` when required, `Optional[...]` otherwise (Python flattens the
/// params struct to keyword args, so the location is irrelevant to the type).
fn py_field_type_display(f: &NeutralTypeField) -> String {
    let mut uses = PyUses::new();
    let base = py_type(f.type_ref, &mut uses);
    if f.required {
        base
    } else {
        optionalize(&base, &mut uses)
    }
}

fn py_render_field(f: &NeutralTypeField) -> RenderedTypeField {
    RenderedTypeField {
        name: snake_case(f.logical_name),
        lang_type: py_field_type_display(f),
        required: f.required,
        description: f.description.map(str::to_string),
        deprecated: f.deprecated,
        ref_type_name: ref_schema_name(f.type_ref).map(str::to_string),
    }
}

/// A response struct row: the bare declared type (no `Optional[...]` wrapper —
/// a response model's optional field still decodes to its own type).
fn py_render_response_field(f: &NeutralTypeField) -> RenderedTypeField {
    RenderedTypeField {
        name: snake_case(f.logical_name),
        lang_type: py_type(f.type_ref, &mut PyUses::new()),
        required: f.required,
        description: f.description.map(str::to_string),
        deprecated: f.deprecated,
        ref_type_name: ref_schema_name(f.type_ref).map(str::to_string),
    }
}

/**
The per-operation TYPE REFERENCE for Python: the idiomatic call signature, the
request kwargs' field rows, and the response type — the SDK-native view Atlas
renders in place of the REST param definitions. Python flattens the params
struct to keyword args, so `request.typeName` (and `argName`) stay unset.
*/
pub fn generate_python_type_reference(
    spec: &Value,
    chain: &[String],
    method: &Value,
    options: &Value,
) -> RenderedTypeReference {
    // No Python emitter option reaches the type reference (the signature is
    // derived entirely from the IR); accepted so every language's docs surface
    // has one shape.
    let _ = options;
    let types = type_map(spec);
    let plan = plan_operation(method);
    let neutral = plan_type_reference(method, &types, &plan);

    // The call signature: `client.<attr>.<action>(<path args>, <kwargs>) -> <return>`.
    // Positional path params by snake name, then each request field as a keyword
    // (required → `name`, optional → `name=...`), mirroring `method_def`'s order.
    let mut args: Vec<String> = arr(method, "pathParams")
        .iter()
        .map(|p| snake_case(str_field(p, "name").unwrap_or("")))
        .collect();
    for f in &neutral.request_fields {
        let n = snake_case(f.logical_name);
        args.push(if f.required { n } else { format!("{n}=...") });
    }
    let signature = format!(
        "{}({}) -> {}",
        call_chain(chain, method),
        args.join(", "),
        return_annotation(&plan)
    );

    RenderedTypeReference {
        signature,
        request: RenderedTypeGroup {
            type_name: None,
            arg_name: None,
            fields: neutral.request_fields.iter().map(py_render_field).collect(),
        },
        response: py_response(method, &plan, &neutral),
    }
}

/// The Python "Returns" half: `returnPlan`'s annotation, plus struct rows when
/// the response resolves to a named struct.
fn py_response(
    method: &Value,
    plan: &Plan,
    neutral: &crate::type_plan::NeutralTypeReference,
) -> RenderedTypeResponse {
    let lang_type = return_annotation(plan);
    if let Some(binary) = &plan.binary_content_type {
        return RenderedTypeResponse {
            type_name: None,
            fields: None,
            lang_type: Some(lang_type),
            note: Some(format!("binary download ({binary})")),
        };
    }
    let no_primary = method
        .get("primaryResponse")
        .map(Value::is_null)
        .unwrap_or(true);
    if neutral.response_type_ref.is_none() || no_primary {
        return RenderedTypeResponse {
            type_name: None,
            fields: None,
            lang_type: Some("None".to_string()),
            note: Some("no response body".to_string()),
        };
    }
    let note = py_page_name(plan).map(|p| format!("paginated ({p})"));
    match &neutral.response_fields {
        Some(fields) => RenderedTypeResponse {
            type_name: Some(lang_type),
            fields: Some(fields.iter().map(py_render_response_field).collect()),
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
