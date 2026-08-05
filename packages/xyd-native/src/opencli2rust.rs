//! `@xyd-js/opencli2rust` native surface (S6+ W7 wiring). Input is an OpenCLI
//! document (JSON) + optional options; output is the generated Rust CLI project
//! as an ORDERED JSON array of `{ path, content, writeMode }` — preserving the
//! framework `ProjectFileMap` shape (per-file writeMode: "overwrite" |
//! "skipIfExists"), which the JS shim reconstructs into a real ProjectFileMap.

use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi(js_name = "opencli2rust")]
pub fn opencli2rust(spec_json: String, options_json: Option<String>) -> Result<String> {
    let spec: serde_json::Value = serde_json::from_str(&spec_json)
        .map_err(|e| Error::from_reason(format!("[xyd_opencli2rust] bad spec: {e}")))?;
    let options: Option<xyd_opencli2rust::Options> = match options_json.as_deref() {
        Some(s) => Some(
            serde_json::from_str(s)
                .map_err(|e| Error::from_reason(format!("[xyd_opencli2rust] bad options: {e}")))?,
        ),
        None => None,
    };
    let file_map = xyd_opencli2rust::opencli2rust(&spec, options);
    let entries: Vec<serde_json::Value> = file_map
        .into_iter()
        .map(|(path, entry)| {
            let write_mode = match entry.write_mode {
                xyd_opencli2rust::WriteMode::Overwrite => "overwrite",
                xyd_opencli2rust::WriteMode::SkipIfExists => "skipIfExists",
            };
            serde_json::json!({
                "path": path,
                "content": entry.content,
                "writeMode": write_mode,
            })
        })
        .collect();
    serde_json::to_string(&entries)
        .map_err(|e| Error::from_reason(format!("[xyd_opencli2rust] serialize: {e}")))
}
