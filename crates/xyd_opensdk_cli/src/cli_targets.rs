//! `src/cli/cli-targets.ts` — the `go-cli` / `rust-cli` pseudo-language targets.
//!
//! The OpenCLI pipeline (`openapi2opencli` → `opencli2go`/`opencli2rust`)
//! surfaced as target ids. Routed BEFORE the emitter registry: CLI generation
//! consumes the RAW OpenAPI document, not the OpenSDK IR, so these are a
//! parallel branch, not emitters. Both backends still write through the
//! framework's `write_project`, so the regen lifecycle (lock, stale-prune,
//! `.sdkignore`, `--merge`) applies to CLI outputs too.

use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};

use serde_json::{Map, Value};

use xyd_opensdk_config::PublishTarget;
use xyd_opensdk_framework::{write_project, FileEntry, FileMap, WriteMode, WriteProjectOptions};

use crate::error::{Error, Result};
use crate::grouping::js_truthy;
use crate::write_report::report_write_result;

/// Which backend a CLI target id drives.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CliBackend {
    Go,
    Rust,
}

impl CliBackend {
    /// Generator name recorded in the `.sdk/sdk.lock` manifest.
    pub fn generator(self) -> &'static str {
        match self {
            CliBackend::Go => "opencli2go",
            CliBackend::Rust => "opencli2rust",
        }
    }

    /// The backend's OWN option keys (disjoint from [`CLI_CONVERTER_KEYS`]).
    pub fn backend_keys(self) -> &'static [&'static str] {
        match self {
            CliBackend::Go => &["modulePath", "binName", "goVersion", "baseURL"],
            CliBackend::Rust => &["crateName", "binName", "edition", "baseURL"],
        }
    }

    fn generate(self, spec: &Value, options: &Map<String, Value>) -> Result<FileMap> {
        let options = Value::Object(options.clone());
        match self {
            CliBackend::Go => {
                let opts = serde_json::from_value(options)
                    .map_err(|e| Error::msg(format!("bad go-cli options: {e}")))?;
                Ok(xyd_opencli2go::opencli2go(spec, Some(opts))
                    .into_iter()
                    .map(|(path, content)| {
                        (
                            path,
                            FileEntry {
                                content,
                                write_mode: WriteMode::Overwrite,
                            },
                        )
                    })
                    .collect())
            }
            CliBackend::Rust => {
                let opts = serde_json::from_value(options)
                    .map_err(|e| Error::msg(format!("bad rust-cli options: {e}")))?;
                Ok(xyd_opencli2rust::opencli2rust(spec, Some(opts))
                    .into_iter()
                    .map(|(path, entry)| {
                        let write_mode = match entry.write_mode {
                            xyd_opencli2rust::WriteMode::Overwrite => WriteMode::Overwrite,
                            xyd_opencli2rust::WriteMode::SkipIfExists => WriteMode::SkipIfExists,
                        };
                        (
                            path,
                            FileEntry {
                                content: entry.content,
                                write_mode,
                            },
                        )
                    })
                    .collect())
            }
        }
    }
}

/// Resolve a CLI target id (exact, case-insensitive — never an alias).
pub fn cli_backend(lang: &str) -> Option<CliBackend> {
    match lang.to_lowercase().as_str() {
        "go-cli" => Some(CliBackend::Go),
        "rust-cli" => Some(CliBackend::Rust),
        _ => None,
    }
}

/// The `OpenApi2OpenCliOptions` keys accepted in a CLI target's flat bag.
pub const CLI_CONVERTER_KEYS: &[&str] = &[
    "cliName",
    "version",
    "grouping",
    "bodyStrategy",
    "includeMethods",
    "includeHeaders",
    "flagCase",
    "actionAliases",
    "verbMap",
    "customActionVerbs",
    "includePaths",
    "maxBodyDepth",
    "authEnvVar",
];

/// The backend option keys for a CLI target id (empty for a non-CLI id).
pub fn cli_backend_keys(lang: &str) -> &'static [&'static str] {
    cli_backend(lang).map_or(&[], CliBackend::backend_keys)
}

/// Is this `--lang` / section key / chain target a CLI output target?
pub fn is_cli_target(lang: Option<&str>) -> bool {
    lang.is_some_and(|l| cli_backend(l).is_some())
}

/// A flat CLI option bag split by allowlist.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct SplitCliOptions {
    pub converter: Map<String, Value>,
    pub backend: Map<String, Value>,
}

