//! OpenCLI output model — serde mirrors of the `@xyd-js/opencli` shapes
//! openapi2opencli emits. Conditional emission = `Option` + skip_serializing_if
//! (the JS only sets keys when truthy/present); open JSON stays Value.

use serde::Serialize;
use serde_json::{Map, Value};

#[derive(Serialize)]
pub struct Spec {
    pub opencli: String,
    pub info: Info,
    #[serde(rename = "x-openapi", skip_serializing_if = "Option::is_none")]
    pub x_openapi: Option<XOpenApiRoot>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub commands: Option<Vec<Command>>,
}

#[derive(Serialize)]
pub struct Info {
    pub title: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contact: Option<Map<String, Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub license: Option<Map<String, Value>>,
}

#[derive(Serialize)]
pub struct XOpenApiRoot {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub servers: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub security: Option<Vec<Security>>,
}

#[derive(Serialize, Clone)]
pub struct Security {
    #[serde(rename = "type")]
    pub scheme_type: Value,
    pub kind: String,
    #[serde(rename = "envVar")]
    pub env_var: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheme: Option<Value>,
    #[serde(rename = "bearerFormat", skip_serializing_if = "Option::is_none")]
    pub bearer_format: Option<Value>,
    #[serde(rename = "in", skip_serializing_if = "Option::is_none")]
    pub location: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<Value>,
}

#[derive(Serialize, Clone)]
pub struct Arity {
    pub minimum: u32,
}

#[derive(Serialize, Clone)]
pub struct Argument {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "acceptedValues", skip_serializing_if = "Option::is_none")]
    pub accepted_values: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub arity: Option<Arity>,
}

impl Argument {
    pub fn named(name: &str) -> Self {
        Argument {
            name: name.to_string(),
            required: None,
            description: None,
            accepted_values: None,
            arity: None,
        }
    }
}

#[derive(Serialize, Clone)]
pub struct Opt {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hidden: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub arguments: Option<Vec<Argument>>,
}

#[derive(Serialize, Clone)]
pub struct XOpenApiParam {
    #[serde(rename = "in")]
    pub location: String,
    pub name: String,
    pub from: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub explode: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct XOpenApiBodyProp {
    pub name: String,
    pub from: String,
    #[serde(rename = "jsonPath")]
    pub json_path: String,
    pub encoding: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
}

#[derive(Serialize, Clone)]
pub struct XOpenApiBody {
    pub style: String,
    #[serde(rename = "contentType")]
    pub content_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    pub properties: Vec<XOpenApiBodyProp>,
}

#[derive(Serialize, Clone)]
pub struct XOpenApiResponse {
    pub status: String,
    #[serde(rename = "contentType")]
    pub content_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub example: Value,
}

#[derive(Serialize, Clone, Default)]
pub struct XOpenApiCommand {
    pub method: String,
    pub path: String,
    #[serde(rename = "operationId", skip_serializing_if = "Option::is_none")]
    pub operation_id: Option<String>,
    #[serde(rename = "contentType", skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<Vec<XOpenApiParam>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<XOpenApiBody>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub responses: Option<Vec<XOpenApiResponse>>,
}

#[derive(Serialize, Clone, Default)]
pub struct Command {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aliases: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub arguments: Option<Vec<Argument>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<Vec<Opt>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub commands: Option<Vec<Command>>,
    #[serde(rename = "x-openapi", skip_serializing_if = "Option::is_none")]
    pub x_openapi: Option<XOpenApiCommand>,
}
