//! buildLeafCommand — port of command.ts. Resolves the operation's params/
//! body/responses through `DocCtx` ($ref → target; identity when already
//! dereferenced) and assembles the leaf Command + its x-openapi binding.

use serde_json::Value;
use std::collections::HashSet;

use xyd_openapi::DocCtx;

use crate::action::derive_target;
use crate::body::map_request_body;
use crate::model::{Command, XOpenApiCommand};
use crate::options::Options;
use crate::parameters::map_parameters;
use crate::response::map_responses;

pub struct BuiltLeaf {
    pub resource_path: Vec<String>,
    pub command: Command,
}

/// Merge path-item + operation parameters (operation wins on `in:name`),
/// resolving each through the ctx. Returns owned resolved ParameterObjects.
fn merge_parameters(
    ctx: &DocCtx,
    path_item_params: &[Value],
    op_params: Option<&Value>,
) -> Vec<Value> {
    let mut order: Vec<String> = Vec::new();
    let mut by_key: std::collections::HashMap<String, Value> = std::collections::HashMap::new();
    let mut add = |p: &Value| {
        let r = ctx.resolve(p);
        let (Some(pin), Some(pname)) = (
            r.get("in").and_then(|v| v.as_str()),
            r.get("name").and_then(|v| v.as_str()),
        ) else {
            return;
        };
        let key = format!("{pin}:{pname}");
        if !by_key.contains_key(&key) {
            order.push(key.clone());
        }
        by_key.insert(key, r.clone());
    };
    for p in path_item_params {
        add(p);
    }
    if let Some(Value::Array(arr)) = op_params {
        for p in arr {
            add(p);
        }
    }
    order
        .into_iter()
        .filter_map(|k| by_key.remove(&k))
        .collect()
}

pub fn build_leaf_command(
    ctx: &DocCtx,
    method: &str,
    path: &str,
    operation: &Value,
    path_item_params: &[Value],
    options: &Options,
) -> BuiltLeaf {
    let target = derive_target(method, path, operation, options);
    let all_params = merge_parameters(ctx, path_item_params, operation.get("parameters"));

    let mut used_flag_names: HashSet<String> = HashSet::new();
    let params = map_parameters(
        &all_params,
        &target.path_param_names,
        &mut used_flag_names,
        options,
    );

    let request_body = operation
        .get("requestBody")
        .map(|rb| ctx.resolve(rb).clone());
    let body = map_request_body(request_body.as_ref(), &mut used_flag_names, options);

    let mut command = Command {
        name: target.action.clone(),
        ..Default::default()
    };
    if !target.aliases.is_empty() {
        command.aliases = Some(target.aliases.clone());
    }
    // description = summary || description
    let description = operation
        .get("summary")
        .and_then(|s| s.as_str())
        .filter(|s| !s.is_empty())
        .or_else(|| {
            operation
                .get("description")
                .and_then(|d| d.as_str())
                .filter(|d| !d.is_empty())
        });
    if let Some(desc) = description {
        command.description = Some(desc.to_string());
    }
    if !params.arguments.is_empty() {
        command.arguments = Some(params.arguments);
    }
    let mut all_options = params.options;
    all_options.extend(body.options);
    if !all_options.is_empty() {
        command.options = Some(all_options);
    }

    let mut x = XOpenApiCommand {
        method: method.to_lowercase(),
        path: path.to_string(),
        ..Default::default()
    };
    if let Some(oid) = operation
        .get("operationId")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
    {
        x.operation_id = Some(oid.to_string());
    }
    if let Some(b) = &body.x_body {
        if !b.content_type.is_empty() {
            x.content_type = Some(b.content_type.clone());
        }
    }
    if !params.x_params.is_empty() {
        x.params = Some(params.x_params);
    }
    if let Some(b) = body.x_body {
        x.body = Some(b);
    }

    // responses resolved before sampling.
    let responses = operation
        .get("responses")
        .map(|r| resolve_responses(ctx, r));
    let mapped = map_responses(responses.as_ref());
    if !mapped.is_empty() {
        x.responses = Some(mapped);
    }

    command.x_openapi = Some(x);

    BuiltLeaf {
        resource_path: target.resource_path,
        command,
    }
}

/// Deep-resolve the responses object one level (status → response, and each
/// response's content media schemas) so the sampler sees concrete schemas.
/// For already-dereferenced docs this is identity.
fn resolve_responses(ctx: &DocCtx, responses: &Value) -> Value {
    let Some(map) = responses.as_object() else {
        return responses.clone();
    };
    let mut out = serde_json::Map::new();
    for (status, r) in map {
        out.insert(status.clone(), ctx.resolve(r).clone());
    }
    Value::Object(out)
}