/// Split a CLI target's FLAT option bag into converter options
/// (`openapi2opencli`) and backend options (`opencli2go`/`opencli2rust`).
///
/// The key sets are disjoint, so the split is unambiguous; unknown keys fail
/// loud with the full valid set.
pub fn split_cli_options(lang: &str, bag: &Map<String, Value>) -> Result<SplitCliOptions> {
    let Some(def) = cli_backend(lang) else {
        return Err(Error::msg(format!("Not a CLI target: {lang}")));
    };
    let mut out = SplitCliOptions::default();
    let mut unknown: Vec<&str> = Vec::new();
    for (key, value) in bag {
        // `tests` is the shared LanguageSection knob; CLI backends emit no
        // self-test suite, so it is tolerated and stripped.
        if key == "tests" {
            continue;
        }
        if CLI_CONVERTER_KEYS.contains(&key.as_str()) {
            out.converter.insert(key.clone(), value.clone());
        } else if def.backend_keys().contains(&key.as_str()) {
            out.backend.insert(key.clone(), value.clone());
        } else {
            unknown.push(key);
        }
    }
    if !unknown.is_empty() {
        let valid: Vec<&str> = CLI_CONVERTER_KEYS
            .iter()
            .chain(def.backend_keys().iter())
            .copied()
            .collect();
        return Err(Error::msg(format!(
            "Unknown option(s) for \"{lang}\": {}. Valid: {}",
            unknown.join(", "),
            valid.join(", ")
        )));
    }
    Ok(out)
}

/// Inputs for one CLI output target.
#[derive(Debug, Clone, Default)]
pub struct CliTargetOptions {
    /// OpenAPI spec path (yaml/json). A pre-parsed OpenSDK IR is rejected.
    pub spec: String,
    /// CLI target id: `go-cli` | `rust-cli`.
    pub lang: String,
    pub output: String,
    /// Defaults the emitted CLI's name (converter `cliName`) when unset.
    pub sdk_name: Option<String>,
    /// The flat option bag (converter + backend keys, split by allowlist).
    pub options: Option<Map<String, Value>>,
    /// Only `version` is consumed (defaults the converter `version`).
    pub publish: Option<PublishTarget>,
    /// SDK-tree grouping — meaningless for CLI targets; warned once + ignored.
    pub mount_rules: Option<Value>,
    pub operation_hints: Option<Value>,
    pub grouping_file: Option<String>,
    pub dry_run: bool,
    pub merge: bool,
}

/// `console.warn` is fired at most once per process, matching the TS module-level flag.
static WARNED_SDK_GROUPING: AtomicBool = AtomicBool::new(false);

