//! Typed OpenSDK IR structs — serde mirrors of the shapes
//! `@xyd-js/opensdk-core` types.ts declares and openapi2opensdk emits.
//! Conditional-field emission (JS only sets keys when truthy/present) maps to
//! `Option` + `skip_serializing_if`; open JSON values stay `serde_json::Value`.

use serde::Serialize;
use serde_json::{Map, Value};

#[derive(Serialize, Clone)]
pub struct Spec {
    pub opensdk: String,
    pub info: Info,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub servers: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub security: Option<Vec<Security>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub types: Option<Vec<NamedType>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resources: Option<Vec<Resource>>,
    /// Always stamped: the merged runtime-behavior contract.
    pub sdk: Value,
}

#[derive(Serialize, Clone)]
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

#[derive(Serialize, Clone)]
pub struct Security {
    #[serde(rename = "type")]
    pub scheme_type: Value,
    pub kind: String,
    #[serde(rename = "schemeName", skip_serializing_if = "Option::is_none")]
    pub scheme_name: Option<String>,
    #[serde(rename = "envVar", skip_serializing_if = "Option::is_none")]
    pub env_var: Option<String>,
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
pub struct TypeRef {
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scalar: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<String>,
    #[serde(rename = "const", skip_serializing_if = "Option::is_none")]
    pub konst: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub items: Option<Box<TypeRef>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub values: Option<Box<TypeRef>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nullable: Option<bool>,
}

impl TypeRef {
    pub fn of_kind(kind: &str) -> Self {
        TypeRef {
            kind: kind.to_string(),
            name: None,
            scalar: None,
            format: None,
            konst: None,
            items: None,
            values: None,
            nullable: None,
        }
    }

    pub fn any() -> Self {
        Self::of_kind("any")
    }

    pub fn reference(name: String) -> Self {
        let mut r = Self::of_kind("ref");
        r.name = Some(name);
        r
    }
}

#[derive(Serialize, Clone)]
pub struct EnumValue {
    pub value: Value,
}

#[derive(Serialize, Clone)]
pub struct Field {
    pub name: String,
    #[serde(rename = "type")]
    pub field_type: TypeRef,
    pub required: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nullable: Option<bool>,
    #[serde(rename = "readOnly", skip_serializing_if = "Option::is_none")]
    pub read_only: Option<bool>,
    #[serde(rename = "writeOnly", skip_serializing_if = "Option::is_none")]
    pub write_only: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deprecated: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct Discriminator {
    #[serde(rename = "propertyName")]
    pub property_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mapping: Option<Map<String, Value>>,
}

/// One named type in the symbol table. `kind` discriminates
/// struct | enum | union | alias; the body fields are kind-specific.
#[derive(Serialize, Clone)]
pub struct NamedType {
    pub name: String,
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub values: Option<Vec<EnumValue>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub semantics: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variants: Option<Vec<TypeRef>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub discriminator: Option<Discriminator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fields: Option<Vec<Field>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub of: Option<TypeRef>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

impl NamedType {
    pub fn placeholder(name: String) -> Self {
        NamedType {
            name,
            kind: "struct".to_string(),
            base: None,
            values: None,
            semantics: None,
            variants: None,
            discriminator: None,
            fields: None,
            of: None,
            description: None,
        }
    }
}

#[derive(Serialize, Clone)]
pub struct Param {
    pub name: String,
    #[serde(rename = "type")]
    pub param_type: TypeRef,
    pub required: bool,
    #[serde(rename = "wireName", skip_serializing_if = "Option::is_none")]
    pub wire_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub example: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deprecated: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub explode: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<Value>,
}

#[derive(Serialize, Clone)]
pub struct RequestBody {
    #[serde(rename = "contentType")]
    pub content_type: String,
    #[serde(rename = "type")]
    pub body_type: TypeRef,
    pub required: bool,
    pub encoding: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct Response {
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "contentType", skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub response_type: Option<TypeRef>,
}

#[derive(Serialize, Clone)]
pub struct Pagination {
    pub style: String,
    #[serde(rename = "itemsField")]
    pub items_field: String,
    #[serde(rename = "nextField", skip_serializing_if = "Option::is_none")]
    pub next_field: Option<String>,
    #[serde(rename = "offsetParam", skip_serializing_if = "Option::is_none")]
    pub offset_param: Option<String>,
    #[serde(rename = "itemType", skip_serializing_if = "Option::is_none")]
    pub item_type: Option<TypeRef>,
    #[serde(rename = "cursorParam", skip_serializing_if = "Option::is_none")]
    pub cursor_param: Option<String>,
    #[serde(rename = "limitParam", skip_serializing_if = "Option::is_none")]
    pub limit_param: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct Method {
    pub action: String,
    #[serde(rename = "httpMethod")]
    pub http_method: String,
    pub path: String,
    #[serde(rename = "operationId", skip_serializing_if = "Option::is_none")]
    pub operation_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deprecated: Option<bool>,
    #[serde(
        rename = "injectIdempotencyKey",
        skip_serializing_if = "Option::is_none"
    )]
    pub inject_idempotency_key: Option<bool>,
    #[serde(rename = "pathParams", skip_serializing_if = "Option::is_none")]
    pub path_params: Option<Vec<Param>>,
    #[serde(rename = "queryParams", skip_serializing_if = "Option::is_none")]
    pub query_params: Option<Vec<Param>>,
    #[serde(rename = "headerParams", skip_serializing_if = "Option::is_none")]
    pub header_params: Option<Vec<Param>>,
    #[serde(rename = "requestBody", skip_serializing_if = "Option::is_none")]
    pub request_body: Option<RequestBody>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub responses: Option<Vec<Response>>,
    #[serde(rename = "primaryResponse", skip_serializing_if = "Option::is_none")]
    pub primary_response: Option<TypeRef>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pagination: Option<Pagination>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub security: Option<Vec<Security>>,
}

#[derive(Serialize, Clone)]
pub struct Resource {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub methods: Option<Vec<Method>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resources: Option<Vec<Resource>>,
}
