//! `src/cli/generate.ts` — the main command (single `--lang` and multi-target).

use std::collections::BTreeMap;
use std::path::Path;

use serde_json::{Map, Value};

use xyd_opensdk_config::{merge_publish_targets, PublishTarget};
use xyd_opensdk_core::behavior::deep_merge;
use xyd_opensdk_core::emitter::{GeneratedFile, WriteMode as CoreWriteMode};
use xyd_opensdk_framework::{write_project, FileEntry, FileMap, WriteMode, WriteProjectOptions};

use crate::cli_targets::{generate_cli_target, is_cli_target, CliTargetOptions};
use crate::config::ResolvedConfig;
use crate::error::{Error, Result};
use crate::grouping::{converter_options, ConverterInputs};
use crate::paths;
use crate::registry::{get_emitter, resolve_lang};
use crate::write_report::report_write_result;

/// `mergeBehaviorOverrides(...layers)` — deep-merge behavior layers, skipping
/// absent ones; arrays and scalars replace.
///
/// Not in `xyd_opensdk_config` (which only ports `config.ts`), so it is folded
/// here over `xyd_opensdk_core::behavior::deep_merge` — the same primitive the
/// TypeScript's own `deepMerge` is.
pub fn merge_behavior_overrides(layers: &[Option<&Value>]) -> Value {
    let mut out = Value::Object(Map::new());
    for layer in layers.iter().flatten() {
        out = deep_merge(&out, layer);
    }
    out
}

/// Override the IR's package identity (`spec.info`) from a merged publish target.
///
/// The converter already fills `version`/`contact`/`license` from the OpenAPI
/// `info`; a publish block's identity fields win over those. Returns a NEW value
/// (never mutates), so per-language calls in [`generate_targets`] don't leak.
pub fn apply_publish_identity(info: &Value, publish: Option<&PublishTarget>) -> Value {
    let Some(publish) = publish else {
        return info.clone();
    };
    let mut next = match info.as_object() {
        Some(o) => o.clone(),
        // `{ ...info }` on a non-object yields `{}` in JS.
        None => Map::new(),
    };
    let set = |m: &mut Map<String, Value>, k: &str, v: &Option<String>| {
        if let Some(v) = v.as_ref().filter(|s| !s.is_empty()) {
            m.insert(k.to_string(), Value::String(v.clone()));
        }
    };
    set(&mut next, "version", &publish.version);
    set(&mut next, "homepage", &publish.homepage);
    set(&mut next, "repository", &publish.repository);
    if let Some(author) = publish.author.as_ref().filter(|s| !s.is_empty()) {
        let mut contact = next
            .get("contact")
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default();
        contact.insert("name".into(), Value::String(author.clone()));
        next.insert("contact".into(), Value::Object(contact));
    }
    if let Some(license) = publish.license.as_ref().filter(|s| !s.is_empty()) {
        let mut lic = next
            .get("license")
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default();
        lic.insert("identifier".into(), Value::String(license.clone()));
        next.insert("license".into(), Value::Object(lic));
    }
    Value::Object(next)
}

/// Adapt an emitter's `path -> GeneratedFile` map to the framework's `FileMap`.
fn to_file_map(files: BTreeMap<String, GeneratedFile>) -> FileMap {
    files
        .into_iter()
        .map(|(path, f)| {
            let write_mode = match f.write_mode {
                None | Some(CoreWriteMode::Overwrite) => WriteMode::Overwrite,
                Some(CoreWriteMode::SkipIfExists) => WriteMode::SkipIfExists,
                Some(CoreWriteMode::MergeJson) => WriteMode::MergeJson,
            };
            (
                path,
                FileEntry {
                    content: f.content,
                    write_mode,
                },
            )
        })
        .collect()
}

/// Emit an IR through one language's emitter to disk (or print on dry-run).
fn emit_to_disk(
    ir: &Value,
    lang: &str,
    emitter_options: &Map<String, Value>,
    output: &str,
    dry_run: bool,
    merge: bool,
    cwd: &Path,
) -> Result<()> {
    let emitter = get_emitter(lang)?; // resolves aliases (typescript -> node, ...)
    let options = Value::Object(emitter_options.clone());
    let files = to_file_map((emitter.generate_files)(ir, &options));
    if dry_run {
        let mut names: Vec<&str> = files.iter().map(|(p, _)| p.as_str()).collect();
        names.sort_unstable();
        for p in names {
            println!("{p}");
        }
        return Ok(());
    }
    let out_dir = paths::resolve(cwd, output);
    let result = write_project(
        &files,
        &out_dir,
        &WriteProjectOptions {
            generator: None,
            merge,
        },
    )
    .map_err(|e| Error::msg(format!("write_project: {e}")))?;
    report_write_result(files.len(), output, &result);
    Ok(())
}