/// Generate one CLI output target: openapi2opencli → backend → `write_project`.
pub fn generate_cli_target(opts: &CliTargetOptions, cwd: &Path) -> Result<()> {
    let lang = opts.lang.to_lowercase();
    let Some(backend) = cli_backend(&lang) else {
        return Err(Error::msg(format!("Not a CLI target: {}", opts.lang)));
    };

    // Mirror load_ir's sniff: a pre-parsed OpenSDK IR cannot feed the OpenCLI
    // pipeline. An unreadable/unparseable .json falls through to the converter,
    // which reports it — exactly like the TS (whose JSON.parse would throw, so
    // this stays inside the same failure surface).
    if opts.spec.ends_with(".json") {
        if let Ok(raw) = std::fs::read_to_string(&opts.spec) {
            if let Ok(doc) = serde_json::from_str::<Value>(&raw) {
                if doc.get("opensdk").and_then(Value::as_str).is_some() {
                    return Err(Error::msg(format!(
                        "CLI targets (\"{lang}\") generate from the OpenAPI document, not a \
                         pre-parsed OpenSDK IR. Pass the OpenAPI spec (yaml/json) as --spec."
                    )));
                }
            }
        }
    }

    // SDK-tree grouping flows into every generate call in mixed configs — warn
    // once instead of erroring so mixed SDK+CLI setups keep working.
    let has_sdk_grouping = js_truthy(opts.mount_rules.as_ref())
        || js_truthy(opts.operation_hints.as_ref())
        || opts.grouping_file.as_deref().is_some_and(|g| !g.is_empty());
    if has_sdk_grouping && !WARNED_SDK_GROUPING.swap(true, Ordering::SeqCst) {
        eprintln!(
            "note: mountRules/operationHints apply to SDK targets only — ignored for \"{lang}\"."
        );
    }

    let empty = Map::new();
    let mut split = split_cli_options(&lang, opts.options.as_ref().unwrap_or(&empty))?;
    if !split.converter.contains_key("cliName") {
        if let Some(name) = opts.sdk_name.as_ref().filter(|s| !s.is_empty()) {
            split
                .converter
                .insert("cliName".into(), Value::String(name.clone()));
        }
    }
    if !split.converter.contains_key("version") {
        if let Some(v) = opts
            .publish
            .as_ref()
            .and_then(|p| p.version.as_ref())
            .filter(|s| !s.is_empty())
        {
            split
                .converter
                .insert("version".into(), Value::String(v.clone()));
        }
    }

    let converter_options = serde_json::from_value(Value::Object(split.converter))
        .map_err(|e| Error::msg(format!("bad {lang} converter options: {e}")))?;
    let cli_spec =
        xyd_openapi2opencli::openapi2opencli_from_file(&opts.spec, Some(converter_options))
            .map_err(|e| Error::msg(e.to_string()))?;
    let cli_spec = serde_json::to_value(&cli_spec)
        .map_err(|e| Error::msg(format!("serialize opencli spec: {e}")))?;

    let files = backend.generate(&cli_spec, &split.backend)?;

    if opts.dry_run {
        let mut names: Vec<&str> = files.iter().map(|(p, _)| p.as_str()).collect();
        names.sort_unstable();
        for p in names {
            println!("{p}");
        }
        return Ok(());
    }
    let out_dir = crate::paths::resolve(cwd, &opts.output);
    let result = write_project(
        &files,
        &out_dir,
        &WriteProjectOptions {
            generator: Some(backend.generator().to_string()),
            merge: opts.merge,
        },
    )
    .map_err(|e| Error::msg(format!("write_project: {e}")))?;
    report_write_result(files.len(), &opts.output, &result);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn bag(v: Value) -> Map<String, Value> {
        v.as_object().unwrap().clone()
    }

    #[test]
    fn recognizes_exactly_the_cli_target_ids() {
        assert!(is_cli_target(Some("go-cli")));
        assert!(is_cli_target(Some("rust-cli")));
        assert!(is_cli_target(Some("RUST-CLI")));
        assert!(!is_cli_target(Some("go")));
        assert!(!is_cli_target(Some("cli")));
        assert!(!is_cli_target(None));
    }

    #[test]
    fn converter_and_backend_key_sets_are_disjoint_for_every_backend() {
        for lang in ["go-cli", "rust-cli"] {
            let overlap: Vec<&str> = CLI_CONVERTER_KEYS
                .iter()
                .filter(|k| cli_backend_keys(lang).contains(k))
                .copied()
                .collect();
            assert!(overlap.is_empty(), "{lang} overlap: {overlap:?}");
        }
    }

    #[test]
    fn splits_a_flat_mixed_bag_by_allowlist() {
        let split = split_cli_options(
            "rust-cli",
            &bag(json!({
                "cliName": "acme",
                "flagCase": "kebab",
                "crateName": "acme-cli",
                "baseURL": "https://api.acme.dev"
            })),
        )
        .unwrap();
        assert_eq!(
            Value::Object(split.converter),
            json!({ "cliName": "acme", "flagCase": "kebab" })
        );
        assert_eq!(
            Value::Object(split.backend),
            json!({ "crateName": "acme-cli", "baseURL": "https://api.acme.dev" })
        );
    }

    #[test]
    fn rejects_unknown_keys_listing_the_valid_ones() {
        let err = split_cli_options("go-cli", &bag(json!({ "packageName": "x" }))).unwrap_err();
        assert!(
            err.0
                .starts_with("Unknown option(s) for \"go-cli\": packageName."),
            "{}",
            err.0
        );
        assert!(err.0.contains("modulePath"), "{}", err.0);
    }

    #[test]
    fn tolerates_and_strips_the_shared_tests_knob() {
        let split = split_cli_options("go-cli", &bag(json!({ "tests": false }))).unwrap();
        assert!(split.converter.is_empty());
        assert!(split.backend.is_empty());
    }

    #[test]
    fn a_non_cli_lang_is_not_splittable() {
        assert_eq!(
            split_cli_options("go", &Map::new()).unwrap_err().0,
            "Not a CLI target: go"
        );
    }
}
