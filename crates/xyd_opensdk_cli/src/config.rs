//! `src/cli/config/**` — the normalized config every command consumes.
//!
//! # The one capability deliberately dropped
//!
//! The TypeScript has TWO config sources: `sdk.json` (declarative) and
//! `opensdk.config.{ts,js,mjs}` (a JS plugin bundle that can `export default {
//! emitters: [...] }` — a custom `Emitter` implemented in JavaScript). The
//! second one is `await import(configPath)`; a Rust binary has no JS engine, so
//! it CANNOT be supported.
//!
//! It is not silently ignored. When an `opensdk.config.*` would have been the
//! WINNING source, [`resolve_config`] fails with a message pointing at
//! `opensdk init --format json`. When an `sdk.json` is also present, sdk.json
//! wins (the TS precedence order is unchanged) and nothing is reported.
//!
//! Why this is safe: `sdk.json` already takes precedence in the TS,
//! `opensdk init` already defaults to `--format json`, and every in-repo
//! consumer and fixture uses `sdk.json`.

use std::path::Path;

use serde_json::{Map, Value};

use xyd_opensdk_config::{LanguageSection, PublishTarget, SdkJson};

use crate::error::{Error, Result};
use crate::paths;
use crate::registry::resolve_lang;

/// The `opensdk.config.*` filenames the TS tries, in order.
pub const CONFIG_NAMES: &[&str] = &[
    "opensdk.config.ts",
    "opensdk.config.js",
    "opensdk.config.mjs",
];

/// Extensions claimed by the (unsupported) JS plugin-bundle source.
pub const CONFIG_EXTS: &[&str] = &[".ts", ".js", ".mjs"];

/// Per-language target: output dir + optional per-language behavior/publish.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct ResolvedTarget {
    pub output: Option<String>,
    pub behavior: Option<Value>,
    pub publish: Option<PublishTarget>,
    /// Per-language override of the 3-way-merge regen mode.
    ///
    /// Read by `generate` (`target?.merge ?? opts.merge`) but never SET by the
    /// sdk.json source — a section's `merge` key falls into the emitter option
    /// bag. Kept so the shape matches the TS `ResolvedTarget` exactly.
    pub merge: Option<bool>,
}

/// Where a config came from (provenance, for precedence messages + tests).
#[derive(Debug, Clone, PartialEq)]
pub struct ConfigProvenance {
    pub kind: String,
    pub file_path: String,
}

/// The single normalized shape every command consumes.
///
/// `emitter_options` and `targets` are ORDERED association lists, not maps: the
/// multi-target `generate` iterates `Object.keys(config.emitterOptions)`, so
/// sdk.json's language-section order is the generation order.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct ResolvedConfig {
    pub spec: Option<String>,
    pub emitter_options: Vec<(String, Map<String, Value>)>,
    pub sdk_name: Option<String>,
    pub mount_rules: Option<Value>,
    pub operation_hints: Option<Value>,
    pub sdk: Option<Value>,
    pub publish: Option<PublishTarget>,
    pub merge: Option<bool>,
    pub targets: Vec<(String, ResolvedTarget)>,
    pub source: Option<ConfigProvenance>,
}

impl ResolvedConfig {
    /// A language's emitter option bag.
    pub fn emitter_options_for(&self, lang: &str) -> Option<&Map<String, Value>> {
        self.emitter_options
            .iter()
            .find(|(k, _)| k == lang)
            .map(|(_, v)| v)
    }

    /// A language's target block.
    pub fn target_for(&self, lang: &str) -> Option<&ResolvedTarget> {
        self.targets.iter().find(|(k, _)| k == lang).map(|(_, v)| v)
    }

    /// The declared languages, in file order.
    ///
    /// Mirrors `Object.keys(config.emitterOptions ?? config.targets ?? {})`:
    /// both fields are left UNSET when empty in the TS, so an empty
    /// `emitter_options` falls through to `targets`.
    pub fn declared_languages(&self) -> Vec<String> {
        if !self.emitter_options.is_empty() {
            return self
                .emitter_options
                .iter()
                .map(|(k, _)| k.clone())
                .collect();
        }
        self.targets.iter().map(|(k, _)| k.clone()).collect()
    }
}

