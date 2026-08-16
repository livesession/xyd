//! Minimal typed view over the OpenSDK IR (`OpensdkSpecJson`) — only the fields
//! the Node generated-code emitter reads. Mirrors `@xyd-js/opensdk-core` types;
//! unknown fields are ignored so the crate stays forward-compatible with the IR.

use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Spec {
    pub info: Info,
    #[serde(default)]
    pub servers: Vec<String>,
    #[serde(default)]
    pub security: Vec<Security>,
    #[serde(default)]
    pub types: Vec<NamedType>,
    #[serde(default)]
    pub resources: Vec<Resource>,
    /// Declarative runtime behavior (only `errors` is read here).
    #[serde(default)]
    pub sdk: Option<SdkBehavior>,
}

#[derive(Debug, Deserialize)]
pub struct Info {
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub version: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub contact: Option<Contact>,
    #[serde(default)]
    pub license: Option<License>,
    #[serde(default)]
    pub homepage: Option<String>,
    #[serde(default)]
    pub repository: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Contact {
    #[serde(default)]
    pub name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct License {
    #[serde(default)]
    pub identifier: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Security {
    #[serde(default, rename = "envVar")]
    pub env_var: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct NamedType {
    pub name: String,
    pub kind: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub fields: Vec<Field>,
    #[serde(default)]
    pub values: Vec<EnumValue>,
    #[serde(default)]
    pub base: Option<String>,
    /// Alias target.
    #[serde(default, rename = "of")]
    pub of: Option<TypeRef>,
    /// Union variants.
    #[serde(default)]
    pub variants: Vec<TypeRef>,
    #[serde(default)]
    pub discriminator: Option<Discriminator>,
}

#[derive(Debug, Deserialize)]
pub struct Discriminator {
    #[serde(default, rename = "propertyName")]
    pub property_name: Option<String>,
    /// Insertion-ordered (serde_json `preserve_order`) so the decode `switch`
    /// matches the TS emitter's `Object.entries(mapping)` order.
    #[serde(default)]
    pub mapping: serde_json::Map<String, serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct EnumValue {
    pub value: serde_json::Value,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TypeRef {
    #[serde(default)]
    pub kind: Option<String>,
    #[serde(default)]
    pub scalar: Option<String>,
    #[serde(default)]
    pub format: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub items: Option<Box<TypeRef>>,
    #[serde(default)]
    pub values: Option<Box<TypeRef>>,
    #[serde(default, rename = "const")]
    pub const_val: Option<serde_json::Value>,
    #[serde(default)]
    pub nullable: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct Field {
    pub name: String,
    #[serde(rename = "type")]
    pub ty: TypeRef,
    /// Option so `required ? '' : '?'` (truthy) matches TS: only `Some(true)` is required.
    #[serde(default)]
    pub required: Option<bool>,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Resource {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub methods: Vec<Method>,
    #[serde(default)]
    pub resources: Vec<Resource>,
}

#[derive(Debug, Deserialize)]
pub struct Method {
    pub action: String,
    #[serde(rename = "httpMethod")]
    pub http_method: String,
    pub path: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default, rename = "pathParams")]
    pub path_params: Vec<Param>,
    #[serde(default, rename = "queryParams")]
    pub query_params: Vec<Param>,
    #[serde(default, rename = "headerParams")]
    pub header_params: Vec<Param>,
    #[serde(default, rename = "requestBody")]
    pub request_body: Option<RequestBody>,
    #[serde(default)]
    pub responses: Vec<Response>,
    #[serde(default, rename = "primaryResponse")]
    pub primary_response: Option<TypeRef>,
    #[serde(default)]
    pub pagination: Option<Pagination>,
    #[serde(default, rename = "injectIdempotencyKey")]
    pub inject_idempotency_key: bool,
}

#[derive(Debug, Deserialize)]
pub struct Param {
    pub name: String,
    #[serde(rename = "type")]
    pub ty: TypeRef,
    /// Option to distinguish `required === false` (skip guard) from undefined (truthy checks).
    #[serde(default)]
    pub required: Option<bool>,
    #[serde(default, rename = "wireName")]
    pub wire_name: Option<String>,
    #[serde(default)]
    pub explode: Option<bool>,
}

impl Param {
    /// TS truthy `p.required` — only an explicit `true` counts.
    pub fn required_truthy(&self) -> bool {
        self.required == Some(true)
    }
}

#[derive(Debug, Deserialize)]
pub struct RequestBody {
    #[serde(rename = "type")]
    pub ty: TypeRef,
    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub encoding: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Response {
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default, rename = "contentType")]
    pub content_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Pagination {
    #[serde(default)]
    pub style: Option<String>,
    #[serde(default, rename = "itemsField")]
    pub items_field: Option<String>,
    #[serde(default, rename = "itemType")]
    pub item_type: Option<TypeRef>,
    #[serde(default, rename = "offsetParam")]
    pub offset_param: Option<String>,
}

/// Only `errors` (index.ts class names) and `idempotency.autoGenerateForPost`
/// (the `idempotency: true` request flag) feed the generated code.
#[derive(Debug, Deserialize)]
pub struct SdkBehavior {
    #[serde(default)]
    pub errors: Option<ErrorsBehavior>,
    #[serde(default)]
    pub idempotency: Option<IdempotencyBehavior>,
}

#[derive(Debug, Deserialize)]
pub struct IdempotencyBehavior {
    #[serde(default, rename = "autoGenerateForPost")]
    pub auto_generate_for_post: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ErrorsBehavior {
    #[serde(default, rename = "statusCodeMap")]
    pub status_code_map: std::collections::BTreeMap<String, String>,
    #[serde(default, rename = "clientErrorKind")]
    pub client_error_kind: Option<String>,
    #[serde(default, rename = "serverErrorKind")]
    pub server_error_kind: Option<String>,
}

impl TypeRef {
    pub fn kind(&self) -> &str {
        self.kind.as_deref().unwrap_or("")
    }
}
