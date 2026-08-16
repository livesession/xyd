//! `@xyd-js/openapi` endpoint-snippet native surface. JSON-string transport:
//! `{ spec, path, method, values, lang }` in → the request code sample string
//! out. Delegates to `crates/xyd_oas_snippet` (the Rust port of
//! `@readme/oas-to-snippet` + the four httpsnippet clients xyd emits). The shim
//! (`packages/xyd-openapi/src/impl-js/converters/oas-examples.ts`) calls this
//! per (operation, language) and falls back to the JS `oasToSnippet` when the
//! native core is absent.

use napi::bindgen_prelude::*;
use napi_derive::napi;

/// Parity target: `oasToSnippet(oas, operation, values, null, lang).code` for
/// the four xyd languages (shell / javascript / python / go). `input_json`:
/// `{ spec, path, method, values, lang }` where `spec` is the (dereferenced)
/// OpenAPI slice for the operation.
#[napi]
pub fn oas_to_snippet(input_json: String) -> Result<String> {
    let input: serde_json::Value = serde_json::from_str(&input_json)
        .map_err(|e| Error::from_reason(format!("[xyd_oas_snippet] bad input: {e}")))?;

    let spec = input
        .get("spec")
        .cloned()
        .unwrap_or(serde_json::Value::Null);
    let values = input
        .get("values")
        .cloned()
        .unwrap_or(serde_json::Value::Null);
    let str_of = |k: &str| -> String {
        input
            .get(k)
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string()
    };

    let snippet = xyd_oas_snippet::oas_to_snippet(
        &spec,
        &str_of("path"),
        &str_of("method"),
        &values,
        &str_of("lang"),
    );
    Ok(snippet.code)
}
