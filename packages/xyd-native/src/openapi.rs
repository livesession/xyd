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
