//! Serde mirror of `packages/xyd-uniform/src/types.ts`. Field names and enum
//! string values are renamed to the EXACT JSON the TS side produces.

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// TS: `Reference<C, M, VM>` — the top-level unit: one API endpoint / schema /
/// GraphQL member / MCP tool.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Reference {
    pub title: String,
    /// TS: `string | React.ReactNode` — converters only ever emit strings;
    /// React trees are composed AFTER conversion and never cross this boundary.
    pub description: String,
    pub canonical: String,
    pub definitions: Vec<Definition>,
    pub examples: ExampleRoot,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<ReferenceCategory>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub reference_type: Option<ReferenceType>,
    /// Open union (`OpenAPIReferenceContext | GraphQLReferenceContext | …`) —
    /// converter crates build a typed context struct and serialize it in.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<Value>,
}

/// TS: `Definition` — a logical grouping ("Query parameters", "Request body",
/// "Response", "Arguments", …).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct Definition {
    pub title: String,
    pub properties: Vec<DefinitionProperty>,
    #[serde(rename = "rootProperty", skip_serializing_if = "Option::is_none")]
    pub root_property: Option<DefinitionProperty>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variants: Option<Vec<DefinitionVariant>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<Vec<Meta>>,
    #[serde(rename = "symbolDef", skip_serializing_if = "Option::is_none")]
    pub symbol_def: Option<SymbolDef>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    /// TS: `"return" | DefinitionTypeREST` (`$rest.param.path`, `$rest.param.query`,
    /// `$rest.param.header`, `$rest.param.cookie`, `$rest.request.body`).
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub definition_type: Option<String>,
}

/// TS: `DefinitionVariant` — alternative representations of a definition
/// (status codes, content types, SDK languages).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct DefinitionVariant {
    pub title: String,
    pub properties: Vec<DefinitionProperty>,
    #[serde(rename = "rootProperty", skip_serializing_if = "Option::is_none")]
    pub root_property: Option<DefinitionProperty>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "symbolDef", skip_serializing_if = "Option::is_none")]
    pub symbol_def: Option<SymbolDef>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<Vec<Meta>>,
}

/// TS: `Meta<T>` — `{ name, value? }` name/value metadata pairs.
///
/// `value` must round-trip an EXPLICIT `null` (the openai oracles contain
/// `"value": null`) while still omitting a missing key: `None` = key absent,
/// `Some(Value::Null)` = key present as null. Plain `Option<Value>` would
/// swallow null into `None` on deserialize — hence the custom deserializer.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Meta {
    pub name: String,
    #[serde(
        default,
        deserialize_with = "de_present_as_some",
        skip_serializing_if = "Option::is_none"
    )]
    pub value: Option<Value>,
}

/// Deserialize a PRESENT key as `Some(value)` even when the value is `null`
/// (missing keys hit `#[serde(default)]` = `None` instead).
fn de_present_as_some<'de, D>(d: D) -> Result<Option<Value>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    Ok(Some(Value::deserialize(d)?))
}

impl Meta {
    pub fn new(name: impl Into<String>, value: impl Into<Value>) -> Self {
        Meta {
            name: name.into(),
            value: Some(value.into()),
        }
    }
}

/// TS: `SymbolDef` — cross-reference identity; both fields are `string | string[]`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct SymbolDef {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<StrOrList>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub canonical: Option<StrOrList>,
}

/// `string | string[]` (untagged).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum StrOrList {
    One(String),
    Many(Vec<String>),
}

/// TS: `DefinitionProperty` — one property/parameter/field, recursively nested.
///
/// NOTE (parity reality vs TS declaration): the TS interface declares
/// `name`/`description` required, but the JS converters emit partial objects in
/// the wild (e.g. a variant `rootProperty` of just `{type, properties}` in the
/// openapi `8.enums` oracle) — so they are `Option` here, omitted when `None`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct DefinitionProperty {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    /// Plain type name, or one of the special `$$…` markers (see [`property_type`]).
    #[serde(rename = "type")]
    pub property_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub examples: Option<StrOrList>,
    #[serde(rename = "symbolDef", skip_serializing_if = "Option::is_none")]
    pub symbol_def: Option<SymbolDef>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<Vec<Meta>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub properties: Option<Vec<DefinitionProperty>>,
    #[serde(rename = "ofProperty", skip_serializing_if = "Option::is_none")]
    pub of_property: Option<Box<DefinitionProperty>>,
    /// Undeclared-in-TS but emitted in the wild: symbol-linking info attached by
    /// the converters — openapi emits a `SymbolDef` shape (`{id, canonical}`,
    /// oas-paths.ts:313), gql emits `{symbolId}`. Open `Value` since the shapes
    /// differ per producer.
    #[serde(rename = "typeDef", skip_serializing_if = "Option::is_none")]
    pub type_def: Option<Value>,
}

