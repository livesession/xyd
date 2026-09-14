//! Port of the two DOCS capabilities from `tests-cs.ts` (`generateDotnetUsage` /
//! `generateDotnetTypeReference`) — what Atlas renders on an API-reference page
//! for the .NET tab:
//!
//!   * a self-contained runnable snippet: a top-level `Program` that constructs
//!     the client and makes ONE call;
//!   * the method signature + request/response types as field rows.
//!
//! Both reuse the emitter's own machinery — the same client-chain builder
//! (PascalCase), call assembly (`call_args`) and type mapper (`cs_type`) the SDK
//! and its test suite use — so a docs snippet can never describe a method the
//! generated SDK does not have. The only difference from the test suite is the
//! planning mode: docs plan `realistic` + `with_optional` (ALL fields, the spec's
//! own example/default values) because a human reads them.

use serde_json::Value;
use xyd_opensdk_core::emitter::{
    opt_str, RenderedTypeField, RenderedTypeGroup, RenderedTypeReference, RenderedTypeResponse,
};

use crate::cstype::{cs_type, nullable, Types};
use crate::cswriter::{cs_file, indent};
use crate::jsrt::{camel_case, json_string, method_name, pascal_case, screaming_snake_case};
use crate::plan::{plan_operation, OperationPlan};
use crate::tests_gen::{call_args, method_has_result};
use crate::type_plan::{plan_type_reference, ref_schema_name, FieldLocation, NeutralTypeField};

/// `client.<Chain>.<Method>` — the accessor chain a call hangs off.
fn chain_expr(chain: &[String], method: &Value) -> String {
    let segments: Vec<String> = chain.iter().map(|s| pascal_case(s)).collect();
    let action = method.get("action").and_then(Value::as_str).unwrap_or("");
    format!("client.{}.{}", segments.join("."), method_name(action))
}

/// A single per-operation USAGE SNIPPET (docs): a self-contained, runnable-looking
/// C# `Program` that constructs the client and makes ONE call with ALL fields
/// filled from realistic (spec example/default) values.
///
/// `options` is the emitter-options bag (`Value::Null` for none). `baseUrlEnv` is
/// the DOCS-ONLY option: when set, the snippet ALSO reads its base URL from that
/// env var so it can target a recording server. Unset, the output is byte-identical
/// to the pre-port TypeScript snippet.
pub fn generate_dotnet_usage(
    spec: &Value,
    chain: &[String],
    method: &Value,
    options: &Value,
) -> String {
    let opts = crate::resolve_options(spec, options);
    let table = crate::symbol_table(spec);
    let types: Types = &table;

    // A doc usage snippet: ALL fields with realistic (spec example/default) values.
    let call = format!(
        "{}({})",
        chain_expr(chain, method),
        call_args(method, types, true, None, true)
    );

    let env_var = opts
        .env_var
        .clone()
        .unwrap_or_else(|| format!("{}_API_KEY", screaming_snake_case(&opts.sdk)));
    let key_expr = format!(
        "Environment.GetEnvironmentVariable({})",
        json_string(&env_var)
    );

    let mut client_args = vec![format!("apiKey: {key_expr}")];
    if let Some(base_url_env) = opt_str(options, "baseUrlEnv") {
        client_args.push(format!(
            "baseUrl: Environment.GetEnvironmentVariable({})",
            json_string(base_url_env)
        ));
    }

    let mut lines = vec![format!(
        "var client = new {}Client({});",
        opts.sdk,
        client_args.join(", ")
    )];
    if method_has_result(method, types) {
        lines.push(format!("var result = await {call};"));
        lines.push("Console.WriteLine(result);".to_string());
    } else {
        lines.push(format!("await {call};"));
    }

    // A top-level async-Main `Program` (the conventional entry class name; avoids
    // clashing with an `Example`-rooted namespace): `using`s sorted by cs_file, the
    // SDK namespace imported so the client + models resolve. System.Collections.Generic
    // is needed whenever a required example value is a List<T>/Dictionary<string,T>.
    let usings = [
        "System".to_string(),
        "System.Collections.Generic".to_string(),
        "System.Threading.Tasks".to_string(),
        opts.namespace.clone(),
    ];
    let body = indent(&format!(
        "public static async Task Main()\n{{\n{}\n}}",
        indent(&lines.join("\n"))
    ));
    let cls = format!("public static class Program\n{{\n{body}\n}}");
    cs_file(&usings, &format!("{}.Usage", opts.namespace), &[cls])
}

// ---- type reference (Atlas SDK-types view) -------------------------------

