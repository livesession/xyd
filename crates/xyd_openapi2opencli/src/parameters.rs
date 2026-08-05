//! mapParameters — port of parameters.ts. Path params → positional arguments
//! (in path order); query/header/cookie → options. Records the x-openapi
//! param bindings. Schemas are `ctx.resolve()`d at the call site (command.rs).

use serde_json::Value;
use std::collections::{HashMap, HashSet};

use crate::jsrt::{camel_case, kebab_case, unique_name};
use crate::model::{Argument, Opt, XOpenApiParam};
use crate::options::Options;
use crate::schema::{array_items, get_enum, is_array, is_boolean, is_object_schema, scalar_type};

const AUTH_HEADERS: [&str; 5] = [
    "authorization",
    "x-api-key",
    "api-key",
    "openai-organization",
    "openai-project",
];

pub struct ParamMapResult {
    pub arguments: Vec<Argument>,
    pub options: Vec<Opt>,
    pub x_params: Vec<XOpenApiParam>,
}

fn flag_name(wire: &str, flag_case: Option<&str>) -> String {
    if flag_case == Some("camel") {
        camel_case(wire)
    } else {
        kebab_case(wire)
    }
}

fn value_label(schema: Option<&Value>) -> String {
    if is_array(schema) {
        let item = array_items(schema);
        return scalar_type(item).map(|s| s.to_string()).unwrap_or_else(|| {
            if is_object_schema(item) {
                "json"
            } else {
                "value"
            }
            .to_string()
        });
    }
    scalar_type(schema)
        .map(|s| s.to_string())
        .unwrap_or_else(|| {
            if is_object_schema(schema) {
                "json"
            } else {
                "value"
            }
            .to_string()
        })
}

fn value_argument(schema: Option<&Value>) -> Argument {
    let mut arg = Argument::named(&value_label(schema));
    let enum_src = if is_array(schema) {
        array_items(schema)
    } else {
        schema
    };
    if let Some(vals) = get_enum(enum_src) {
        arg.accepted_values = Some(vals);
    }
    if is_array(schema) {
        arg.arity = Some(crate::model::Arity { minimum: 0 });
    }
    arg
}

/// `params` are already `$ref`-resolved ParameterObjects (owned clones from the
/// caller); `path_param_order` is wire names in path order.
pub fn map_parameters(
    params: &[Value],
    path_param_order: &[String],
    used_flag_names: &mut HashSet<String>,
    options: &Options,
) -> ParamMapResult {
    let mut result = ParamMapResult {
        arguments: Vec::new(),
        options: Vec::new(),
        x_params: Vec::new(),
    };

    let mut by_name: HashMap<&str, &Value> = HashMap::new();
    for p in params {
        if p.get("in").and_then(|v| v.as_str()) == Some("path") {
            if let Some(n) = p.get("name").and_then(|v| v.as_str()) {
                by_name.insert(n, p);
            }
        }
    }

    // Path params → positional arguments.
    for wire in path_param_order {
        let p = by_name.get(wire.as_str()).copied();
        let schema = p.and_then(|p| p.get("schema"));
        let arg_name = kebab_case(wire);
        let mut arg = Argument::named(&arg_name);
        arg.required = Some(true);
        if let Some(desc) = p
            .and_then(|p| p.get("description"))
            .and_then(|d| d.as_str())
        {
            if !desc.is_empty() {
                arg.description = Some(desc.to_string());
            }
        }
        if let Some(vals) = get_enum(schema) {
            arg.accepted_values = Some(vals);
        }
        result.arguments.push(arg);
        result.x_params.push(XOpenApiParam {
            location: "path".to_string(),
            name: wire.clone(),
            from: format!("argument:{arg_name}"),
            required: Some(true),
            explode: None,
            style: None,
        });
    }

    // Query / header / cookie → options.
    for p in params {
        let p_in = p.get("in").and_then(|v| v.as_str()).unwrap_or("");
        if p_in.is_empty() || p_in == "path" {
            continue;
        }
        let p_name = p.get("name").and_then(|v| v.as_str()).unwrap_or("");
        if p_in == "header" || p_in == "cookie" {
            if options.include_headers != Some(true) {
                continue;
            }
            if AUTH_HEADERS.contains(&p_name.to_lowercase().as_str()) {
                continue;
            }
        }

        let schema = p.get("schema");
        let name = unique_name(
            &flag_name(p_name, options.flag_case.as_deref()),
            used_flag_names,
        );

        let required = p.get("required").and_then(|v| v.as_bool()).unwrap_or(false);
        let mut opt = Opt {
            name: name.clone(),
            required: if required { Some(true) } else { None },
            description: p
                .get("description")
                .and_then(|d| d.as_str())
                .filter(|d| !d.is_empty())
                .map(|d| d.to_string()),
            // `if (p.in !== 'query') group = p.in; else group = 'query'` → always set.
            group: Some(p_in.to_string()),
            hidden: if p_in == "header" || p_in == "cookie" {
                Some(true)
            } else {
                None
            },
            arguments: None,
        };
        if !is_boolean(schema) {
            opt.arguments = Some(vec![value_argument(schema)]);
        }
        result.options.push(opt);

        let mut x = XOpenApiParam {
            location: p_in.to_string(),
            name: p_name.to_string(),
            from: format!("option:{name}"),
            required: if required { Some(true) } else { None },
            explode: None,
            style: None,
        };
        if let Some(Value::Bool(e)) = p.get("explode") {
            x.explode = Some(*e);
        }
        if let Some(s) = p.get("style").and_then(|v| v.as_str()) {
            x.style = Some(s.to_string());
        }
        result.x_params.push(x);
    }

    result
}
