//! `opencliToReferences` native surface — an OpenCLI document to uniform
//! `Reference[]`.
//!
//! On the PAGE-COMPILE HOT PATH: `uniformProcessor.ts` and
//! `presets/cli/index.ts` call this for every CLI docs page.
//!
//! Takes the PARSED SPEC rather than a path, deliberately. The JS loader
//! (`loadOpencliSpec`) also fetches `http(s)` sources and resolves relative
//! paths against a caller-supplied cwd; moving that here would mean an HTTP
//! client in the cdylib and a second copy of the resolution rules. Passing the
//! parsed document costs one serialization of a SMALL object — real OpenCLI
//! docs measure 4–27 KB, unlike the multi-MB OpenAPI specs where the fused
//! path's take-a-path design earns its keep.

use napi::bindgen_prelude::*;
use napi_derive::napi;

use opencli_uniform::{opencli_to_references, OpencliToReferencesOptions};

/// `specJson` is the parsed OpenCLI document; `optionsJson` is
/// `{ regions?: string[], globalOptionsPerCommand?: boolean }`.
#[napi(js_name = "opencliToReferences")]
pub fn opencli_to_references_napi(
    spec_json: String,
    options_json: Option<String>,
) -> Result<String> {
    let spec: serde_json::Value = serde_json::from_str(&spec_json)
        .map_err(|e| Error::from_reason(format!("[opencli_uniform] bad spec: {e}")))?;

    let mut options = OpencliToReferencesOptions::default();
    if let Some(raw) = options_json {
        let parsed: serde_json::Value = serde_json::from_str(&raw)
            .map_err(|e| Error::from_reason(format!("[opencli_uniform] bad options: {e}")))?;
        options.regions = parsed.get("regions").and_then(|v| v.as_array()).map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect()
        });
        options.global_options_per_command = parsed
            .get("globalOptionsPerCommand")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
    }

    let refs = opencli_to_references(&spec, &options);
    serde_json::to_string(&refs)
        .map_err(|e| Error::from_reason(format!("[opencli_uniform] serialize: {e}")))
}