/// One request field row: a body field maps to a model class property
/// (PascalCase); a query/header param maps to a method argument (camelCase).
fn cs_render_field(f: &NeutralTypeField, types: Types) -> RenderedTypeField {
    let base = cs_type(f.type_ref.as_ref(), types);
    RenderedTypeField {
        name: if f.location == FieldLocation::Body {
            pascal_case(&f.logical_name)
        } else {
            camel_case(&f.logical_name)
        },
        lang_type: if f.required { base } else { nullable(&base) },
        required: f.required,
        description: f.description.clone(),
        deprecated: f.deprecated,
        ref_type_name: ref_schema_name(f.type_ref.as_ref()),
    }
}

/// One response field row — always a model property, never nullable-wrapped.
fn cs_response_field(f: &NeutralTypeField, types: Types) -> RenderedTypeField {
    RenderedTypeField {
        name: pascal_case(&f.logical_name),
        lang_type: cs_type(f.type_ref.as_ref(), types),
        required: f.required,
        description: f.description.clone(),
        deprecated: f.deprecated,
        ref_type_name: ref_schema_name(f.type_ref.as_ref()),
    }
}

/// The `Task<T>` display return — the actual type name (`cs_type`), not the
/// runtime `object?` a mapped union decodes to. Mirrors `return_plan`.
fn cs_return_display(method: &Value, op: &OperationPlan, types: Types) -> String {
    if op.binary_content_type.is_some() {
        return "Task<byte[]>".to_string();
    }
    if let Some(page) = op.page_name {
        let item = method.get("pagination").and_then(|p| p.get("itemType"));
        return format!("Task<{page}<{}>>", cs_type(item, types));
    }
    let ref_ = method
        .get("primaryResponse")
        .filter(|v| !v.is_null())
        .filter(|_| op.primary_response != "none");
    match ref_ {
        Some(r) => format!("Task<{}>", cs_type(Some(r), types)),
        None => "Task".to_string(),
    }
}

fn cs_response(
    op: &OperationPlan,
    neutral_ref: Option<&Value>,
    neutral_fields: Option<&Vec<NeutralTypeField>>,
    types: Types,
) -> RenderedTypeResponse {
    if let Some(ct) = &op.binary_content_type {
        return RenderedTypeResponse {
            type_name: None,
            fields: None,
            lang_type: Some("byte[]".to_string()),
            note: Some(format!("binary download ({ct})")),
        };
    }
    let Some(ref_) = neutral_ref.filter(|_| op.primary_response != "none") else {
        return RenderedTypeResponse {
            type_name: None,
            fields: None,
            lang_type: Some("Task".to_string()),
            note: Some("no response body".to_string()),
        };
    };
    let type_name = cs_type(Some(ref_), types);
    let note = op.page_name.map(|p| format!("paginated ({p})"));
    match neutral_fields {
        Some(fields) => RenderedTypeResponse {
            type_name: Some(type_name),
            fields: Some(fields.iter().map(|f| cs_response_field(f, types)).collect()),
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

/// The per-operation SDK TYPE reference for .NET: the method signature + the
/// request field rows (flattened args — no dedicated params class) + the response.
///
/// `options` is accepted for signature symmetry with [`generate_dotnet_usage`]
/// (and so the napi layer can call both the same way); the TypeScript capability
/// resolves the options bag too but reads nothing from it — a type reference is
/// derived entirely from the IR.
pub fn generate_dotnet_type_reference(
    spec: &Value,
    chain: &[String],
    method: &Value,
    _options: &Value,
) -> RenderedTypeReference {
    let table = crate::symbol_table(spec);
    let types: Types = &table;
    let op = plan_operation(method, types);
    let neutral = plan_type_reference(method, types);

    let name_of = |p: &Value| camel_case(p.get("name").and_then(Value::as_str).unwrap_or(""));
    let arg_names: Vec<String> = op
        .path_params
        .iter()
        .map(name_of)
        .chain(op.has_body.then(|| "body".to_string()))
        .chain(op.query_params.iter().map(name_of))
        .chain(op.header_params.iter().map(name_of))
        .collect();
    let signature = format!(
        "{}({}) -> {}",
        chain_expr(chain, method),
        arg_names.join(", "),
        cs_return_display(method, &op, types)
    );

    RenderedTypeReference {
        signature,
        request: RenderedTypeGroup {
            type_name: None,
            arg_name: None,
            fields: neutral
                .request_fields
                .iter()
                .map(|f| cs_render_field(f, types))
                .collect(),
        },
        response: cs_response(
            &op,
            neutral.response_type_ref.as_ref(),
            neutral.response_fields.as_ref(),
            types,
        ),
    }
}
