//! `@xyd-js/openapi2opensdk` native surface (S6+ W2 rider). JSON-string
//! transport both ways — the raw (un-dereferenced) OpenAPI document is
//! acyclic, so the shim just stringifies it across; the OpenSDK IR comes
//! back as JSON.

use napi::bindgen_prelude::*;
use napi_derive::napi;

/// Parity target: `openapi2opensdk(doc, options?)` on a RAW OpenAPI 3.x doc.
/// js_name pins the exact export name (napi would camelCase the digit
/// boundary into `openapi2Opensdk`).
#[napi(js_name = "openapi2opensdk")]
pub fn openapi2opensdk(doc_json: String, options_json: Option<String>) -> Result<String> {
    xyd_openapi2opensdk::openapi2opensdk_from_json_str(&doc_json, options_json.as_deref())
        .map_err(|e| Error::from_reason(format!("[xyd_openapi2opensdk] {e}")))
}
