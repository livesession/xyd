//! The emitter descriptor — plain data, no behaviour.
//!
//! Deliberately NOT a `trait Emitter` mirroring the six TypeScript capability
//! methods. In TS those methods exist because the orchestrator interleaves
//! shared logic between them; in Rust that decomposition was never built — each
//! `generate_<lang>` is one function that inlines the interleave, and the
//! capability boundaries survive only as comments. Implementing the trait would
//! mean splitting seven 90–300-line functions into six methods each: 42 chances
//! to move a byte against ~2,300 golden files, for no benefit, since the only
//! consumer (the napi `opensdk_surface!` macro) wants the whole map anyway.
//!
//! What IS here is the minimum A2 needs: a shared home for the docs-capability
//! return types, and optional function slots so A2 can land language by
//! language.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// One language-rendered field row of an SDK type.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedTypeField {
    /// Language field name (Go PascalCase, Python snake_case, ...).
    pub name: String,
    /// Language type string (Go `param.Opt[string]`, TS `string | null`, ...).
    pub lang_type: String,
    pub required: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deprecated: Option<bool>,
    /// When the field type is a named type: the ORIGINAL IR schema name, for a
    /// cross-type link.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ref_type_name: Option<String>,
}

/// One SDK type (request params / a response struct) as rendered field rows.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedTypeGroup {
    /// Synthesized params-type NAME where the language has one (Go/Node/Java);
    /// `None` for languages that flatten params (Python/Ruby/.NET).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub type_name: Option<String>,
    /// The method-argument name the params type is passed as
    /// (`body`/`query`/`params`). `None` when the language flattens.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub arg_name: Option<String>,
    pub fields: Vec<RenderedTypeField>,
}

/// The response half of a type reference.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedTypeResponse {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub type_name: Option<String>,
    /// Struct field rows; absent for binary/scalar/open-union responses.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fields: Option<Vec<RenderedTypeField>>,
    /// Fallback display for a non-struct response (e.g. `[]Pet`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lang_type: Option<String>,
    /// A human note for non-field responses ("binary download (audio/mpeg)").
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

/// A per-operation TYPE reference, rendered in one language.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedTypeReference {
    /// e.g. `client.Audio.Transcriptions.New(ctx, body) (*Response, error)`.
    pub signature: String,
    pub request: RenderedTypeGroup,
    pub response: RenderedTypeResponse,
}

/// A language emitter as plain data.
///
/// `#[non_exhaustive]` with a `const fn new` so A2 can add slots without
/// breaking all 7 construction sites at once.
#[non_exhaustive]
pub struct EmitterFns {
    pub language: &'static str,
    /// The whole file map: `fn(&Value) -> BTreeMap<path, content>`. Every
    /// emitter already has exactly this signature.
    pub generate: fn(&Value) -> BTreeMap<String, String>,
    /// A2. `Option` is load-bearing, not defensive: the Rust TARGET implements
    /// neither docs capability (it is absent from `SDK_LANGS`), so a required
    /// slot would break its build on A2 day one.
    pub generate_usage: Option<fn(&Value, &[String]) -> String>,
    pub generate_type_reference: Option<fn(&Value, &[String]) -> RenderedTypeReference>,
}

impl EmitterFns {
    pub const fn new(
        language: &'static str,
        generate: fn(&Value) -> BTreeMap<String, String>,
    ) -> Self {
        Self {
            language,
            generate,
            generate_usage: None,
            generate_type_reference: None,
        }
    }
}

/// Canonical language id for a user-supplied name (port of `registry.ts`
/// `languageAliases`). Unknown names pass through lowercased.
pub fn resolve_language(name: &str) -> String {
    let lower = name.trim().to_ascii_lowercase();
    match lower.as_str() {
        "typescript" | "ts" | "js" | "javascript" => "node",
        "golang" => "go",
        "py" => "python",
        "rb" => "ruby",
        "rs" => "rust",
        "csharp" | "c#" | "cs" | ".net" | "dotnet" => "dotnet",
        _ => return lower,
    }
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aliases_resolve() {
        for (input, want) in [
            ("typescript", "node"),
            ("TS", "node"),
            ("js", "node"),
            ("golang", "go"),
            ("py", "python"),
            ("rb", "ruby"),
            ("rs", "rust"),
            ("C#", "dotnet"),
            (".net", "dotnet"),
            ("  Go  ", "go"),
            ("go", "go"),
            ("elixir", "elixir"),
        ] {
            assert_eq!(resolve_language(input), want, "resolve_language({input:?})");
        }
    }

    #[test]
    fn optional_docs_slots_default_to_none() {
        fn gen(_: &Value) -> BTreeMap<String, String> {
            BTreeMap::new()
        }
        let e = EmitterFns::new("go", gen);
        assert_eq!(e.language, "go");
        assert!(e.generate_usage.is_none());
        assert!(e.generate_type_reference.is_none());
    }
}
