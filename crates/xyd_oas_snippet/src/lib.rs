//! Rust port of `@readme/oas-to-snippet@28.0.4` + the httpsnippet clients xyd
//! uses. Given a (dereferenced) OpenAPI spec, an operation `(path, method)`, a
//! `values` bag (the exact object `packages/xyd-openapi`'s `oas-examples.ts`
//! passes: params grouped by `in`, `body`/`formData`, and `server.selected`),
//! and a language, it produces the request code sample byte-for-byte identical
//! to the JS toolchain.
//!
//! Supported languages (the four xyd emits): `shell` (cURL), `javascript`
//! (fetch), `python` (requests), `go` (net/http). Any other language yields an
//! empty snippet (mirroring `oasToSnippet`'s "unsupported language" return).
//!
//! Pipeline: [`har::oas_to_har`] (oas → HAR) → [`prepare::prepare`]
//! (httpsnippet normalization) → a per-language client.

mod clients;
mod code_builder;
mod har;
mod jsutil;
mod mime;
mod prepare;
mod remove_undefined;
mod stringify_object;
mod style;

use serde_json::Value;

/// Result of a snippet conversion (mirrors `oasToSnippet`'s `{ code }`).
#[derive(Debug, Clone, Default)]
pub struct Snippet {
    pub code: String,
}

/// The languages xyd requests, each mapped to one httpsnippet client. Any other
/// value is unsupported and yields an empty snippet.
fn is_supported(lang: &str) -> bool {
    matches!(lang, "shell" | "javascript" | "python" | "go")
}

/// Port of `oasToSnippet(oas, operation, values, null, lang)` for the four xyd
/// languages. `spec` is the (dereferenced) OpenAPI document; `path`/`method`
/// identify the operation; `values` is the params/body/server bag.
pub fn oas_to_snippet(
    spec: &Value,
    path: &str,
    method: &str,
    values: &Value,
    lang: &str,
) -> Snippet {
    if !is_supported(lang) {
        return Snippet::default();
    }

    let method = method.to_lowercase();
    let har = har::oas_to_har(spec, path, &method, values);
    let prepared = prepare::prepare(&har);

    let code = match lang {
        "shell" => clients::curl(&prepared),
        "javascript" => clients::fetch(&prepared),
        "python" => clients::python(&prepared),
        "go" => clients::go(&prepared),
        _ => String::new(),
    };

    Snippet { code }
}