/// `sdk.json` discovery: an explicit `--config` path is claimed iff it ends in
/// `.json` AND exists; otherwise the conventional names are tried in `cwd`.
fn detect_sdk_json(cwd: &Path, explicit: Option<&str>) -> Option<String> {
    if let Some(explicit) = explicit {
        let resolved = paths::resolve_str(cwd, explicit);
        let claimed = paths::extname(&resolved) == ".json" && Path::new(&resolved).exists();
        return claimed.then_some(resolved);
    }
    for rel in ["sdk.json", ".sdk/sdk.json"] {
        let resolved = paths::resolve_str(cwd, rel);
        if Path::new(&resolved).exists() {
            return Some(resolved);
        }
    }
    None
}

/// `opensdk.config.{ts,js,mjs}` discovery — detection only; loading it is the
/// capability this port drops.
fn detect_opensdk_config(cwd: &Path, explicit: Option<&str>) -> Option<String> {
    if let Some(explicit) = explicit {
        let resolved = paths::resolve_str(cwd, explicit);
        let ext = paths::extname(&resolved);
        return CONFIG_EXTS
            .contains(&ext.as_str())
            .then_some(resolved.clone());
    }
    for name in CONFIG_NAMES {
        let resolved = paths::resolve_str(cwd, name);
        if Path::new(&resolved).exists() {
            return Some(resolved);
        }
    }
    None
}

fn unsupported_js_config(file_path: &str) -> Error {
    Error::msg(format!(
        "Unsupported config file: {file_path}. The Rust `opensdk` cannot evaluate a JavaScript \
         plugin bundle (opensdk.config.{{ts,js,mjs}} exists to register custom emitters written \
         in JS). Use the declarative sdk.json instead — run `opensdk init --format json`."
    ))
}

/// Parse + normalize an `sdk.json` into a [`ResolvedConfig`].
pub fn normalize_sdk_json(raw: &Value, file_path: &str) -> Result<ResolvedConfig> {
    let doc: SdkJson = serde_json::from_value(raw.clone())
        .map_err(|e| Error::msg(format!("Failed to parse {file_path}: {e}")))?;

    let mut emitter_options: Vec<(String, Map<String, Value>)> = Vec::new();
    let mut targets: Vec<(String, ResolvedTarget)> = Vec::new();

    // `rest` is every non-declared top-level key, in file order. A key whose
    // value is not a plain object is skipped (the TS `!isPlainObject` guard).
    let sections: Vec<(String, LanguageSection)> = doc.sections();
    for (key, value) in doc.rest.iter() {
        if !value.is_object() {
            continue;
        }
        let Some((_, section)) = sections.iter().find(|(k, _)| k == key) else {
            // The config crate could not read this object as a LanguageSection
            // (e.g. `output: 42`). The TS would carry the bad value through and
            // fail much later; failing here names the offending key.
            return Err(Error::msg(format!(
                "Failed to parse {file_path}: language section \"{key}\" is not a valid section \
                 (check `output`/`behavior`/`publish` types)."
            )));
        };
        let lang = resolve_lang(key);
        emitter_options.push((lang.clone(), section.options.clone()));
        if section.output.is_some() || section.behavior.is_some() || section.publish.is_some() {
            targets.push((
                lang,
                ResolvedTarget {
                    output: section.output.clone(),
                    behavior: section.behavior.clone(),
                    publish: section.publish.clone(),
                    merge: None,
                },
            ));
        }
    }

    let grouping = doc.grouping.as_ref();
    let mut config = ResolvedConfig {
        sdk: doc.behavior.clone(),
        sdk_name: doc.sdk_name.clone(),
        mount_rules: grouping
            .and_then(|g| g.mount_rules.as_ref())
            .map(|m| Value::Object(m.clone())),
        operation_hints: grouping
            .and_then(|g| g.operation_hints.as_ref())
            .map(|h| serde_json::to_value(h).expect("OperationHint map serializes")),
        publish: doc.publish.clone(),
        ..Default::default()
    };

    // A predefined spec resolves relative to the CONFIG FILE so `generate`
    // works from any cwd; `--spec` still overrides it. `api` supersedes the
    // legacy `spec` key.
    if let Some(api_ref) = doc.api.as_ref().or(doc.spec.as_ref()) {
        config.spec = Some(if paths::is_absolute(api_ref) {
            api_ref.clone()
        } else {
            paths::resolve_str(Path::new(&paths::dirname(file_path)), api_ref)
        });
    }
    config.emitter_options = emitter_options;
    config.targets = targets;
    Ok(config)
}

