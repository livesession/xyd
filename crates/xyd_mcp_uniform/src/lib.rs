//! MCP server surface → Uniform `Reference[]` — Rust port of
//! `@xyd-js/mcp-uniform` (S6+ W3 rider). The JSON-RPC transport, auth headers
//! and local-manifest file IO stay JS; this crate converts the already-fetched
//! `{tools, resources}` payload. JSON-Schema property conversion delegates to
//! `xyd_openapi::core::schema_object_to_property` — the same function the JS
//! impl borrows from `@xyd-js/openapi`.

use serde_json::{json, Map, Value};

use xyd_openapi::core::{schema_object_to_property, VisitedRefs};
use xyd_openapi::DocCtx;

/// The conversion input: what `mcpUrlToReferences` has in hand AFTER the
/// RPC/manifest step. `transport` is `"http" | "sse"`.
pub struct McpSurface<'a> {
    pub tools: &'a [Value],
    pub resources: &'a [Value],
    pub server_url: &'a str,
    pub transport: &'a str,
}

/// Convert an MCP surface into `Reference[]` (serialized as JSON values —
/// one per tool, then one per resource, mirroring the JS emit order).
pub fn mcp_to_references(surface: &McpSurface) -> Vec<Value> {
    let mut references: Vec<Value> = Vec::new();
    for tool in surface.tools {
        references.push(tool_to_reference(
            tool,
            surface.server_url,
            surface.transport,
        ));
    }
    for resource in surface.resources {
        references.push(resource_to_reference(
            resource,
            surface.server_url,
            surface.transport,
        ));
    }
    references
}

fn str_of<'v>(v: &'v Value, key: &str) -> Option<&'v str> {
    v.get(key).and_then(|s| s.as_str())
}

fn tool_to_reference(tool: &Value, server_url: &str, transport: &str) -> Value {
    let name = str_of(tool, "name").unwrap_or("");
    let canonical = slug(name);
    let properties = json_schema_properties_to_definition_properties(tool.get("inputSchema"));

    json!({
        "title": name,
        "description": str_of(tool, "description").unwrap_or(""),
        "canonical": canonical,
        "category": "mcp",
        "type": "mcp_tool",
        "context": {
            "serverUrl": server_url,
            "transport": transport,
            "toolName": name,
            // pluginNavigation reads context.group to organise the sidebar.
            "group": ["Tools"],
        },
        "definitions": [
            {
                "title": "Input",
                "properties": properties,
            }
        ],
        "examples": { "groups": [] },
    })
}

fn resource_to_reference(resource: &Value, server_url: &str, transport: &str) -> Value {
    // `resource.name || resource.uri` — truthiness (empty name falls through).
    let name = str_of(resource, "name").filter(|n| !n.is_empty());
    let uri = str_of(resource, "uri").unwrap_or("");
    let title = name.unwrap_or(uri);
    let canonical = slug(title);

    let mut props: Vec<Value> = vec![json!({
        "name": "uri",
        "type": "string",
        "description": format!("Resource URI `{uri}`."),
    })];
    if let Some(mime) = str_of(resource, "mimeType").filter(|m| !m.is_empty()) {
        props.push(json!({
            "name": "mimeType",
            "type": "string",
            "description": format!("MIME type `{mime}`."),
        }));
    }

    let mut context = Map::new();
    context.insert("serverUrl".into(), Value::String(server_url.into()));
    context.insert("transport".into(), Value::String(transport.into()));
    context.insert("resourceUri".into(), Value::String(uri.into()));
    // `mimeType: resource.mimeType` — undefined omits, present copies (even
    // empty string / null).
    if let Some(m) = resource.get("mimeType") {
        context.insert("mimeType".into(), m.clone());
    }
    context.insert("group".into(), json!(["Resources"]));

    json!({
        "title": title,
        "description": str_of(resource, "description").unwrap_or(""),
        "canonical": canonical,
        "category": "mcp",
        "type": "mcp_resource",
        "context": context,
        "definitions": [
            {
                "title": "Resource",
                "properties": props,
            }
        ],
        "examples": { "groups": [] },
    })
}

/// Walk `inputSchema.properties` and reuse the OpenAPI JSON-Schema converter
/// per property — mirrors `jsonSchemaPropertiesToDefinitionProperties`.
fn json_schema_properties_to_definition_properties(schema: Option<&Value>) -> Vec<Value> {
    let Some(schema) = schema else {
        return vec![];
    };
    let Some(props) = schema.get("properties").and_then(|p| p.as_object()) else {
        return vec![];
    };
    let required: std::collections::HashSet<&str> = match schema.get("required") {
        Some(Value::Array(arr)) => arr.iter().filter_map(|r| r.as_str()).collect(),
        _ => Default::default(),
    };

    let mut out: Vec<Value> = Vec::new();
    for name in xyd_uniform::jsrt::js_object_keys(props) {
        let prop_schema = &props[name];
        // A fresh stamp-free DocCtx per call — the MCP schemas are plain JSON
        // Schema (no $ref dereference bookkeeping), so resolve() is identity
        // and no visited/refPath machinery engages.
        let ctx = DocCtx::new(prop_schema);
        let mut visited: VisitedRefs = Default::default();
        if let Some(prop) = schema_object_to_property(
            &ctx,
            name,
            prop_schema,
            required.contains(name.as_str()),
            false,
            &mut visited,
            None,
        ) {
            out.push(serde_json::to_value(prop).expect("DefinitionProperty serializes"));
        }
    }
    out
}

/// `input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")`
fn slug(input: &str) -> String {
    let lowered = input.to_lowercase();
    let mut out = String::with_capacity(lowered.len());
    let mut last_dash = false;
    for c in lowered.chars() {
        if c.is_ascii_lowercase() || c.is_ascii_digit() {
            out.push(c);
            last_dash = false;
        } else if !last_dash {
            out.push('-');
            last_dash = true;
        }
    }
    out.trim_matches('-').to_string()
}
