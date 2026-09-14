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

/// An `emitterOptions` string, absent-safe.
///
/// The options bag is the TS `ctx.emitterOptions` verbatim, passed as JSON. An
/// absent bag (`Value::Null`) and an absent key behave identically, so every
/// call site reads `opt_str(o, "packageName").unwrap_or(derived)` and the
/// no-options path keeps its existing derived default.
///
/// An EMPTY string is treated as present, matching JS `??` semantics — only
/// `undefined`/`null` fall through to the default, and `""` is a real override.
pub fn opt_str<'a>(options: &'a Value, key: &str) -> Option<&'a str> {
    options.get(key).and_then(|v| v.as_str())
}

/// An `emitterOptions` boolean, absent-safe.
pub fn opt_bool(options: &Value, key: &str) -> Option<bool> {
    options.get(key).and_then(|v| v.as_bool())
}

/// Whether to emit the SDK's own test suite (`tests`, default ON).
///
/// Mirrors each TS emitter's `if (ctx.emitterOptions.tests === false) return []`:
/// ONLY an explicit `false` opts out, so a non-boolean value keeps tests on.
pub fn emit_tests(options: &Value) -> bool {
    opt_bool(options, "tests") != Some(false)
}

/// How `writeProject` treats a generated file that already exists on disk.
///
/// Mirrors the TS `WriteMode` union; `rename_all = "camelCase"` makes the wire
/// strings `"overwrite"` / `"skipIfExists"` / `"mergeJson"` exactly.
///
/// A second definition of this already exists in `xyd_opensdk_framework`, which
/// owns the write LIFECYCLE. It is not reused here on purpose: framework pulls
/// `regex` + `sha2`, and every emitter depends on this crate, so importing it
/// would drag both into the `@xyd-js/native` cdylib for all 7 languages.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WriteMode {
    /// Replace it (identical bytes are a no-op, so mtimes stay stable).
    Overwrite,
    /// User-owned scaffold (README, Cargo.toml): never clobber an existing file.
    SkipIfExists,
    /// Deep-merge the generated JSON INTO the existing file's JSON (existing
    /// user keys win; arrays replace as a unit).
    MergeJson,
}

/// One generated file on the wire: `{ content, writeMode? }`.
///
/// `write_mode` is `None` for the overwrite default and skipped on the wire, so
/// the payload matches the TS `GeneratedFileEntry` shape byte for byte — only
/// the handful of non-default entries carry the field.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedFile {
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub write_mode: Option<WriteMode>,
}

impl GeneratedFile {
    /// A plain overwrite file (the default for all but 7 paths across 5 langs).
    pub fn new(content: String) -> Self {
        Self {
            content,
            write_mode: None,
        }
    }

    pub fn with_mode(content: String, mode: WriteMode) -> Self {
        Self {
            content,
            write_mode: Some(mode),
        }
    }
}

/// The non-default write mode for one generated path, or `None` for the
/// overwrite default.
///
/// The COMPLETE contract is 7 entries across 5 languages (go and dotnet declare
/// none); it is validated against `write-modes.json`, captured from the
/// TypeScript emitters before any of this was ported.
///
/// Matching is exact rather than by basename: every one of these files is
/// top-level in every golden tree (verified across all fixtures), so a nested
/// `README.md` or `package.json` must NOT pick up a mode. Ruby is the one
/// dynamic case — its gemspec is named after the package (`petstore.gemspec`,
/// `wire_kitchen.gemspec`, …) — so it matches the extension at top level, which
/// is why a flat filename table would not have worked.
pub fn write_mode_for(language: &str, path: &str) -> Option<WriteMode> {
    let top_level = !path.contains('/');
    match (language, path) {
        ("node", "package.json") => Some(WriteMode::MergeJson),
        ("node", "tsconfig.json") | ("node", "README.md") => Some(WriteMode::SkipIfExists),
        ("python", "pyproject.toml") => Some(WriteMode::SkipIfExists),
        ("java", "pom.xml") => Some(WriteMode::SkipIfExists),
        ("rust", "Cargo.toml") => Some(WriteMode::SkipIfExists),
        ("ruby", p) if top_level && p.ends_with(".gemspec") => Some(WriteMode::SkipIfExists),
        _ => None,
    }
}

/// Pair a flat `path -> content` map with its language's write modes.
///
/// Emitters keep producing the flat map they always have, so no `generate_*`
/// internals change.
pub fn attach_write_modes(
    language: &str,
    files: BTreeMap<String, String>,
) -> BTreeMap<String, GeneratedFile> {
    files
        .into_iter()
        .map(|(path, content)| {
            let file = match write_mode_for(language, &path) {
                Some(m) => GeneratedFile::with_mode(content, m),
                None => GeneratedFile::new(content),
            };
            (path, file)
        })
        .collect()
}

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

/// One operation's docs payload, keyed by `"<httpmethod> <path>"`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationDocs {
    pub usage: String,
    pub type_reference: RenderedTypeReference,
}

