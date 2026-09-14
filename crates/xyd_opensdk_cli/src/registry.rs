//! The built-in emitter registry.
//!
//! This table is the reason the crate exists at this layer. A `static EMITTERS`
//! inside `xyd_opensdk_core` would make core depend on all seven emitter
//! crates, each of which already depends on core — a cycle. The TypeScript has
//! the same constraint and solves it the same way: `registerBuiltinEmitters()`
//! lives in the CLI package, not in the framework.
//!
//! Unlike the TS registry there is no mutable global `Map`: the built-in set is
//! fixed at compile time because the one thing that could extend it —
//! `opensdk.config.mjs` shipping a custom `Emitter` — cannot be evaluated by a
//! Rust binary (see [`crate::config`]).

use serde_json::Value;
use std::collections::BTreeMap;

use xyd_opensdk_core::emitter::{resolve_language, EmitterFns, GeneratedFile};

use crate::error::{Error, Result};

/// A registered emitter: its descriptor plus the options-aware file-map entry
/// point.
///
/// `EmitterFns::generate` takes only the spec; `generate_<lang>_files` takes the
/// emitterOptions bag AND attaches the per-file write modes, which is what the
/// write lifecycle needs. Both are kept: the descriptor carries `language` and
/// the docs capabilities (used by `xsdk`), the fn pointer carries generation.
pub struct EmitterEntry {
    /// `EmitterFns` is `#[non_exhaustive]` and holds fn pointers, so it derives
    /// nothing; a hand-rolled `Debug` keeps `Result<&EmitterEntry, _>` usable.
    pub fns: &'static EmitterFns,
    pub generate_files: fn(&Value, &Value) -> BTreeMap<String, GeneratedFile>,
}

impl EmitterEntry {
    pub fn language(&self) -> &'static str {
        self.fns.language
    }
}

impl std::fmt::Debug for EmitterEntry {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("EmitterEntry")
            .field("language", &self.fns.language)
            .finish()
    }
}

/// The built-in emitters, in `registerBuiltinEmitters()` order — which is the
/// order the "Available: …" error message lists them in.
pub static EMITTERS: &[EmitterEntry] = &[
    EmitterEntry {
        fns: &xyd_opensdk_go::EMITTER,
        generate_files: xyd_opensdk_go::generate_go_files,
    },
    EmitterEntry {
        fns: &xyd_opensdk_python::EMITTER,
        generate_files: xyd_opensdk_python::generate_python_files,
    },
    EmitterEntry {
        fns: &xyd_opensdk_node::EMITTER,
        generate_files: xyd_opensdk_node::generate_node_files,
    },
    EmitterEntry {
        fns: &xyd_opensdk_ruby::EMITTER,
        generate_files: xyd_opensdk_ruby::generate_ruby_files,
    },
    EmitterEntry {
        fns: &xyd_opensdk_java::EMITTER,
        generate_files: xyd_opensdk_java::generate_java_files,
    },
    EmitterEntry {
        fns: &xyd_opensdk_dotnet::EMITTER,
        generate_files: xyd_opensdk_dotnet::generate_dotnet_files,
    },
    EmitterEntry {
        fns: &xyd_opensdk_rust::EMITTER,
        generate_files: xyd_opensdk_rust::generate_rust_files,
    },
];

/// Canonical language id for a user-supplied name (`typescript` → `node`).
///
/// Re-exported from core so the CLI and the emitters cannot drift apart on
/// aliasing — the routing of `go-cli`/`rust-cli` depends on unknown ids passing
/// through unchanged.
pub fn resolve_lang(name: &str) -> String {
    resolve_language(name)
}

/// Look up a built-in emitter by id or alias.
pub fn get_emitter(language: &str) -> Result<&'static EmitterEntry> {
    let canonical = resolve_lang(language);
    EMITTERS
        .iter()
        .find(|e| e.language() == canonical)
        .ok_or_else(|| {
            let available: Vec<&str> = EMITTERS.iter().map(|e| e.language()).collect();
            Error::msg(format!(
                "Unknown opensdk language: {language}. Available: {}",
                available.join(", ")
            ))
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_builtin_resolves_through_its_alias() {
        for (alias, want) in [
            ("typescript", "node"),
            ("TS", "node"),
            ("csharp", "dotnet"),
            ("py", "python"),
            ("golang", "go"),
            ("rb", "ruby"),
            ("rs", "rust"),
            ("java", "java"),
        ] {
            assert_eq!(get_emitter(alias).unwrap().language(), want, "{alias}");
        }
        assert_eq!(EMITTERS.len(), 7);
    }

    #[test]
    fn unknown_language_lists_the_available_set() {
        let err = get_emitter("cobol").unwrap_err();
        assert_eq!(
            err.0,
            "Unknown opensdk language: cobol. Available: go, python, node, ruby, java, dotnet, rust"
        );
    }

    #[test]
    fn cli_target_ids_are_unclaimed_by_the_alias_table() {
        // The go-cli/rust-cli routing relies on unknown ids passing through; a
        // future alias claiming them would silently break it.
        assert_eq!(resolve_lang("go-cli"), "go-cli");
        assert_eq!(resolve_lang("rust-cli"), "rust-cli");
    }
}