/// TS: `DEFINED_DEFINITION_PROPERTY_TYPE` — the special `type` markers.
pub mod property_type {
    pub const UNION: &str = "$$union";
    pub const XOR: &str = "$$xor";
    pub const ARRAY: &str = "$$array";
    pub const ENUM: &str = "$$enum";
    pub const FUNCTION: &str = "$$function";
}

// ---- examples ----

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct ExampleRoot {
    pub groups: Vec<ExampleGroup>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct ExampleGroup {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// `"request" | "response"`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub kind: Option<String>,
    pub examples: Vec<Example>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Example {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub codeblock: CodeBlock,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct CodeBlock {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    pub tabs: Vec<CodeBlockTab>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CodeBlockTab {
    pub title: String,
    pub code: String,
    pub language: String,
    /// `GraphQLExampleContext | OpenAPIExampleContext` (open).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub highlighted: Option<Value>,
}

// ---- category / type enums (exact TS string values) ----

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum ReferenceCategory {
    #[serde(rename = "components")]
    Components,
    #[serde(rename = "hooks")]
    Hooks,
    #[serde(rename = "rest")]
    Rest,
    #[serde(rename = "graphql")]
    Graphql,
    #[serde(rename = "mcp")]
    Mcp,
    #[serde(rename = "cli")]
    Cli,
    #[serde(rename = "functions")]
    Functions,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum ReferenceType {
    #[serde(rename = "component")]
    Component,
    #[serde(rename = "hook")]
    Hook,
    #[serde(rename = "rest_get")]
    RestHttpGet,
    #[serde(rename = "rest_post")]
    RestHttpPost,
    #[serde(rename = "rest_put")]
    RestHttpPut,
    #[serde(rename = "rest_patch")]
    RestHttpPatch,
    #[serde(rename = "rest_delete")]
    RestHttpDelete,
    #[serde(rename = "rest_options")]
    RestHttpOptions,
    #[serde(rename = "rest_head")]
    RestHttpHead,
    #[serde(rename = "rest_trace")]
    RestHttpTrace,
    #[serde(rename = "rest_component_schema")]
    RestComponentSchema,
    #[serde(rename = "graphql_query")]
    GraphqlQuery,
    #[serde(rename = "graphql_mutation")]
    GraphqlMutation,
    #[serde(rename = "graphql_subscription")]
    GraphqlSubscription,
    #[serde(rename = "graphql_scalar")]
    GraphqlScalar,
    #[serde(rename = "graphql_object")]
    GraphqlObject,
    #[serde(rename = "graphql_interface")]
    GraphqlInterface,
    #[serde(rename = "graphql_union")]
    GraphqlUnion,
    #[serde(rename = "graphql_enum")]
    GraphqlEnum,
    #[serde(rename = "graphql_input")]
    GraphqlInput,
    #[serde(rename = "mcp_tool")]
    McpTool,
    #[serde(rename = "mcp_resource")]
    McpResource,
    #[serde(rename = "function_js")]
    FunctionJs,
}

// ---- typed reference contexts (constructed by converter crates, serialized
// into Reference.context as Value) ----

/// TS: `GraphQLReferenceContext`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct GraphQLReferenceContext {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scopes: Option<Vec<String>>,
    #[serde(rename = "graphqlTypeShort")]
    pub graphql_type_short: String,
    #[serde(rename = "graphqlName")]
    pub graphql_name: String,
}

/// TS: `OpenAPIReferenceContext`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct OpenAPIReferenceContext {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scopes: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(rename = "fullPath", skip_serializing_if = "Option::is_none")]
    pub full_path: Option<String>,
    #[serde(rename = "componentSchema", skip_serializing_if = "Option::is_none")]
    pub component_schema: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub servers: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sdk: Option<Value>,
}

/// TS: `MCPReferenceContext`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct MCPReferenceContext {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scopes: Option<Vec<String>>,
    #[serde(rename = "serverUrl")]
    pub server_url: String,
    /// `"http" | "sse"`.
    pub transport: String,
    #[serde(rename = "toolName", skip_serializing_if = "Option::is_none")]
    pub tool_name: Option<String>,
    #[serde(rename = "resourceUri", skip_serializing_if = "Option::is_none")]
    pub resource_uri: Option<String>,
    #[serde(rename = "mimeType", skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
}
