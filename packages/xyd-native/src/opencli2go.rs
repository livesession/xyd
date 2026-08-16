//! `@xyd-js/opencli2go` native surface (S6+ W7 wiring). Input is an OpenCLI
//! document (JSON, acyclic — marshals fine) + optional converter options;
//! output is the generated Go CLI project as a `path -> content` JSON object.

use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi(js_name = "opencli2go")]
pub fn opencli2go(spec_json: String, options_json: Option<String>) -> Result<String> {
    let spec: serde_json::Value = serde_json::from_str(&spec_json)
        .map_err(|e| Error::from_reason(format!("[xyd_opencli2go] bad spec: {e}")))?;
    let options: Option<xyd_opencli2go::Options> = match options_json.as_deref() {
        Some(s) => Some(
            serde_json::from_str(s)
                .map_err(|e| Error::from_reason(format!("[xyd_opencli2go] bad options: {e}")))?,
        ),
        None => None,
    };
    let files = xyd_opencli2go::opencli2go(&spec, options);
    serde_json::to_string(&files)
        .map_err(|e| Error::from_reason(format!("[xyd_opencli2go] serialize: {e}")))
}
