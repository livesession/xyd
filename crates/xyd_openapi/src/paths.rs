//! Port of `oas-paths.ts` (+ the small converters `oas-parameters.ts`,
//! `oas-requestBody.ts`, `oas-responses.ts`).

use serde_json::Value;
use xyd_uniform::{
    property_type, Definition, DefinitionProperty, DefinitionVariant, Meta, Reference,
    ReferenceCategory, StrOrList, SymbolDef,
};

use crate::core::{
    schema_object_to_properties, schema_object_to_property, PropsResult, VisitedRefs,
};
use crate::doc::DocCtx;
use crate::util::{
    clean_path, encode_uri_component, http_method_to_reference_type, join_url_pathname, slug,
};

/// `oapPathToReference`.
pub fn oap_path_to_reference(
    ctx: &DocCtx,
    http_method: &str,
    endpoint_path: &str,
    oap_path: &Value,
) -> Option<Reference> {
    let m_type = http_method_to_reference_type(http_method)?;

    let oap_method = ctx.resolve(oap_path.get(http_method)?);
    if oap_method.is_null() {
        return None;
    }

    let tag = first_tag(oap_method);
    let group = vec![tag];

    let mut context = serde_json::Map::new();
    context.insert("method".into(), Value::String(http_method.to_string()));
    context.insert(
        "path".into(),
        Value::String(encode_uri_component(endpoint_path)),
    );
    context.insert(
        "group".into(),
        Value::Array(group.into_iter().map(Value::String).collect()),
    );

    // Path-level servers.
    if let Some(servers) = oap_path.get("servers").and_then(|s| s.as_array()) {
        if !servers.is_empty() {
            let urls: Vec<String> = servers
                .iter()
                .filter_map(|s| s.get("url").and_then(|u| u.as_str()).map(String::from))
                .collect();
            if let Some(default_url) = urls.first() {
                if let Some(full) = join_url_pathname(default_url, endpoint_path) {
                    context.insert("fullPath".into(), Value::String(full));
                }
            }
            context.insert(
                "servers".into(),
                Value::Array(urls.into_iter().map(Value::String).collect()),
            );
        }
    }

    let mut definitions: Vec<Definition> = Vec::new();

    // Parameters → per-`in` definitions.
    if let Some(parameters) = oap_method.get("parameters").and_then(|p| p.as_array()) {
        let parameters_map = parameters_to_properties(ctx, parameters);
        for (key, definition_properties) in parameters_map {
            let (title, definition_type) = match key.as_str() {
                "path" => ("Path parameters", "$rest.param.path"),
                "query" => ("Query parameters", "$rest.param.query"),
                "header" => ("Headers", "$rest.param.header"),
                "cookies" => ("Cookies", "$rest.param.cookie"),
                _ => continue, // TS logs an error and skips
            };
            definitions.push(Definition {
                title: title.to_string(),
                properties: definition_properties,
                definition_type: Some(definition_type.to_string()),
                ..Default::default()
            });
        }
    }

    // Request body + responses.
    if oap_method.get("requestBody").is_some() {
        definitions.push(request_definition(ctx, oap_method));
    }
    if oap_method.get("responses").is_some() {
        definitions.push(response_definition(ctx, oap_method));
    }

    let description = oap_method
        .get("description")
        .and_then(|d| d.as_str())
        .filter(|d| !d.is_empty())
        .or_else(|| oap_method.get("summary").and_then(|s| s.as_str()))
        .map(String::from);

    Some(Reference {
        title: title(oap_method, http_method, endpoint_path),
        canonical: canonical(oap_method, http_method, endpoint_path),
        description: description.unwrap_or_default(),
        reference_type: Some(m_type),
        category: Some(ReferenceCategory::Rest),
        context: Some(Value::Object(context)),
        examples: Default::default(),
        definitions,
    })
}

