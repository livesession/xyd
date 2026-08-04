//! `@xyd-js/uniform` native surface (S6+ W3): the portable runtime pieces —
//! the input-JSON-Schema converter and the built-in plugin cores. The plugin
//! closure wrappers, executor and inspection Proxy layer stay JS.

use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde_json::Value;

/// `uniformToInputJsonSchema(reference)` — JSON in, JSON out ("null" when JS
/// returns null).
#[napi]
pub fn uniform_to_input_json_schema(reference_json: String) -> Result<String> {
    let reference: Value = serde_json::from_str(&reference_json)
        .map_err(|e| Error::from_reason(format!("[xyd_uniform] bad reference: {e}")))?;
    let out = xyd_uniform::converters::uniform_to_input_json_schema(&reference)
        .unwrap_or(Value::Null);
    serde_json::to_string(&out)
        .map_err(|e| Error::from_reason(format!("[xyd_uniform] serialize: {e}")))
}

/// pluginJsonView core: Reference[] JSON → string[] JSON.
#[napi]
pub fn plugin_json_view(references_json: String) -> Result<String> {
    let references: Vec<Value> = serde_json::from_str(&references_json)
        .map_err(|e| Error::from_reason(format!("[xyd_uniform] bad references: {e}")))?;
    let views = xyd_uniform::plugins::plugin_json_view(&references);
    serde_json::to_string(&views)
        .map_err(|e| Error::from_reason(format!("[xyd_uniform] serialize: {e}")))
}

/// pluginNavigation core: `{settings, urlPrefix, references}` JSON →
/// `{pageFrontMatter, sidebar}` JSON.
#[napi]
pub fn plugin_navigation(input_json: String) -> Result<String> {
    let input: Value = serde_json::from_str(&input_json)
        .map_err(|e| Error::from_reason(format!("[xyd_uniform] bad input: {e}")))?;
    let settings = input.get("settings").cloned().unwrap_or(Value::Null);
    let url_prefix = input
        .get("urlPrefix")
        .and_then(|u| u.as_str())
        .unwrap_or("");
    let references: Vec<Value> = input
        .get("references")
        .and_then(|r| r.as_array())
        .cloned()
        .unwrap_or_default();

    let out = xyd_uniform::plugins::plugin_navigation(&settings, url_prefix, &references)
        .map_err(|e| Error::from_reason(format!("[xyd_uniform] {e}")))?;

    let result = serde_json::json!({
        "pageFrontMatter": out.page_front_matter,
        "sidebar": out.sidebar,
    });
    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("[xyd_uniform] serialize: {e}")))
}
