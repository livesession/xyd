//! `@xyd-js/gql` native surface (S6+ W1). JSON-string transport: options in as
//! JSON, `{references, route}` envelope out as JSON (the shim `JSON.parse`s and
//! reattaches the non-serializable `__UNSAFE_route` thunk).

use napi::bindgen_prelude::*;
use napi_derive::napi;

/// Parity target: `gqlSchemaToReferences(schemaLocation, options?)`.
/// `sources` are file paths or raw SDL (the shim pre-fetches http(s) URLs —
/// no network in the native layer).
#[napi]
pub fn gql_schema_to_references(
    sources: Vec<String>,
    options_json: Option<String>,
) -> Result<String> {
    let options: Option<xyd_gql::Options> = match options_json.as_deref() {
        Some(s) => Some(
            serde_json::from_str(s)
                .map_err(|e| Error::from_reason(format!("[xyd_gql] bad options: {e}")))?,
        ),
        None => None,
    };

    let resolved: Vec<String> = sources.iter().map(|s| xyd_gql::resolve_source(s)).collect();

    let (references, route) = xyd_gql::gql_schema_to_references_full(&resolved, options)
        .map_err(|e| Error::from_reason(format!("[xyd_gql] {e}")))?;

    serde_json::to_string(&serde_json::json!({
        "references": references,
        "route": route,
    }))
    .map_err(|e| Error::from_reason(format!("[xyd_gql] serialize: {e}")))
}
