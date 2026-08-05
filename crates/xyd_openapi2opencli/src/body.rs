//! mapRequestBody — port of body.ts. Hybrid strategy: top-level scalars/
//! scalar-arrays flatten to flags, nested/compositions collapse to a JSON
//! flag; `x-openapi.body` records the binding. Schemas already `ctx.resolve()`d.

use serde_json::Value;
use std::collections::HashSet;

use crate::jsrt::{camel_case, js_object_keys, kebab_case, unique_name};
use crate::model::{Argument, Opt, XOpenApiBody, XOpenApiBodyProp};
use crate::options::Options;
use crate::schema::{
    array_items, get_enum, is_array, is_binary, is_boolean, is_object_schema,
    resolve_object_schema, scalar_type,
};

pub struct BodyMapResult {
    pub options: Vec<Opt>,
    pub x_body: Option<XOpenApiBody>,
}

fn flag_name(wire: &str, flag_case: Option<&str>) -> String {
    if flag_case == Some("camel") {
        camel_case(wire)
    } else {
        kebab_case(wire)
    }
}

fn pick_content(content: Option<&Value>) -> Option<(String, Option<Value>)> {
    let map = content?.as_object()?;
    if map.is_empty() {
        return None;
    }
    let keys = js_object_keys(map);
    let prefer = [
        "application/json",
        "multipart/form-data",
        "application/x-www-form-urlencoded",
    ];
    let chosen = prefer
        .iter()
        .find(|p| keys.iter().any(|k| k.as_str() == **p))
        .map(|s| s.to_string())
        .unwrap_or_else(|| keys[0].clone());
    let schema = map.get(&chosen).and_then(|m| m.get("schema")).cloned();
    Some((chosen, schema))
}

fn encoding_for(schema: Option<&Value>) -> String {
    if is_binary(schema) {
        return "file".to_string();
    }
    if is_array(schema) {
        return "array".to_string();
    }
    match scalar_type(schema) {
        Some(t) => t.to_string(),
        None => "json".to_string(),
    }
}

fn value_argument(schema: Option<&Value>) -> Argument {
    if is_binary(schema) {
        return Argument::named("path");
    }
    let is_arr = is_array(schema);
    let label = if is_arr {
        scalar_type(array_items(schema))
            .map(|s| s.to_string())
            .unwrap_or_else(|| {
                if is_object_schema(array_items(schema)) {
                    "json"
                } else {
                    "value"
                }
                .to_string()
            })
    } else {
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
    };
    let mut arg = Argument::named(&label);
    let enum_src = if is_arr { array_items(schema) } else { schema };
    if let Some(vals) = get_enum(enum_src) {
        arg.accepted_values = Some(vals);
    }
    if is_arr {
        arg.arity = Some(crate::model::Arity { minimum: 0 });
    }
    arg
}

/// `request_body` is the already-`$ref`-resolved RequestBodyObject.
pub fn map_request_body(
    request_body: Option<&Value>,
    used_flag_names: &mut HashSet<String>,
    options: &Options,
) -> BodyMapResult {
    let Some(request_body) = request_body else {
        return BodyMapResult {
            options: vec![],
            x_body: None,
        };
    };
    let content = request_body.get("content");
    if content.is_none() {
        return BodyMapResult {
            options: vec![],
            x_body: None,
        };
    }
    let Some((media_type, schema)) = pick_content(content) else {
        return BodyMapResult {
            options: vec![],
            x_body: None,
        };
    };

    let is_multipart =
        media_type == "multipart/form-data" || media_type == "application/x-www-form-urlencoded";
    let body_required = request_body.get("required").and_then(|v| v.as_bool()) == Some(true);

    let resolved = resolve_object_schema(schema.as_ref());
    let use_single_json = options.body_strategy.as_deref() == Some("json")
        || (resolved.object.is_none() && !is_multipart);

    if use_single_json {
        let name = unique_name("body", used_flag_names);
        let opt = Opt {
            name: name.clone(),
            required: Some(body_required),
            group: Some("body".to_string()),
            description: Some(
                request_body
                    .get("description")
                    .and_then(|d| d.as_str())
                    .filter(|d| !d.is_empty())
                    .unwrap_or("Request body as a JSON string")
                    .to_string(),
            ),
            hidden: None,
            arguments: Some(vec![Argument::named("json")]),
        };
        return BodyMapResult {
            options: vec![opt],
            x_body: Some(XOpenApiBody {
                style: "json".to_string(),
                content_type: media_type,
                from: Some(format!("option:{name}")),
                properties: vec![],
            }),
        };
    }

    let object = resolved.object;
    let props_map = object
        .as_ref()
        .and_then(|o| o.get("properties"))
        .and_then(|p| p.as_object());
    let Some(props_map) = props_map else {
        return BodyMapResult {
            options: vec![],
            x_body: Some(XOpenApiBody {
                style: "json".to_string(),
                content_type: media_type,
                from: None,
                properties: vec![],
            }),
        };
    };

    let required_set: HashSet<&str> = object
        .as_ref()
        .and_then(|o| o.get("required"))
        .and_then(|r| r.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str()).collect())
        .unwrap_or_default();

    let mut opts: Vec<Opt> = Vec::new();
    let mut props: Vec<XOpenApiBodyProp> = Vec::new();

    for wire in js_object_keys(props_map) {
        // Skip dereferencer markers (__UNSAFE_refPath etc.).
        if wire.starts_with("__") {
            continue;
        }
        let prop_schema = props_map.get(wire);
        let name = unique_name(
            &flag_name(wire, options.flag_case.as_deref()),
            used_flag_names,
        );
        let required = required_set.contains(wire.as_str());

        let mut opt = Opt {
            name: name.clone(),
            required: if required { Some(true) } else { None },
            group: Some("body".to_string()),
            description: prop_schema
                .and_then(|s| s.get("description"))
                .and_then(|d| d.as_str())
                .filter(|d| !d.is_empty())
                .map(|d| d.to_string()),
            hidden: None,
            arguments: None,
        };
        if !is_boolean(prop_schema) {
            opt.arguments = Some(vec![value_argument(prop_schema)]);
        }
        opts.push(opt);

        let mut prop = XOpenApiBodyProp {
            name: wire.clone(),
            from: format!("option:{name}"),
            json_path: wire.clone(),
            encoding: encoding_for(prop_schema),
            required: None,
        };
        if required {
            prop.required = Some(true);
        }
        props.push(prop);
    }

    BodyMapResult {
        options: opts,
        x_body: Some(XOpenApiBody {
            style: if is_multipart { "multipart" } else { "flatten" }.to_string(),
            content_type: media_type,
            from: None,
            properties: props,
        }),
    }
}