/// Options for `opensdk generate --lang <x>` (single target).
#[derive(Debug, Clone, Default)]
pub struct GenerateCommandOptions {
    pub inputs: ConverterInputs,
    pub spec: String,
    pub lang: String,
    pub output: String,
    pub dry_run: bool,
    /// Opt OUT of the emitted self-test suite (`{ tests: false }` on the bag).
    pub no_tests: bool,
    /// Language-specific option bag for the active emitter (from config).
    pub emitter_options: Option<Map<String, Value>>,
    /// Publish identity (global + per-language, pre-merged by the caller).
    pub publish: Option<PublishTarget>,
    /// 3-way merge hand-edits into regenerated files instead of overwriting.
    pub merge: bool,
}

/// `opensdk generate --lang <x>` — single target.
pub fn generate_command(opts: &GenerateCommandOptions, cwd: &Path) -> Result<()> {
    // CLI output targets (go-cli/rust-cli) branch off BEFORE the OpenSDK IR:
    // they consume the raw OpenAPI doc via the OpenCLI pipeline. This single
    // seam also covers chain targets — the chain loop calls this same function.
    if is_cli_target(Some(&opts.lang)) {
        return generate_cli_target(
            &CliTargetOptions {
                spec: opts.spec.clone(),
                lang: opts.lang.clone(),
                output: opts.output.clone(),
                sdk_name: opts.inputs.sdk_name.clone(),
                options: opts.emitter_options.clone(),
                publish: opts.publish.clone(),
                mount_rules: opts.inputs.mount_rules.clone(),
                operation_hints: opts.inputs.operation_hints.clone(),
                grouping_file: opts.inputs.grouping.clone(),
                dry_run: opts.dry_run,
                merge: opts.merge,
            },
            cwd,
        );
    }
    let mut ir = load_ir(&opts.spec, &converter_options(&opts.inputs, cwd)?)?;
    let info = apply_publish_identity(
        ir.get("info").unwrap_or(&Value::Null),
        opts.publish.as_ref(),
    );
    set_key(&mut ir, "info", info);

    let mut emitter_options = opts.emitter_options.clone().unwrap_or_default();
    if opts.no_tests {
        emitter_options.insert("tests".into(), Value::Bool(false));
    }
    emit_to_disk(
        &ir,
        &opts.lang,
        &emitter_options,
        &opts.output,
        opts.dry_run,
        opts.merge,
        cwd,
    )
}

/// Set a key on an IR object, preserving the existing key position.
fn set_key(ir: &mut Value, key: &str, value: Value) {
    if let Some(obj) = ir.as_object_mut() {
        obj.insert(key.to_string(), value);
    }
}

/// Options for `opensdk generate` with no `--lang` (multi target).
#[derive(Debug, Clone, Default)]
pub struct GenerateTargetsOptions {
    pub inputs: ConverterInputs,
    pub spec: String,
    pub output: String,
    pub dry_run: bool,
    pub no_tests: bool,
    pub merge: bool,
}

/// `opensdk generate` (no `--lang`) — MULTI target.
///
/// Converts the spec ONCE (with the global behavior) then emits every declared
/// language, re-stamping `ir.sdk` per language so per-language behavior
/// overrides land. Emitters read the behavior lazily at emit time, so the
/// re-stamp is sufficient — no re-conversion. Caveat (inherited from the TS):
/// idempotency param-stripping is baked at convert time, so it always uses the
/// GLOBAL behavior.
pub fn generate_targets(
    opts: &GenerateTargetsOptions,
    config: &ResolvedConfig,
    cwd: &Path,
) -> Result<()> {
    let langs = config.declared_languages();
    if langs.is_empty() {
        return Err(Error::msg(
            "No languages declared in the config. Add a language section (e.g. \"typescript\": \
             { \"output\": \"./sdk/ts\" }) or pass --lang.",
        ));
    }

    // CLI output targets don't consume the OpenSDK IR — generate them first, and
    // only run the converter when SDK languages remain (a CLI-only config must
    // not pay for — or fail on — the IR conversion).
    let sdk_langs: Vec<&String> = langs.iter().filter(|l| !is_cli_target(Some(l))).collect();
    for lang in langs.iter().filter(|l| is_cli_target(Some(l))) {
        let target = config.target_for(lang);
        generate_cli_target(
            &CliTargetOptions {
                spec: opts.spec.clone(),
                lang: lang.clone(),
                output: target
                    .and_then(|t| t.output.clone())
                    .unwrap_or_else(|| paths::join(&opts.output, lang)),
                sdk_name: opts.inputs.sdk_name.clone(),
                options: config.emitter_options_for(lang).cloned(),
                publish: merge_publish_targets(&[
                    config.publish.as_ref(),
                    target.and_then(|t| t.publish.as_ref()),
                ]),
                mount_rules: opts.inputs.mount_rules.clone(),
                operation_hints: opts.inputs.operation_hints.clone(),
                grouping_file: opts.inputs.grouping.clone(),
                dry_run: opts.dry_run,
                merge: target.and_then(|t| t.merge).unwrap_or(opts.merge),
            },
            cwd,
        )?;
    }
    if sdk_langs.is_empty() {
        return Ok(());
    }

    let inputs = ConverterInputs {
        sdk: config.sdk.clone(),
        ..opts.inputs.clone()
    };
    let mut ir = load_ir(&opts.spec, &converter_options(&inputs, cwd)?)?;
    // Snapshot the converter's info so each language re-derives identity from a
    // clean base (a per-language publish never leaks into the next language).
    let base_info = ir.get("info").cloned().unwrap_or(Value::Null);
    for lang in sdk_langs {
        let target = config.target_for(lang);
        let behavior = merge_behavior_overrides(&[
            config.sdk.as_ref(),
            target.and_then(|t| t.behavior.as_ref()),
        ]);
        set_key(&mut ir, "sdk", behavior);
        let publish = merge_publish_targets(&[
            config.publish.as_ref(),
            target.and_then(|t| t.publish.as_ref()),
        ]);
        let info = apply_publish_identity(&base_info, publish.as_ref());
        set_key(&mut ir, "info", info);

        let output = target
            .and_then(|t| t.output.clone())
            .unwrap_or_else(|| paths::join(&opts.output, lang));
        let mut emitter_options = config
            .emitter_options_for(lang)
            .cloned()
            .unwrap_or_default();
        if opts.no_tests {
            emitter_options.insert("tests".into(), Value::Bool(false));
        }
        emit_to_disk(
            &ir,
            lang,
            &emitter_options,
            &output,
            opts.dry_run,
            target.and_then(|t| t.merge).unwrap_or(opts.merge),
            cwd,
        )?;
    }
    Ok(())
}