/// `oapParametersToDefinitionProperties` — grouped by `in`, insertion order.
fn parameters_to_properties(
    ctx: &DocCtx,
    parameters: &[Value],
) -> Vec<(String, Vec<DefinitionProperty>)> {
    let mut order: Vec<String> = Vec::new();
    let mut map: std::collections::HashMap<String, Vec<DefinitionProperty>> =
        std::collections::HashMap::new();

    for param in parameters {
        let param = ctx.resolve(param);
        let Some(in_key) = param.get("in").and_then(|i| i.as_str()) else {
            continue;
        };
        if !order.contains(&in_key.to_string()) {
            order.push(in_key.to_string());
        }
        let entry = map.entry(in_key.to_string()).or_default();

        let name = param.get("name").and_then(|n| n.as_str()).unwrap_or("");
        let schema = param.get("schema").map(|s| ctx.resolve(s));
        let required = param
            .get("required")
            .and_then(|r| r.as_bool())
            .unwrap_or(false);
        let array_of = schema
            .and_then(|s| s.get("type"))
            .and_then(|t| t.as_str())
            .map(|t| t == "array")
            .unwrap_or(false);

        let mut visited = VisitedRefs::new();
        let property = match schema {
            Some(s) => {
                schema_object_to_property(ctx, name, s, required, array_of, &mut visited, None)
            }
            None => schema_object_to_property(
                ctx,
                name,
                &Value::Null,
                required,
                array_of,
                &mut visited,
                None,
            ),
        };

        if let Some(mut property) = property {
            property.description = Some(
                param
                    .get("description")
                    .and_then(|d| d.as_str())
                    .unwrap_or("")
                    .to_string(),
            );
            entry.push(property);
        }
    }

    order
        .into_iter()
        .map(|k| {
            let v = map.remove(&k).unwrap_or_default();
            (k, v)
        })
        .collect()
}

/// `oapRequestOperationToUniformDefinition`.
fn request_definition(ctx: &DocCtx, oap_operation: &Value) -> Definition {
    let req_body = ctx.resolve(oap_operation.get("requestBody").unwrap_or(&Value::Null));
    let mut variants: Vec<DefinitionVariant> = Vec::new();

    if let Some(content) = req_body.get("content").and_then(|c| c.as_object()) {
        for (content_type, media) in content {
            let schema = media.get("schema").map(|s| ctx.resolve(s));

            let mut properties: Vec<DefinitionProperty> = Vec::new();
            let mut root_property: Option<DefinitionProperty> = None;
            match request_body_properties(ctx, req_body, content_type) {
                PropsResult::List(list) => properties = list,
                PropsResult::Single(single) => root_property = Some(*single),
                PropsResult::None => {}
            }

            let mut meta = vec![Meta::new("contentType", content_type.clone())];
            if let Some(s) = schema {
                if s.get("required").is_some() {
                    meta.push(Meta::new("required", "true"));
                }
            }

            variants.push(DefinitionVariant {
                title: content_type.clone(),
                description: Some(
                    schema
                        .and_then(|s| s.get("description"))
                        .and_then(|d| d.as_str())
                        .unwrap_or("")
                        .to_string(),
                ),
                properties,
                root_property,
                meta: Some(meta),
                symbol_def: schema.and_then(|s| definition_property_type_def(ctx, s)),
            });
        }
    }

    let mut meta: Vec<Meta> = Vec::new();
    if req_body
        .get("required")
        .map(|r| matches!(r, Value::Bool(true)))
        .unwrap_or(false)
    {
        meta.push(Meta::new("required", "true"));
    }

    Definition {
        title: "Request body".into(),
        variants: Some(variants),
        properties: vec![],
        meta: Some(meta),
        definition_type: Some("$rest.request.body".into()),
        ..Default::default()
    }
}

