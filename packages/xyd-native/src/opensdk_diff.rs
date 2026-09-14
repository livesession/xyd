//! `diffIR` native surface — an IR-to-IR breaking-change diff.
//!
//! JSON-string transport both ways: two OpenSDK IR documents in, an `IrDiff`
//! (`{ changes: [{ kind, severity, ... }] }`) out. The IRs are acyclic, so the
//! caller just stringifies them across.
//!
//! Consumed by apitoolchain's release pipeline, which classifies the changes into a
//! semver bump + changelog. `xyd_opensdk_diff` depends only on serde/serde_json, so
//! adding it here satisfies the napi-crate dependency RULE in crates/Cargo.toml.

use napi::bindgen_prelude::*;
use napi_derive::napi;

/// Parity target: `diffIR(base, head)` from `@xyd-js/opensdk-core`.
///
/// `js_name` pins the exact export name — napi would otherwise lowercase the
/// trailing acronym to `diffIr`, and the TypeScript callers spell it `diffIR`.
#[napi(js_name = "diffIR")]
pub fn diff_ir(base_json: String, head_json: String) -> Result<String> {
    let base: serde_json::Value = serde_json::from_str(&base_json)
        .map_err(|e| Error::from_reason(format!("[xyd_opensdk_diff] bad base IR: {e}")))?;
    let head: serde_json::Value = serde_json::from_str(&head_json)
        .map_err(|e| Error::from_reason(format!("[xyd_opensdk_diff] bad head IR: {e}")))?;

    let diff = xyd_opensdk_diff::diff_ir(&base, &head);
    serde_json::to_string(&diff)
        .map_err(|e| Error::from_reason(format!("[xyd_opensdk_diff] serialize: {e}")))
}
