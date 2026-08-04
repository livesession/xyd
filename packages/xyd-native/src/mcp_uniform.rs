//! `@xyd-js/mcp-uniform` native surface (S6+ W3 rider). The JS shim keeps the
//! JSON-RPC transport / auth / local-manifest IO and passes the fetched
//! surface here: `{tools, resources, serverUrl, transport}` → `Reference[]`.

use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde_json::Value;

#[napi]
pub fn mcp_to_references(surface_json: String) -> Result<String> {
    let input: Value = serde_json::from_str(&surface_json)
        .map_err(|e| Error::from_reason(format!("[xyd_mcp_uniform] bad surface: {e}")))?;
    let empty: Vec<Value> = Vec::new();
    let tools = input
        .get("tools")
        .and_then(|t| t.as_array())
        .unwrap_or(&empty);
    let resources = input
        .get("resources")
        .and_then(|r| r.as_array())
        .unwrap_or(&empty);
    let server_url = input
        .get("serverUrl")
        .and_then(|s| s.as_str())
        .unwrap_or("");
    let transport = input
        .get("transport")
        .and_then(|t| t.as_str())
        .unwrap_or("http");

    let refs = xyd_mcp_uniform::mcp_to_references(&xyd_mcp_uniform::McpSurface {
        tools,
        resources,
        server_url,
        transport,
    });
    serde_json::to_string(&refs)
        .map_err(|e| Error::from_reason(format!("[xyd_mcp_uniform] serialize: {e}")))
}