/// `oapRequestBodyToDefinitionProperties`.
fn request_body_properties(ctx: &DocCtx, req_body: &Value, content_type: &str) -> PropsResult {
    let Some(schema) = req_body
        .get("content")
        .and_then(|c| c.get(content_type))
        .and_then(|m| m.get("schema"))
    else {
        return PropsResult::None;
    };
    let schema = ctx.resolve(schema);
    if schema.is_null() {
        return PropsResult::None;
    }

    let has = |k: &str| schema.get(k).map(|v| !v.is_null()).unwrap_or(false);
    if has("allOf") || has("anyOf") || has("oneOf") {
        let mut visited = VisitedRefs::new();
        return schema_object_to_properties(ctx, schema, false, &mut visited);
    }

    let (schema_object, array) = match schema.get("type").and_then(|t| t.as_str()) {
        Some("object") => (Some(schema), false),
        Some("array") => (schema.get("items").map(|i| ctx.resolve(i)), true),
        _ => (None, false),
    };
    let Some(schema_object) = schema_object else {
        return PropsResult::None;
    };

    let mut visited = VisitedRefs::new();
    let properties = schema_object_to_properties(ctx, schema_object, false, &mut visited);
    if array {
        let list = match properties {
            PropsResult::List(l) => l,
            PropsResult::Single(s) => vec![*s],
            PropsResult::None => vec![],
        };
        return PropsResult::Single(Box::new(DefinitionProperty {
            property_type: property_type::ARRAY.to_string(),
            properties: Some(list),
            ..Default::default()
        }));
    }
    properties
}

/// `oapResponseOperationToUniformDefinition`.
pub fn response_definition(ctx: &DocCtx, oap_operation: &Value) -> Definition {
    let responses = ctx.resolve(oap_operation.get("responses").unwrap_or(&Value::Null));
    let mut variants: Vec<DefinitionVariant> = Vec::new();

    if let Some(map) = responses.as_object() {
        for code in crate::util::js_object_keys(map) {
            let response = ctx.resolve(&map[code]);
            let response_description = response
                .get("description")
                .and_then(|d| d.as_str())
                .map(String::from);

            let Some(content) = response.get("content").and_then(|c| c.as_object()) else {
                variants.push(DefinitionVariant {
                    title: code.clone(),
                    description: response_description,
                    properties: vec![],
                    meta: Some(vec![Meta::new("status", code.clone())]),
                    ..Default::default()
                });
                continue;
            };

            for (content_type, media) in content {
                let schema = media.get("schema").map(|s| ctx.resolve(s));

                let mut properties: Vec<DefinitionProperty> = Vec::new();
                let mut root_property: Option<DefinitionProperty> = None;
                let mut definition_description = String::new();

                if let Some(resp) = response_properties(ctx, responses, code, content_type) {
                    match resp.properties {
                        PropsResult::List(list) => properties = list,
                        PropsResult::Single(single) => root_property = Some(*single),
                        PropsResult::None => {}
                    }
                    if let Some(d) = resp.description {
                        definition_description = d;
                    }
                }

                variants.push(DefinitionVariant {
                    title: code.clone(),
                    description: response_description.clone(),
                    properties,
                    root_property,
                    meta: Some(vec![
                        Meta::new("status", code.clone()),
                        Meta::new("contentType", content_type.clone()),
                        Meta::new("definitionDescription", definition_description),
                    ]),
                    symbol_def: schema.and_then(|s| definition_property_type_def(ctx, s)),
                });
            }
        }
    }

    Definition {
        title: "Response".into(),
        definition_type: Some("return".into()),
        variants: Some(variants),
        properties: vec![],
        ..Default::default()
    }
}

struct ResponseProps {
    properties: PropsResult,
    description: Option<String>,
}

