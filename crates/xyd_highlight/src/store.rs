//! Embedded asset store — the compile-time-baked grammar/theme corpus and the
//! `language-data` alias table, plus lazy zstd decompression.
//!
//! `build.rs` generates the `GRAMMAR_STORE` / `THEME_STORE` / `LANG_DATA_JSON`
//! tables (from `assets/`, vendored by `scripts/vendor-assets.mjs`). Grammars
//! are stored zstd-compressed and decompressed on first use by the
//! [`crate::registry::Registry`]; themes are raw JSON; `lang-data.json` is the
//! ported `aliasOrIdToScope` + `scopeToLanguageData` maps from
//! `syntax0-highlight/src/language-data.ts`.
//!
//! This module owns ONLY the static tables + pure lookups; caching/parsing of
//! grammars lives in the registry.

use std::collections::HashMap;
use std::io::Read;
use std::sync::OnceLock;

use serde::Deserialize;

include!(concat!(env!("OUT_DIR"), "/store.rs"));

/// The compressed grammar bytes for a grammar id (e.g. `"javascript"`), or
/// `None` when the id is not embedded (e.g. trimmed by `core-langs`).
pub fn grammar_bytes(id: &str) -> Option<&'static [u8]> {
    GRAMMAR_STORE
        .iter()
        .find(|(k, _)| *k == id)
        .map(|(_, v)| *v)
}

/// The raw VS Code theme JSON for a theme name (e.g. `"github-dark"`).
pub fn theme_json(name: &str) -> Option<&'static str> {
    THEME_STORE
        .iter()
        .find(|(k, _)| *k == name)
        .map(|(_, v)| *v)
}

/// zstd-decompress an embedded grammar blob into JSON bytes.
pub fn decompress(bytes: &[u8]) -> Vec<u8> {
    let mut decoder = ruzstd::StreamingDecoder::new(bytes).expect("valid zstd grammar blob");
    let mut out = Vec::new();
    decoder
        .read_to_end(&mut out)
        .expect("decompress grammar blob");
    out
}

// ---------------------------------------------------------------------------
// language-data — alias/scope resolution ported from `language-data.ts`.
// ---------------------------------------------------------------------------

/// A `scopeToLanguageData` entry: the grammar file id + the scopes it embeds.
///
/// `embedded_scopes` is retained from the ported `language-data.ts` for fidelity
/// but is not consulted at resolution time — the registry derives the include
/// closure from the grammars' actual `include` strings (more precise than the
/// declared embeds, and it sidesteps the `markdown → source.toml` "declared but
/// not shipped" quirk noted in `grammars.ts`).
#[derive(Debug, Deserialize)]
pub struct LangEntry {
    pub id: String,
    #[serde(rename = "embeddedScopes", default)]
    #[allow(dead_code)]
    pub embedded_scopes: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct LangData {
    #[serde(rename = "aliasOrIdToScope")]
    alias_to_scope: HashMap<String, String>,
    #[serde(rename = "scopeToLanguageData")]
    scope_to_lang: HashMap<String, LangEntry>,
}

fn lang_data() -> &'static LangData {
    static DATA: OnceLock<LangData> = OnceLock::new();
    DATA.get_or_init(|| serde_json::from_str(LANG_DATA_JSON).expect("valid lang-data.json"))
}

/// `aliasOrIdToScope[alias]` — resolve a language alias/id to its scope name.
pub fn alias_to_scope(alias: &str) -> Option<&'static str> {
    lang_data().alias_to_scope.get(alias).map(String::as_str)
}

/// `scopeToLanguageData[scope]` — the grammar id + embedded scopes for a scope.
pub fn scope_lang(scope: &str) -> Option<&'static LangEntry> {
    lang_data().scope_to_lang.get(scope)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn embedded_grammar_and_theme_present() {
        // Assets are baked in — no external path needed.
        assert!(grammar_bytes("javascript").is_some());
        assert!(theme_json("github-dark").is_some());
        // Decompress + parse round-trips to the source.js scope.
        let bytes = decompress(grammar_bytes("javascript").unwrap());
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v[0]["scopeName"], "source.js");
    }

    #[test]
    fn lang_data_resolves() {
        assert_eq!(alias_to_scope("js"), Some("source.js"));
        assert_eq!(alias_to_scope("bash"), Some("source.shell"));
        assert_eq!(scope_lang("source.js").unwrap().id, "javascript");
        assert_eq!(scope_lang("text.html.basic").unwrap().id, "html");
    }
}
