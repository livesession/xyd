//! `@xyd-js/openapi2opencli` native surface (S6+ W7). The JS input is the
//! CYCLIC dereferenced doc (can't be JSON-marshalled), so — like the openapi
//! shim — the native path re-reads + derefs from the SOURCE FILE (stashed on
//! the doc by the openapi shim's deferencedOpenAPI). Local-file specs only;
//! URL specs stay on the JS impl.

use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi(js_name = "openapi2opencliFromFile")]
pub fn openapi2opencli_from_file(path: String, options_json: Option<String>) -> Result<String> {
    let options: Option<xyd_openapi2opencli::Options> = match options_json.as_deref() {
        Some(s) => Some(
            serde_json::from_str(s)
                .map_err(|e| Error::from_reason(format!("[xyd_openapi2opencli] bad options: {e}")))?,
        ),
        None => None,
    };
    let spec = xyd_openapi2opencli::openapi2opencli_from_file(&path, options)
        .map_err(|e| Error::from_reason(format!("[xyd_openapi2opencli] {e}")))?;
    serde_json::to_string(&spec)
        .map_err(|e| Error::from_reason(format!("[xyd_openapi2opencli] serialize: {e}")))
}