/// `oasResponseToDefinitionProperties`.
fn response_properties(
    ctx: &DocCtx,
    responses: &Value,
    code: &str,
    content_type: &str,
) -> Option<ResponseProps> {
    let response = ctx.resolve(responses.get(code)?);
    let content = response.get("content")?;
    let schema = content
        .get(content_type)
        .and_then(|m| m.get("schema"))
        .map(|s| ctx.resolve(s));

    let Some(mut schema_object) = schema.filter(|s| !s.is_null()) else {
        // No schema → a single empty descriptive property.
        return Some(ResponseProps {
            properties: PropsResult::List(vec![DefinitionProperty {
                description: Some(
                    response
                        .get("description")
                        .and_then(|d| d.as_str())
                        .unwrap_or("")
                        .to_string(),
                ),
                name: Some(String::new()),
                property_type: String::new(),
                ..Default::default()
            }]),
            description: None,
        });
    };

    let mut array = false;
    if schema_object.get("type").and_then(|t| t.as_str()) == Some("array") {
        if let Some(items) = schema_object.get("items") {
            schema_object = ctx.resolve(items);
            array = true;
        }
    }

    let mut visited = VisitedRefs::new();
    let properties = schema_object_to_properties(ctx, schema_object, true, &mut visited);

    let mut description = String::new();
    if let Some(all_of) = schema_object.get("allOf").and_then(|a| a.as_array()) {
        for item in all_of {
            let item = ctx.resolve(item);
            if let Some(d) = item.get("description").and_then(|d| d.as_str()) {
                description.push_str(d);
                description.push('\n');
            }
        }
    }

    if array {
        let list = match properties {
            PropsResult::List(l) => l,
            PropsResult::Single(s) => vec![*s],
            PropsResult::None => vec![],
        };
        return Some(ResponseProps {
            properties: PropsResult::Single(Box::new(DefinitionProperty {
                property_type: property_type::ARRAY.to_string(),
                properties: Some(list),
                ..Default::default()
            })),
            description: None,
        });
    }

    Some(ResponseProps {
        properties,
        description: Some(description),
    })
}

/// `definitionPropertyTypeDef` — the `__internal_getRefPath` symbol link.
pub fn definition_property_type_def(ctx: &DocCtx, schema: &Value) -> Option<SymbolDef> {
    let mut oas_schema = schema;
    if oas_schema.get("type").and_then(|t| t.as_str()) == Some("array") {
        oas_schema = ctx.resolve(oas_schema.get("items")?);
    }
    let paths = ctx.internal_ref_path(oas_schema)?;
    Some(SymbolDef {
        id: Some(StrOrList::Many(paths)),
        ..Default::default()
    })
}

fn first_tag(oap_method: &Value) -> String {
    oap_method
        .get("tags")
        .and_then(|t| t.as_array())
        .and_then(|a| a.first())
        .and_then(|t| t.as_str())
        .unwrap_or("")
        .to_string()
}

fn title(oap_method: &Value, http_method: &str, http_path: &str) -> String {
    let tit = oap_method
        .get("summary")
        .and_then(|s| s.as_str())
        .filter(|s| !s.is_empty())
        .or_else(|| {
            oap_method
                .get("operationId")
                .and_then(|o| o.as_str())
                .filter(|s| !s.is_empty())
        });
    if let Some(t) = tit {
        return t.to_string();
    }
    join_segments(http_method, &clean_path(http_path))
}

fn canonical(oap_method: &Value, http_method: &str, http_path: &str) -> String {
    let canon = oap_method
        .get("operationId")
        .and_then(|o| o.as_str())
        .filter(|s| !s.is_empty())
        .map(String::from)
        .unwrap_or_else(|| {
            slug(
                oap_method
                    .get("summary")
                    .and_then(|s| s.as_str())
                    .unwrap_or(""),
            )
        });
    if !canon.is_empty() {
        return canon;
    }
    join_segments(http_method, &clean_path(http_path))
}

/// Node `path.join(a, b)` for the title/canonical fallback.
fn join_segments(a: &str, b: &str) -> String {
    let b = b.trim_start_matches('/');
    format!("{a}/{b}")
}
