//! The four httpsnippet clients xyd emits: shell/cURL, javascript/fetch,
//! python/requests, go/native. Each `convert(&Prepared) -> String` reproduces
//! the upstream client byte-for-byte.

mod curl;
mod fetch;
mod go;
mod python;

pub use curl::convert as curl;
pub use fetch::convert as fetch;
pub use go::convert as go;
pub use python::convert as python;

use serde_json::Value;

/// `JSON.stringify(value)` (compact).
pub(crate) fn json_stringify(v: &Value) -> String {
    serde_json::to_string(v).unwrap_or_default()
}

/// `JSON.stringify(value, null, 2)` (pretty, 2-space indent).
pub(crate) fn json_stringify_pretty(v: &Value) -> String {
    serde_json::to_string_pretty(v).unwrap_or_default()
}

/// `String(value)` for a header-object value that may be a scalar or (on a
/// duplicated header name) an array.
pub(crate) fn header_string(v: &Value) -> String {
    crate::jsutil::js_string(v)
}