/// Signature of the two docs capabilities.
///
/// `(spec, chain, method, options)`: the whole IR (the renderers need the symbol
/// table), the resource-name path root→owner, the method itself, and the
/// emitterOptions bag — `baseUrlEnv` is a docs-only option that redirects the
/// snippet's base URL.
pub type UsageFn = fn(&Value, &[String], &Value, &Value) -> String;
pub type TypeReferenceFn = fn(&Value, &[String], &Value, &Value) -> RenderedTypeReference;

/// A language emitter as plain data.
///
/// `#[non_exhaustive]` with a `const fn new` so slots can be added without
/// breaking all 7 construction sites at once.
#[non_exhaustive]
pub struct EmitterFns {
    pub language: &'static str,
    /// The whole file map: `fn(&Value) -> BTreeMap<path, content>`. Every
    /// emitter already has exactly this signature.
    pub generate: fn(&Value) -> BTreeMap<String, String>,
    /// `Option` is load-bearing, not defensive: the Rust TARGET implements
    /// neither docs capability (it is absent from `SDK_LANGS`), so a required
    /// slot would not compile for it.
    pub generate_usage: Option<UsageFn>,
    pub generate_type_reference: Option<TypeReferenceFn>,
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

    /// Attach the docs capabilities (const so the whole descriptor stays a
    /// `const` item at each emitter's definition site).
    pub const fn with_docs(mut self, usage: UsageFn, type_reference: TypeReferenceFn) -> Self {
        self.generate_usage = Some(usage);
        self.generate_type_reference = Some(type_reference);
        self
    }

    /// Every operation's docs, keyed the way the docs pipeline indexes them:
    /// `"<httpmethod-lowercase> <path>"` (mirrors `prepareFromIr`).
    ///
    /// BATCH by design. The docs pipeline needs one entry per operation per
    /// language — 242 × 6 for the OpenAI spec — so a per-operation FFI surface
    /// would mean ~1450 boundary crossings per build. One call per (language,
    /// spec) instead.
    ///
    /// `None` when this language has no docs capabilities (the Rust target).
    pub fn docs_map(
        &self,
        spec: &Value,
        options: &Value,
    ) -> Option<BTreeMap<String, OperationDocs>> {
        let (usage_fn, tr_fn) = (self.generate_usage?, self.generate_type_reference?);
        let mut out = BTreeMap::new();
        for (chain, method) in walk_methods(spec) {
            let (Some(http), Some(path)) = (
                method.get("httpMethod").and_then(|v| v.as_str()),
                method.get("path").and_then(|v| v.as_str()),
            ) else {
                continue;
            };
            out.insert(
                format!("{} {}", http.to_ascii_lowercase(), path),
                OperationDocs {
                    usage: usage_fn(spec, &chain, method, options),
                    type_reference: tr_fn(spec, &chain, method, options),
                },
            );
        }
        Some(out)
    }
}