/// Resolve the effective config for a cwd.
///
/// Returns `Ok(None)` when no config is present and no explicit path was given.
pub fn resolve_config(cwd: &Path, explicit: Option<&str>) -> Result<Option<ResolvedConfig>> {
    if let Some(file_path) = detect_sdk_json(cwd, explicit) {
        let raw = std::fs::read_to_string(&file_path)
            .map_err(|e| Error::msg(format!("Failed to parse {file_path}: {e}")))?;
        let value: Value = serde_json::from_str(&raw)
            .map_err(|e| Error::msg(format!("Failed to parse {file_path}: {e}")))?;
        let mut config = normalize_sdk_json(&value, &file_path)?;
        config.source = Some(ConfigProvenance {
            kind: "sdk-json".into(),
            file_path,
        });
        return Ok(Some(config));
    }
    if let Some(file_path) = detect_opensdk_config(cwd, explicit) {
        return Err(unsupported_js_config(&file_path));
    }
    if let Some(explicit) = explicit {
        return Err(Error::msg(format!(
            "Unsupported config file: {explicit}. Expected sdk.json or opensdk.config.{{ts,js,mjs}}."
        )));
    }
    Ok(None)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn normalize(doc: Value) -> ResolvedConfig {
        normalize_sdk_json(&doc, "/proj/sdk.json").unwrap()
    }

    #[test]
    fn aliases_become_canonical_and_output_behavior_publish_split_into_targets() {
        let c = normalize(json!({
            "version": 1,
            "sdkName": "acme",
            "behavior": { "retry": { "maxRetries": 4 } },
            "grouping": { "mountRules": { "assistants": "beta/assistants" } },
            "typescript": { "packageName": "acme", "output": "./out/ts",
                            "behavior": { "retry": { "maxRetries": 9 } } },
            "go": { "modulePath": "github.com/acme/acme" }
        }));
        assert_eq!(c.sdk, Some(json!({ "retry": { "maxRetries": 4 } })));
        assert_eq!(c.sdk_name.as_deref(), Some("acme"));
        assert_eq!(
            c.mount_rules,
            Some(json!({ "assistants": "beta/assistants" }))
        );
        assert_eq!(
            c.emitter_options_for("node"),
            Some(
                &json!({ "packageName": "acme" })
                    .as_object()
                    .unwrap()
                    .clone()
            )
        );
        let t = c.target_for("node").unwrap();
        assert_eq!(t.output.as_deref(), Some("./out/ts"));
        assert_eq!(t.behavior, Some(json!({ "retry": { "maxRetries": 9 } })));
        // go declares neither output nor behavior nor publish → no target.
        assert!(c.target_for("go").is_none());
        // Declaration order is the generation order.
        assert_eq!(c.declared_languages(), vec!["node", "go"]);
    }

    #[test]
    fn spec_resolves_against_the_config_dir_and_api_supersedes_spec() {
        let c = normalize(json!({ "version": 1, "spec": "openapi/api.yaml" }));
        assert_eq!(c.spec.as_deref(), Some("/proj/openapi/api.yaml"));
        let c = normalize(json!({ "version": 1, "spec": "/abs/a.yaml" }));
        assert_eq!(c.spec.as_deref(), Some("/abs/a.yaml"));
        let c = normalize(json!({ "version": 1, "api": "a.yaml", "spec": "b.yaml" }));
        assert_eq!(c.spec.as_deref(), Some("/proj/a.yaml"));
        // Reserved keys are never language sections.
        assert!(c.emitter_options.is_empty());
    }

    #[test]
    fn non_object_values_are_not_sections() {
        let c = normalize(json!({ "version": 1, "weird": "string", "list": [1], "go": {} }));
        assert_eq!(c.declared_languages(), vec!["go"]);
    }

    #[test]
    fn declared_languages_falls_through_to_targets_when_no_options_exist() {
        // Only reachable through a non-sdk.json source in the TS, but the
        // fallback is part of the contract.
        let c = ResolvedConfig {
            targets: vec![("go".into(), ResolvedTarget::default())],
            ..Default::default()
        };
        assert_eq!(c.declared_languages(), vec!["go"]);
    }
}
