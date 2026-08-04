//! `@xyd-js/openapi` native surface (S6+ W2). JSON-string transport: options in
//! as JSON, references out as JSON. The Rust side does its OWN read+deref+
//! convert from the spec FILE (no cyclic-doc marshalling); endpoint code
//! samples come back empty and the shim's JS post-pass fills them.

use napi::bindgen_prelude::*;
use napi_derive::napi;

/// Parity target: `oapSchemaToReferences(deferencedOpenAPI(path), options?)`
/// for LOCAL FILE specs (the shim keeps URL specs on the JS impl).
#[napi]
pub fn oap_schema_to_references_from_file(
    path: String,
    options_json: Option<String>,
) -> Result<String> {
    let options: Option<xyd_openapi::Options> = match options_json.as_deref() {
        Some(s) => Some(
            serde_json::from_str(s)
                .map_err(|e| Error::from_reason(format!("[xyd_openapi] bad options: {e}")))?,
        ),
        None => None,
    };

    let references = xyd_openapi::oap_schema_to_references_from_file(&path, options)
        .map_err(|e| Error::from_reason(format!("[xyd_openapi] {e}")))?;

    serde_json::to_string(&references)
        .map_err(|e| Error::from_reason(format!("[xyd_openapi] serialize: {e}")))
}

/// The FUSED uniform endpoint (S6+ W3 tail): spec source → sidebar +
/// pageFrontMatter + per-page {pagePath, region} in ONE call — conversion,
/// the x-docs sidebar plugin and pluginNavigation run natively; references
/// never materialize in JS. Input JSON:
/// `{source, urlPrefix, matchRoute, optionsUrlPrefix, store}`.
#[napi]
pub fn uniform_oas_pages(input_json: String) -> Result<String> {
    let input: serde_json::Value = serde_json::from_str(&input_json)
        .map_err(|e| Error::from_reason(format!("[xyd_openapi] bad fused input: {e}")))?;
    let str_of = |k: &str| -> String {
        input
            .get(k)
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string()
    };
    let fused = xyd_openapi::fused::uniform_oas_pages(&xyd_openapi::fused::FusedInput {
        source: str_of("source"),
        url_prefix: str_of("urlPrefix"),
        match_route: str_of("matchRoute"),
        options_url_prefix: str_of("optionsUrlPrefix"),
        store: input.get("store").and_then(|v| v.as_bool()).unwrap_or(false),
    })
    .map_err(|e| Error::from_reason(format!("[xyd_openapi] {e}")))?;

    let out = serde_json::json!({
        "urlPrefix": fused.url_prefix,
        "matchRoute": fused.match_route,
        "newRoutePushed": fused.new_route_pushed,
        "sidebar": fused.sidebar,
        "pageFrontMatter": fused.page_front_matter,
        "pages": fused.pages,
    });
    serde_json::to_string(&out)
        .map_err(|e| Error::from_reason(format!("[xyd_openapi] serialize: {e}")))
}