/// Every method in the IR, paired with its resource-name path (root→owner).
///
/// Mirrors `spec.ts`'s `walkMethods`: pre-order, a resource's own methods before
/// its children's. Operates on the raw `Value` so it works for the five emitters
/// that never deserialize the IR into typed structs.
pub fn walk_methods(spec: &Value) -> Vec<(Vec<String>, &Value)> {
    fn visit<'a>(
        resources: Option<&'a Value>,
        parent: &[String],
        out: &mut Vec<(Vec<String>, &'a Value)>,
    ) {
        let Some(arr) = resources.and_then(|r| r.as_array()) else {
            return;
        };
        for resource in arr {
            let Some(name) = resource.get("name").and_then(|n| n.as_str()) else {
                continue;
            };
            let mut chain = parent.to_vec();
            chain.push(name.to_string());
            if let Some(methods) = resource.get("methods").and_then(|m| m.as_array()) {
                for method in methods {
                    out.push((chain.clone(), method));
                }
            }
            visit(resource.get("resources"), &chain, out);
        }
    }
    let mut out = Vec::new();
    visit(spec.get("resources"), &[], &mut out);
    out
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
    fn options_are_absent_safe_and_match_js_fallback_semantics() {
        let none = Value::Null;
        assert_eq!(opt_str(&none, "packageName"), None);
        assert_eq!(opt_bool(&none, "tests"), None);
        assert!(emit_tests(&none), "no options must keep tests ON");

        let o = serde_json::json!({ "packageName": "acme", "empty": "", "tests": false });
        assert_eq!(opt_str(&o, "packageName"), Some("acme"));
        assert_eq!(opt_str(&o, "missing"), None);
        // "" is a real override, not a fallthrough — matches JS `??`.
        assert_eq!(opt_str(&o, "empty"), Some(""));
        assert!(!emit_tests(&o));

        // Only an explicit `false` opts out of tests.
        assert!(emit_tests(&serde_json::json!({ "tests": true })));
        assert!(emit_tests(&serde_json::json!({ "tests": "no" })));
        assert!(emit_tests(&serde_json::json!({})));
    }

    #[test]
    fn write_mode_table_matches_the_contract() {
        use WriteMode::*;
        // The complete non-default set, mirroring write-modes.json.
        assert_eq!(write_mode_for("node", "package.json"), Some(MergeJson));
        assert_eq!(write_mode_for("node", "tsconfig.json"), Some(SkipIfExists));
        assert_eq!(write_mode_for("node", "README.md"), Some(SkipIfExists));
        assert_eq!(
            write_mode_for("python", "pyproject.toml"),
            Some(SkipIfExists)
        );
        assert_eq!(write_mode_for("java", "pom.xml"), Some(SkipIfExists));
        assert_eq!(write_mode_for("rust", "Cargo.toml"), Some(SkipIfExists));
        // Ruby's is named after the package — the reason this is not a flat table.
        assert_eq!(
            write_mode_for("ruby", "petstore.gemspec"),
            Some(SkipIfExists)
        );
        assert_eq!(
            write_mode_for("ruby", "wire_kitchen.gemspec"),
            Some(SkipIfExists)
        );
        // go and dotnet declare none.
        assert_eq!(write_mode_for("go", "go.mod"), None);
        assert_eq!(write_mode_for("dotnet", "Acme.csproj"), None);
        // Cross-language leakage: each rule is scoped to its own emitter.
        assert_eq!(write_mode_for("go", "package.json"), None);
        assert_eq!(write_mode_for("python", "Cargo.toml"), None);
        // Nested files must NOT pick up a mode.
        assert_eq!(write_mode_for("node", "src/package.json"), None);
        assert_eq!(write_mode_for("ruby", "lib/nested.gemspec"), None);
    }

    #[test]
    fn only_non_default_modes_reach_the_wire() {
        let files = BTreeMap::from([
            ("package.json".to_string(), "{}".to_string()),
            ("src/index.ts".to_string(), "export {}".to_string()),
        ]);
        let out = attach_write_modes("node", files);
        assert_eq!(out["package.json"].write_mode, Some(WriteMode::MergeJson));
        assert_eq!(out["src/index.ts"].write_mode, None);
        // `writeMode` is skipped for the default, so the payload stays the shape
        // the TS `GeneratedFileEntry` already had.
        let json = serde_json::to_string(&out).unwrap();
        assert!(json.contains(r#""writeMode":"mergeJson""#), "{json}");
        assert_eq!(json.matches("writeMode").count(), 1, "{json}");
    }

    #[test]
    fn walk_methods_is_pre_order_and_carries_the_chain() {
        let spec = serde_json::json!({
            "resources": [{
                "name": "admin",
                "methods": [{ "httpMethod": "GET", "path": "/admin" }],
                "resources": [{
                    "name": "keys",
                    "methods": [
                        { "httpMethod": "POST", "path": "/admin/keys" },
                        { "httpMethod": "DELETE", "path": "/admin/keys/{id}" }
                    ]
                }]
            }]
        });
        let walked: Vec<(Vec<String>, &str)> = walk_methods(&spec)
            .into_iter()
            .map(|(c, m)| (c, m["path"].as_str().unwrap()))
            .collect();
        // A resource's OWN methods come before its children's.
        assert_eq!(
            walked,
            vec![
                (vec!["admin".to_string()], "/admin"),
                (vec!["admin".to_string(), "keys".to_string()], "/admin/keys"),
                (
                    vec!["admin".to_string(), "keys".to_string()],
                    "/admin/keys/{id}"
                ),
            ]
        );
    }

    #[test]
    fn docs_map_is_none_without_the_capabilities_and_keys_by_method_and_path() {
        fn gen(_: &Value) -> BTreeMap<String, String> {
            BTreeMap::new()
        }
        let spec = serde_json::json!({
            "resources": [{ "name": "pets", "methods": [{ "httpMethod": "GET", "path": "/pets" }] }]
        });

        // The Rust target has neither capability.
        assert!(EmitterFns::new("rust", gen)
            .docs_map(&spec, &Value::Null)
            .is_none());

        fn usage(_: &Value, chain: &[String], _: &Value, _: &Value) -> String {
            format!("usage:{}", chain.join("."))
        }
        fn tr(_: &Value, _: &[String], _: &Value, _: &Value) -> RenderedTypeReference {
            RenderedTypeReference {
                signature: "sig".into(),
                request: RenderedTypeGroup {
                    type_name: None,
                    arg_name: None,
                    fields: vec![],
                },
                response: RenderedTypeResponse {
                    type_name: None,
                    fields: None,
                    lang_type: None,
                    note: None,
                },
            }
        }
        let map = EmitterFns::new("go", gen)
            .with_docs(usage, tr)
            .docs_map(&spec, &Value::Null)
            .unwrap();
        // The key is exactly what prepareFromIr indexes by.
        assert_eq!(map["get /pets"].usage, "usage:pets");
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