/// Accept either an OpenAPI spec (yaml/json) or an already-parsed OpenSDK IR json.
pub fn load_ir(source: &str, options: &Map<String, Value>) -> Result<Value> {
    if source.ends_with(".json") {
        let raw = std::fs::read_to_string(source)
            .map_err(|e| Error::msg(format!("read {source}: {e}")))?;
        let doc: Value =
            serde_json::from_str(&raw).map_err(|e| Error::msg(format!("parse {source}: {e}")))?;
        if doc.get("opensdk").and_then(Value::as_str).is_some() {
            return Ok(doc);
        }
        return convert(&doc, options);
    }
    let doc = xyd_openapi::read_spec(source).map_err(|e| Error::msg(e.to_string()))?;
    convert(&doc, options)
}

fn convert(doc: &Value, options: &Map<String, Value>) -> Result<Value> {
    let converter_options = serde_json::from_value(Value::Object(options.clone()))
        .map_err(|e| Error::msg(format!("bad converter options: {e}")))?;
    let spec = xyd_openapi2opensdk::openapi2opensdk(doc, Some(converter_options))
        .map_err(|e| Error::msg(e.to_string()))?;
    serde_json::to_value(&spec).map_err(|e| Error::msg(format!("serialize IR: {e}")))
}

/// `resolveLanguage` re-export for the command layer (single-target config lookup).
pub fn canonical(lang: &str) -> String {
    resolve_lang(lang)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn publish_identity_is_a_no_op_without_a_publish_block() {
        let info = json!({ "title": "t", "version": "1.0.0" });
        assert_eq!(apply_publish_identity(&info, None), info);
    }

    #[test]
    fn publish_identity_overrides_and_appends_in_typescript_order() {
        let info = json!({ "title": "t", "version": "1.0.0", "contact": { "email": "a@b.c" } });
        let publish = PublishTarget {
            version: Some("2.0.0".into()),
            homepage: Some("https://acme.dev".into()),
            repository: Some("https://github.com/acme/acme".into()),
            author: Some("Acme".into()),
            license: Some("MIT".into()),
            ..Default::default()
        };
        let out = apply_publish_identity(&info, Some(&publish));
        let keys: Vec<&str> = out
            .as_object()
            .unwrap()
            .keys()
            .map(String::as_str)
            .collect();
        // Existing keys keep their slot; new ones append in assignment order.
        assert_eq!(
            keys,
            [
                "title",
                "version",
                "contact",
                "homepage",
                "repository",
                "license"
            ]
        );
        assert_eq!(out["version"], json!("2.0.0"));
        // contact merges (the existing email survives).
        assert_eq!(out["contact"], json!({ "email": "a@b.c", "name": "Acme" }));
        assert_eq!(out["license"], json!({ "identifier": "MIT" }));
    }

    #[test]
    fn empty_publish_fields_are_falsy_and_skipped() {
        let info = json!({ "version": "1.0.0" });
        let publish = PublishTarget {
            version: Some(String::new()),
            ..Default::default()
        };
        assert_eq!(
            apply_publish_identity(&info, Some(&publish))["version"],
            json!("1.0.0")
        );
    }

    #[test]
    fn behavior_overrides_deep_merge_with_later_layers_winning() {
        let global = json!({ "retry": { "maxRetries": 3, "backoffMs": 100 } });
        let per_lang = json!({ "retry": { "maxRetries": 7 } });
        assert_eq!(
            merge_behavior_overrides(&[Some(&global), Some(&per_lang)]),
            json!({ "retry": { "maxRetries": 7, "backoffMs": 100 } })
        );
        // No layers at all → `{}` (which the emitters re-merge over defaults).
        assert_eq!(merge_behavior_overrides(&[None, None]), json!({}));
    }

    #[test]
    fn canonical_resolves_aliases() {
        assert_eq!(canonical("typescript"), "node");
    }
}
