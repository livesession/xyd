//! The BEHAVIOURAL gate: every assertion the TypeScript's own test suite makes
//! (`__tests__/{cli,cli-targets,sdk-json,publish,diff,xsdk}.test.ts`), re-made
//! against the Rust port.
//!
//! These are hand-written expectations, not captured goldens — they say what
//! someone once expected, which is why the byte-level proof lives in
//! `tests/oracle.rs` (frozen from the real TypeScript). This file exists because
//! those expectations are still the contract for the IO-shaped commands, and
//! because several of them (`publish`, `run`) have no pure value to freeze.

use std::path::{Path, PathBuf};

use serde_json::{json, Map, Value};

use xyd_opensdk_cli::cli_targets::{
    cli_backend_keys, generate_cli_target, is_cli_target, CliTargetOptions, CLI_CONVERTER_KEYS,
};
use xyd_opensdk_cli::config::resolve_config;
use xyd_opensdk_cli::diff::{diff_command, DiffCommandOptions, DiffFailOn};
use xyd_opensdk_cli::exec::EmitterPublishOptions;
use xyd_opensdk_cli::generate::{
    generate_command, generate_targets, GenerateCommandOptions, GenerateTargetsOptions,
};
use xyd_opensdk_cli::grouping::ConverterInputs;
use xyd_opensdk_cli::init::{init_command, InitOptions};
use xyd_opensdk_cli::parse::{parse_command, ParseCommandOptions};
use xyd_opensdk_cli::publish::{publish_command, publish_target, PublishCommandOptions};
use xyd_opensdk_cli::registry::resolve_lang;
use xyd_opensdk_cli::run::{run_chain, RunOptions};
use xyd_opensdk_cli::xsdk::{xsdk_command, XsdkCommandOptions};

/// The petstore OpenAPI doc vendored as the converter's `1.basic` fixture —
/// the same spec every TypeScript test drives.
fn spec() -> String {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/xyd-openapi2opensdk/__fixtures__/1.basic/input.json")
        .canonicalize()
        .expect("petstore fixture")
        .to_string_lossy()
        .to_string()
}

/// A unique throwaway directory (the `fs.mkdtempSync` analog).
fn tmp(tag: &str) -> PathBuf {
    use std::sync::atomic::{AtomicU32, Ordering};
    static N: AtomicU32 = AtomicU32::new(0);
    let dir = std::env::temp_dir().join(format!(
        "opensdk-rs-{tag}-{}-{}",
        std::process::id(),
        N.fetch_add(1, Ordering::SeqCst)
    ));
    std::fs::remove_dir_all(&dir).ok();
    std::fs::create_dir_all(&dir).expect("temp dir");
    dir
}

fn write(dir: &Path, rel: &str, body: &Value) -> String {
    let p = dir.join(rel);
    std::fs::create_dir_all(p.parent().unwrap()).unwrap();
    std::fs::write(&p, serde_json::to_string_pretty(body).unwrap()).unwrap();
    p.to_string_lossy().to_string()
}

fn exists(dir: &Path, rel: &str) -> bool {
    dir.join(rel).exists()
}

fn read(dir: &Path, rel: &str) -> String {
    std::fs::read_to_string(dir.join(rel))
        .unwrap_or_else(|e| panic!("read {}: {e}", dir.join(rel).display()))
}

/// Every generated file, relative to `root`.
fn walk_files(root: &Path, prefix: &str, out: &mut Vec<String>) {
    let dir = if prefix.is_empty() {
        root.to_path_buf()
    } else {
        root.join(prefix)
    };
    let Ok(entries) = std::fs::read_dir(&dir) else {
        return;
    };
    for e in entries.filter_map(Result::ok) {
        let name = e.file_name().to_string_lossy().to_string();
        let rel = if prefix.is_empty() {
            name
        } else {
            format!("{prefix}/{name}")
        };
        if e.path().is_dir() {
            walk_files(root, &rel, out);
        } else {
            out.push(rel);
        }
    }
}

fn obj(v: Value) -> Map<String, Value> {
    v.as_object().cloned().unwrap()
}

/// The common single-target invocation (`spec` + `lang` + `output`).
fn gen(lang: &str, out: &Path) -> GenerateCommandOptions {
    GenerateCommandOptions {
        inputs: ConverterInputs::default(),
        spec: spec(),
        lang: lang.to_string(),
        output: out.to_string_lossy().to_string(),
        ..Default::default()
    }
}

// ── parse ────────────────────────────────────────────────────────────────────

#[test]
fn parse_writes_the_opensdk_ir_for_an_openapi_spec() {
    let dir = tmp("parse");
    let out = dir.join("ir.json").to_string_lossy().to_string();
    parse_command(
        &ParseCommandOptions {
            inputs: ConverterInputs::default(),
            spec: spec(),
            output: Some(out.clone()),
        },
        &dir,
    )
    .unwrap();
    let ir: Value = serde_json::from_str(&std::fs::read_to_string(&out).unwrap()).unwrap();
    assert_eq!(ir["opensdk"], json!("1.0.0"));
    assert_eq!(ir["resources"][0]["name"], json!("pets"));
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn parse_threads_sdk_overrides_into_the_ir_merged_over_the_canonical_defaults() {
    let dir = tmp("parse-sdk");
    let out = dir.join("ir.json").to_string_lossy().to_string();
    parse_command(
        &ParseCommandOptions {
            inputs: ConverterInputs {
                sdk: Some(json!({ "retry": { "maxRetries": 7 }, "timeout": { "defaultTimeoutMs": 1234 } })),
                ..Default::default()
            },
            spec: spec(),
            output: Some(out.clone()),
        },
        &dir,
    )
    .unwrap();
    let ir: Value = serde_json::from_str(&std::fs::read_to_string(&out).unwrap()).unwrap();
    assert_eq!(ir["sdk"]["retry"]["maxRetries"], json!(7));
    assert_eq!(ir["sdk"]["timeout"]["defaultTimeoutMs"], json!(1234));
    // Untouched policies keep the canonical defaults.
    assert_eq!(
        ir["sdk"]["retry"]["retryableStatusCodes"],
        json!([408, 429, 500, 502, 503, 504])
    );
    assert_eq!(
        ir["sdk"]["idempotency"]["headerName"],
        json!("Idempotency-Key")
    );
    std::fs::remove_dir_all(&dir).ok();
}

// ── generate ─────────────────────────────────────────────────────────────────

#[test]
fn generates_the_go_sdk_through_the_registered_emitter() {
    let dir = tmp("gen-go");
    generate_command(&gen("go", &dir), &dir).unwrap();
    for rel in ["client.go", "go.mod", "pets.go"] {
        assert!(exists(&dir, rel), "missing {rel}");
    }
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn generates_the_python_sdk_and_accepts_a_pre_parsed_ir_json() {
    let dir = tmp("gen-py");
    let ir = dir.join("ir.json").to_string_lossy().to_string();
    parse_command(
        &ParseCommandOptions {
            inputs: ConverterInputs::default(),
            spec: spec(),
            output: Some(ir.clone()),
        },
        &dir,
    )
    .unwrap();
    generate_command(
        &GenerateCommandOptions {
            spec: ir,
            output: dir.join("sdk").to_string_lossy().to_string(),
            ..gen("python", &dir)
        },
        &dir,
    )
    .unwrap();
    assert!(exists(&dir, "sdk/pyproject.toml"));
    assert!(exists(&dir, "sdk/petstore/_client.py"));
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn rejects_an_unregistered_language_with_the_available_set() {
    let dir = tmp("gen-cobol");
    let err = generate_command(&gen("cobol", &dir), &dir).unwrap_err();
    assert!(
        err.0.starts_with("Unknown opensdk language: cobol"),
        "{}",
        err.0
    );
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn remounts_resources_from_a_grouping_json() {
    let dir = tmp("gen-grouping");
    let grouping = write(
        &dir,
        "grouping.json",
        &json!({ "mountRules": { "pets": "beta/pets" } }),
    );
    let out = dir.join("sdk");
    generate_command(
        &GenerateCommandOptions {
            inputs: ConverterInputs {
                grouping: Some(grouping),
                ..Default::default()
            },
            output: out.to_string_lossy().to_string(),
            ..gen("go", &dir)
        },
        &dir,
    )
    .unwrap();
    // Mounting pets under beta yields beta.go (pets is its nested service).
    assert!(exists(&out, "beta.go"));
    assert!(!exists(&out, "pets.go"));
    assert!(exists(&out, "client.go"));
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn rejects_a_missing_grouping_path() {
    let dir = tmp("gen-grouping-missing");
    let err = generate_command(
        &GenerateCommandOptions {
            inputs: ConverterInputs {
                grouping: Some("nope.grouping.json".into()),
                ..Default::default()
            },
            ..gen("go", &dir)
        },
        &dir,
    )
    .unwrap_err();
    assert!(err.0.starts_with("Grouping file not found"), "{}", err.0);
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn go_emits_its_self_test_suite_by_default_and_no_tests_removes_it() {
    let on = tmp("gen-tests-on");
    generate_command(&gen("go", &on), &on).unwrap();
    let mut files = Vec::new();
    walk_files(&on, "", &mut files);
    assert!(files.iter().any(|f| f.ends_with("_test.go")), "{files:?}");
    assert!(exists(&on, "internal/testutil/testutil.go"));

    let off = tmp("gen-tests-off");
    generate_command(
        &GenerateCommandOptions {
            no_tests: true,
            ..gen("go", &off)
        },
        &off,
    )
    .unwrap();
    let mut files = Vec::new();
    walk_files(&off, "", &mut files);
    assert!(!files.iter().any(|f| f.ends_with("_test.go")), "{files:?}");
    assert!(!exists(&off, "internal/testutil/testutil.go"));
    std::fs::remove_dir_all(&on).ok();
    std::fs::remove_dir_all(&off).ok();
}

// ── sdk.json driven generate ─────────────────────────────────────────────────

#[test]
fn language_aliases_map_human_names_to_canonical_emitter_ids() {
    for (input, want) in [
        ("typescript", "node"),
        ("TS", "node"),
        ("csharp", "dotnet"),
        ("py", "python"),
        ("golang", "go"),
        ("go", "go"),
        ("cobol", "cobol"), // unknown passes through
    ] {
        assert_eq!(resolve_lang(input), want, "{input}");
    }
}

#[test]
fn single_target_typescript_emits_through_the_node_emitter() {
    let dir = tmp("sdkjson-single");
    let out = dir.join("ts-sdk");
    generate_command(
        &GenerateCommandOptions {
            inputs: ConverterInputs {
                sdk_name: Some("petstore".into()),
                ..Default::default()
            },
            output: out.to_string_lossy().to_string(),
            emitter_options: Some(obj(json!({ "packageName": "petstore" }))),
            ..gen("typescript", &dir)
        },
        &dir,
    )
    .unwrap();
    assert!(exists(&out, "src/client.ts"));
    assert!(exists(&out, "package.json"));
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn multi_target_builds_every_declared_language_with_behavior_restamped() {
    let dir = tmp("sdkjson-multi");
    let out = dir.join("out");
    write(
        &dir,
        "sdk.json",
        &json!({
            "version": 1,
            "sdkName": "petstore",
            "behavior": { "retry": { "maxRetries": 3 } },
            "typescript": { "output": out.join("ts").to_string_lossy(),
                            "behavior": { "retry": { "maxRetries": 7 } } },
            "go": { "modulePath": "github.com/acme/petstore",
                    "output": out.join("go").to_string_lossy() }
        }),
    );
    let config = resolve_config(&dir, None).unwrap().unwrap();
    generate_targets(
        &GenerateTargetsOptions {
            inputs: ConverterInputs {
                sdk_name: Some("petstore".into()),
                sdk: config.sdk.clone(),
                ..Default::default()
            },
            spec: spec(),
            output: out.to_string_lossy().to_string(),
            ..Default::default()
        },
        &config,
        &dir,
    )
    .unwrap();
    assert!(exists(&out, "ts/src/client.ts"));
    assert!(exists(&out, "go/client.go"));
    // Per-language behavior: ts overrides to 7, go keeps the global 3.
    assert!(read(&out, "ts/src/core/request.ts").contains("MAX_RETRIES = 7"));
    let go_cfg = read(&out, "go/internal/requestconfig/config.go");
    assert!(
        go_cfg.contains("MaxRetries") && go_cfg.contains("3"),
        "{go_cfg}"
    );
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn publish_identity_is_threaded_onto_every_manifest_with_per_language_overrides() {
    let dir = tmp("sdkjson-publish");
    let out = dir.join("out");
    write(
        &dir,
        "sdk.json",
        &json!({
            "version": 1,
            "sdkName": "petstore",
            "publish": { "author": "Acme", "license": "MIT",
                         "repository": "https://github.com/acme/petstore" },
            "typescript": { "output": out.join("ts").to_string_lossy() },
            "python": { "packageName": "petstore", "output": out.join("py").to_string_lossy(),
                        "publish": { "license": "Apache-2.0" } }
        }),
    );
    let config = resolve_config(&dir, None).unwrap().unwrap();
    generate_targets(
        &GenerateTargetsOptions {
            inputs: ConverterInputs {
                sdk_name: Some("petstore".into()),
                sdk: config.sdk.clone(),
                ..Default::default()
            },
            spec: spec(),
            output: out.to_string_lossy().to_string(),
            ..Default::default()
        },
        &config,
        &dir,
    )
    .unwrap();
    let pkg: Value = serde_json::from_str(&read(&out, "ts/package.json")).unwrap();
    assert_eq!(pkg["author"], json!("Acme"));
    assert_eq!(pkg["license"], json!("MIT"));
    assert_eq!(
        pkg["repository"],
        json!({ "type": "git", "url": "https://github.com/acme/petstore" })
    );
    // python's per-language publish overrides the license, keeps the author.
    let pyproject = read(&out, "py/pyproject.toml");
    assert!(
        pyproject.contains(r#"license = { text = "Apache-2.0" }"#),
        "{pyproject}"
    );
    assert!(
        pyproject.contains(r#"authors = [{ name = "Acme" }]"#),
        "{pyproject}"
    );
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn multi_target_with_an_unknown_language_throws() {
    let dir = tmp("sdkjson-unknown");
    write(
        &dir,
        "sdk.json",
        &json!({ "version": 1, "kotlin": { "output": "./k" } }),
    );
    let config = resolve_config(&dir, None).unwrap().unwrap();
    let err = generate_targets(
        &GenerateTargetsOptions {
            spec: spec(),
            output: dir.join("out").to_string_lossy().to_string(),
            ..Default::default()
        },
        &config,
        &dir,
    )
    .unwrap_err();
    assert!(
        err.0.starts_with("Unknown opensdk language: kotlin"),
        "{}",
        err.0
    );
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn a_config_with_no_language_sections_is_rejected() {
    let dir = tmp("sdkjson-empty");
    write(&dir, "sdk.json", &json!({ "version": 1 }));
    let config = resolve_config(&dir, None).unwrap().unwrap();
    let err = generate_targets(
        &GenerateTargetsOptions {
            spec: spec(),
            output: dir.join("out").to_string_lossy().to_string(),
            ..Default::default()
        },
        &config,
        &dir,
    )
    .unwrap_err();
    assert!(
        err.0.starts_with("No languages declared in the config."),
        "{}",
        err.0
    );
    std::fs::remove_dir_all(&dir).ok();
}

// ── CLI targets ──────────────────────────────────────────────────────────────

#[test]
fn cli_target_routing_and_the_option_split() {
    assert!(is_cli_target(Some("go-cli")) && is_cli_target(Some("RUST-CLI")));
    assert!(!is_cli_target(Some("go")) && !is_cli_target(None));
    // The routing relies on resolve_lang passing unknown ids through unchanged.
    assert_eq!(resolve_lang("go-cli"), "go-cli");
    assert_eq!(resolve_lang("rust-cli"), "rust-cli");
    for lang in ["go-cli", "rust-cli"] {
        assert!(
            !CLI_CONVERTER_KEYS
                .iter()
                .any(|k| cli_backend_keys(lang).contains(k)),
            "{lang} key sets overlap"
        );
    }
}

#[test]
fn generates_a_go_cli_project_through_the_opencli_pipeline() {
    let dir = tmp("cli-go");
    generate_command(
        &GenerateCommandOptions {
            inputs: ConverterInputs {
                sdk_name: Some("petstore".into()),
                ..Default::default()
            },
            ..gen("go-cli", &dir)
        },
        &dir,
    )
    .unwrap();
    assert!(exists(&dir, "go.mod"));
    assert!(exists(&dir, "cmd/petstore/main.go"));
    assert!(exists(&dir, "pkg/cmd/pets.go"));
    // The framework write lifecycle applies to CLI outputs too.
    assert!(exists(&dir, ".sdk/sdk.lock"));
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn generates_a_rust_cli_with_mixed_flat_options() {
    let dir = tmp("cli-rust");
    generate_command(
        &GenerateCommandOptions {
            emitter_options: Some(obj(
                json!({ "cliName": "petstore", "crateName": "petstore_cli" }),
            )),
            ..gen("rust-cli", &dir)
        },
        &dir,
    )
    .unwrap();
    assert!(read(&dir, "Cargo.toml").contains(r#"name = "petstore_cli""#));
    assert!(exists(&dir, "src/gen/cmd/pets.rs"));
    // The user-owned custom-code scaffold ships with every Rust CLI.
    assert!(exists(&dir, "src/custom/mod.rs"));
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn the_cli_name_defaults_from_sdk_name() {
    let dir = tmp("cli-name");
    generate_cli_target(
        &CliTargetOptions {
            spec: spec(),
            lang: "go-cli".into(),
            output: dir.to_string_lossy().to_string(),
            sdk_name: Some("acme".into()),
            ..Default::default()
        },
        &dir,
    )
    .unwrap();
    assert!(exists(&dir, "cmd/acme/main.go"));
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn a_pre_parsed_opensdk_ir_is_rejected_for_cli_targets() {
    let dir = tmp("cli-ir");
    let ir = dir.join("ir.json").to_string_lossy().to_string();
    parse_command(
        &ParseCommandOptions {
            inputs: ConverterInputs::default(),
            spec: spec(),
            output: Some(ir.clone()),
        },
        &dir,
    )
    .unwrap();
    let err = generate_command(
        &GenerateCommandOptions {
            spec: ir,
            output: dir.join("out").to_string_lossy().to_string(),
            ..gen("go-cli", &dir)
        },
        &dir,
    )
    .unwrap_err();
    assert!(
        err.0
            .contains("generate from the OpenAPI document, not a pre-parsed OpenSDK IR"),
        "{}",
        err.0
    );
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn dry_run_writes_nothing() {
    let dir = tmp("cli-dry");
    let out = dir.join("never-created");
    generate_command(
        &GenerateCommandOptions {
            dry_run: true,
            output: out.to_string_lossy().to_string(),
            ..gen("rust-cli", &dir)
        },
        &dir,
    )
    .unwrap();
    assert!(!out.exists());
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn generate_targets_partitions_sdk_and_cli_sections() {
    let dir = tmp("cli-partition");
    let out = dir.join("out");
    write(
        &dir,
        "sdk.json",
        &json!({
            "version": 1,
            "sdkName": "petstore",
            "go": { "output": out.join("go-sdk").to_string_lossy(), "tests": false },
            "go-cli": { "output": out.join("go-cli").to_string_lossy(), "cliName": "petstore" }
        }),
    );
    let config = resolve_config(&dir, None).unwrap().unwrap();
    generate_targets(
        &GenerateTargetsOptions {
            inputs: ConverterInputs {
                sdk_name: Some("petstore".into()),
                ..Default::default()
            },
            spec: spec(),
            output: out.to_string_lossy().to_string(),
            ..Default::default()
        },
        &config,
        &dir,
    )
    .unwrap();
    assert!(exists(&out, "go-sdk/client.go"));
    assert!(exists(&out, "go-cli/cmd/petstore/main.go"));
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn a_cli_only_config_generates_without_sdk_sections() {
    let dir = tmp("cli-only");
    let out = dir.join("out");
    write(
        &dir,
        "sdk.json",
        &json!({
            "version": 1,
            "rust-cli": { "output": out.join("rust-cli").to_string_lossy(), "cliName": "petstore" }
        }),
    );
    let config = resolve_config(&dir, None).unwrap().unwrap();
    generate_targets(
        &GenerateTargetsOptions {
            spec: spec(),
            output: out.to_string_lossy().to_string(),
            ..Default::default()
        },
        &config,
        &dir,
    )
    .unwrap();
    assert!(exists(&out, "rust-cli/Cargo.toml"));
    std::fs::remove_dir_all(&dir).ok();
}

// ── chain ────────────────────────────────────────────────────────────────────

#[test]
fn a_chain_with_an_sdk_target_and_a_cli_target_generates_both() {
    let dir = tmp("chain");
    let chain = write(
        &dir,
        "chain.json",
        &json!({
            "version": 1,
            "sources": { "petstore": { "inputs": [{ "location": spec() }] } },
            "targets": {
                "petstore-node": {
                    "target": "node", "source": "petstore",
                    "output": dir.join("sdk-node").to_string_lossy(),
                    "options": { "tests": false }
                },
                "petstore-cli": {
                    "target": "go-cli", "source": "petstore",
                    "output": dir.join("cli-go").to_string_lossy(),
                    "options": { "cliName": "petstore" }
                }
            }
        }),
    );
    run_chain(
        &RunOptions {
            chain,
            ..Default::default()
        },
        &dir,
    )
    .unwrap();
    assert!(exists(&dir, "sdk-node/package.json"));
    assert!(exists(&dir, "cli-go/cmd/petstore/main.go"));
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn chain_target_and_source_filters_are_validated() {
    let dir = tmp("chain-filters");
    let chain = write(
        &dir,
        "chain.json",
        &json!({
            "version": 1,
            "sources": { "main": { "inputs": [{ "location": spec() }] } },
            "targets": { "go-sdk": { "target": "go", "source": "main",
                                     "output": dir.join("go").to_string_lossy() } }
        }),
    );
    let base = RunOptions {
        chain: chain.clone(),
        dry_run: true,
        ..Default::default()
    };
    assert_eq!(
        run_chain(
            &RunOptions {
                target: Some("nope".into()),
                ..base.clone()
            },
            &dir
        )
        .unwrap_err()
        .0,
        "Unknown target \"nope\""
    );
    assert_eq!(
        run_chain(
            &RunOptions {
                source: Some("nope".into()),
                ..base.clone()
            },
            &dir
        )
        .unwrap_err()
        .0,
        "Unknown source \"nope\""
    );
    // A valid --source that matches no target is its own error.
    let chain2 = write(
        &dir,
        "chain2.json",
        &json!({
            "version": 1,
            "sources": { "main": { "inputs": [{ "location": spec() }] },
                         "other": { "inputs": [{ "location": spec() }] } },
            "targets": { "go-sdk": { "target": "go", "source": "main",
                                     "output": dir.join("go").to_string_lossy() } }
        }),
    );
    assert_eq!(
        run_chain(
            &RunOptions {
                chain: chain2,
                source: Some("other".into()),
                dry_run: true,
                ..Default::default()
            },
            &dir
        )
        .unwrap_err()
        .0,
        "No targets to run for the given --target/--source."
    );
    std::fs::remove_dir_all(&dir).ok();
}

// ── publish ──────────────────────────────────────────────────────────────────

#[test]
fn publish_target_errors_clearly_when_the_generated_sdk_dir_is_missing() {
    let err = publish_target(
        "node",
        &std::env::temp_dir().join("does-not-exist-xyz"),
        &EmitterPublishOptions::default(),
    )
    .unwrap_err();
    assert!(err.0.starts_with("No generated SDK at "), "{}", err.0);
}

#[test]
fn publish_skips_cli_targets_without_throwing() {
    for lang in ["go-cli", "rust-cli"] {
        publish_target(
            lang,
            Path::new("/nonexistent-cli-dir"),
            &EmitterPublishOptions::default(),
        )
        .unwrap();
    }
}

#[test]
fn publish_command_errors_when_no_languages_are_declared() {
    let err = publish_command(
        &PublishCommandOptions {
            output: "./sdk".into(),
            ..Default::default()
        },
        None,
        &std::env::temp_dir(),
    )
    .unwrap_err();
    assert!(err.0.starts_with("No languages to publish."), "{}", err.0);
}

#[test]
fn publish_command_resolves_per_language_output_dirs_from_the_config() {
    let dir = tmp("publish-dirs");
    write(
        &dir,
        "sdk.json",
        &json!({
            "version": 1,
            "go": { "output": dir.join("nope-go").to_string_lossy() }
        }),
    );
    let config = resolve_config(&dir, None).unwrap().unwrap();
    let err = publish_command(
        &PublishCommandOptions {
            output: dir.to_string_lossy().to_string(),
            dry_run: true,
            ..Default::default()
        },
        Some(&config),
        &dir,
    )
    .unwrap_err();
    assert!(err.0.starts_with("No generated SDK at "), "{}", err.0);
    assert!(err.0.contains("nope-go"), "{}", err.0);
    std::fs::remove_dir_all(&dir).ok();
}

// ── diff ─────────────────────────────────────────────────────────────────────

#[test]
fn diff_exits_zero_when_both_sides_are_the_same_spec() {
    let dir = tmp("diff-same");
    let code = diff_command(
        &DiffCommandOptions {
            base: spec(),
            head: spec(),
            ..Default::default()
        },
        &dir,
    )
    .unwrap();
    assert_eq!(code, 0);
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn diff_json_mode_emits_the_machine_readable_irdiff() {
    // The JSON payload is `IrDiff` verbatim; the report/exit table is pinned by
    // the oracle, so this only proves the `--json` branch serializes the shape
    // the TypeScript documents.
    let base = json!({
        "opensdk": "1.0.0", "info": { "title": "t", "version": "1" },
        "resources": [{ "name": "pets", "methods": [
            { "action": "list", "httpMethod": "GET", "path": "/pets" },
            { "action": "retrieve", "httpMethod": "GET", "path": "/pets/{id}" }]}]
    });
    let mut head = base.clone();
    head["resources"][0]["methods"] = json!([base["resources"][0]["methods"][0]]);
    let diff = xyd_opensdk_diff::diff_ir(&base, &head);
    let payload = serde_json::to_value(&diff).unwrap();
    assert_eq!(payload["changes"].as_array().unwrap().len(), 1);
    assert_eq!(payload["changes"][0]["severity"], json!("breaking"));
    assert_eq!(payload["changes"][0]["kind"], json!("method-removed"));
    assert_eq!(payload["changes"][0]["path"], json!("pets.retrieve"));
    assert!(payload["changes"][0]["detail"].is_string());
}

#[test]
fn diff_rejects_an_invalid_fail_on_value() {
    use std::str::FromStr;
    assert!(DiffFailOn::from_str("oops").is_err());
    for ok in ["breaking", "risky", "any"] {
        assert!(DiffFailOn::from_str(ok).is_ok(), "{ok}");
    }
}

// ── init ─────────────────────────────────────────────────────────────────────

#[test]
fn init_scaffolds_sdk_json_by_default_once() {
    let dir = tmp("init");
    init_command(&InitOptions::default(), &dir).unwrap();
    let doc: Value = serde_json::from_str(&read(&dir, "sdk.json")).unwrap();
    assert_eq!(doc["version"], json!(1));
    assert!(doc["$schema"].as_str().unwrap().contains("sdk.schema.json"));
    assert!(doc["typescript"].is_object());
    let err = init_command(&InitOptions::default(), &dir).unwrap_err();
    assert!(err.0.contains("already initialized"), "{}", err.0);
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn init_scaffolds_the_mjs_bundle_with_format_mjs() {
    let dir = tmp("init-mjs");
    let opts = InitOptions {
        format: Some("mjs".into()),
        ..Default::default()
    };
    init_command(&opts, &dir).unwrap();
    assert!(read(&dir, "opensdk.config.mjs").contains("emitters"));
    assert!(init_command(&opts, &dir)
        .unwrap_err()
        .0
        .contains("already initialized"));
    std::fs::remove_dir_all(&dir).ok();
}

// ── xsdk ─────────────────────────────────────────────────────────────────────

#[test]
fn xsdk_writes_an_enriched_spec_with_root_and_per_operation_artifacts() {
    let dir = tmp("xsdk");
    let out = dir.join("enriched.json").to_string_lossy().to_string();
    xsdk_command(&XsdkCommandOptions {
        spec: spec(),
        output: Some(out.clone()),
        langs: None,
    })
    .unwrap();
    let doc: Value = serde_json::from_str(&std::fs::read_to_string(&out).unwrap()).unwrap();
    assert_eq!(
        doc["x-sdk"]["languages"],
        json!(["go", "python", "typescript", "ruby", "java", "csharp"])
    );
    let ops: Vec<&Value> = doc["paths"]
        .as_object()
        .unwrap()
        .values()
        .flat_map(|p| p.as_object().unwrap().values())
        .filter(|op| op.is_object() && op.get("x-sdk").is_some())
        .collect();
    assert!(!ops.is_empty());
    let first = &ops[0]["x-sdk"];
    assert!(first["python"]["signature"]
        .as_str()
        .is_some_and(|s| !s.is_empty()));
    assert!(first["python"]["usage"]
        .as_str()
        .is_some_and(|s| !s.is_empty()));
    assert!(first["python"]["types"]["request"].is_object());
    assert!(first["python"]["types"]["response"].is_object());
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn xsdk_honors_langs_and_picks_yaml_output_from_the_extension() {
    let dir = tmp("xsdk-yaml");
    let out = dir.join("enriched.yaml").to_string_lossy().to_string();
    xsdk_command(&XsdkCommandOptions {
        spec: spec(),
        output: Some(out.clone()),
        langs: Some(vec!["go".into(), "python".into()]),
    })
    .unwrap();
    let raw = std::fs::read_to_string(&out).unwrap();
    let doc: Value = serde_yaml::from_str(&raw).unwrap();
    assert_eq!(doc["x-sdk"]["languages"], json!(["go", "python"]));
    let op = doc["paths"]
        .as_object()
        .unwrap()
        .values()
        .flat_map(|p| p.as_object().unwrap().values())
        .find(|op| op.is_object() && op.get("x-sdk").is_some())
        .unwrap();
    let keys: Vec<&String> = op["x-sdk"].as_object().unwrap().keys().collect();
    assert_eq!(keys, vec!["go", "python"]);
    // The enriched spec must remain a VALID spec: $refs survive as maps, not anchors.
    assert!(!raw.contains("&ref"), "yaml anchors leaked");
    std::fs::remove_dir_all(&dir).ok();
}

// ── the regen lifecycle wiring ───────────────────────────────────────────────

#[test]
fn regenerating_leaves_a_lock_and_merge_preserves_hand_edits() {
    let dir = tmp("regen");
    generate_command(&gen("go", &dir), &dir).unwrap();
    assert!(exists(&dir, ".sdk/sdk.lock"), "the manifest is written");

    // Hand-edit a generated file, then regenerate WITHOUT --merge: overwritten.
    let edited = dir.join("go.mod");
    std::fs::write(&edited, "module hand/edited\n\ngo 1.22\n").unwrap();
    generate_command(&gen("go", &dir), &dir).unwrap();
    assert!(
        !read(&dir, "go.mod").contains("hand/edited"),
        "a plain regen overwrites"
    );

    // …and WITH merge: the base snapshot is staged so hand-edits can survive.
    let merged = tmp("regen-merge");
    generate_command(
        &GenerateCommandOptions {
            merge: true,
            ..gen("go", &merged)
        },
        &merged,
    )
    .unwrap();
    assert!(
        merged.join(".sdk/base").is_dir(),
        "--merge stages the 3-way-merge ancestors"
    );
    std::fs::remove_dir_all(&dir).ok();
    std::fs::remove_dir_all(&merged).ok();
}

// ── the dropped capability ───────────────────────────────────────────────────

#[test]
fn a_js_plugin_bundle_config_fails_with_a_pointer_to_sdk_json() {
    // DIVERGENCE (deliberate): the TS loads `opensdk.config.mjs` via dynamic
    // import to register custom emitters. A Rust binary has no JS engine, so it
    // must REPORT rather than silently ignore the file.
    let dir = tmp("mjs-config");
    std::fs::write(
        dir.join("opensdk.config.mjs"),
        "export default { sdkName: 'from-mjs' };\n",
    )
    .unwrap();
    let err = resolve_config(&dir, None).unwrap_err();
    assert!(err.0.contains("opensdk.config"), "{}", err.0);
    assert!(err.0.contains("opensdk init --format json"), "{}", err.0);

    // …but an sdk.json alongside it still WINS, exactly as in the TS, so a
    // mixed project keeps working.
    write(&dir, "sdk.json", &json!({ "version": 1, "go": {} }));
    let config = resolve_config(&dir, None).unwrap().unwrap();
    assert_eq!(config.source.unwrap().kind, "sdk-json");
    std::fs::remove_dir_all(&dir).ok();
}

// ── the argv layer (`main_with`) ─────────────────────────────────────────────

/// Drive the real command tree so the pieces the library API bypasses — flag
/// wiring, the config lookup, and the PROCESS EXIT CODE — are covered too.
fn cli(args: &[&str], cwd: &Path) -> i32 {
    let mut argv = vec!["opensdk".to_string()];
    argv.extend(args.iter().map(|s| s.to_string()));
    xyd_opensdk_cli::command::main_with(argv, cwd)
}

#[test]
fn the_argv_layer_drives_generate_and_reports_the_diff_exit_code() {
    let dir = tmp("argv");
    let out = dir.join("sdk");
    assert_eq!(
        cli(
            &[
                "generate",
                "--spec",
                &spec(),
                "--lang",
                "go",
                "--output",
                &out.to_string_lossy()
            ],
            &dir
        ),
        0
    );
    assert!(exists(&out, "client.go"));

    // diff sets the process exit code: 0 = no changes, 2 = breaking.
    assert_eq!(cli(&["diff", &spec(), &spec()], &dir), 0);

    let base = dir.join("base.json");
    let head = dir.join("head.json");
    let ir = json!({
        "opensdk": "1.0.0", "info": { "title": "t", "version": "1" },
        "resources": [{ "name": "pets", "methods": [
            { "action": "list", "httpMethod": "GET", "path": "/pets" },
            { "action": "retrieve", "httpMethod": "GET", "path": "/pets/{id}" }]}]
    });
    std::fs::write(&base, serde_json::to_string(&ir).unwrap()).unwrap();
    let mut shrunk = ir.clone();
    shrunk["resources"][0]["methods"] = json!([ir["resources"][0]["methods"][0]]);
    std::fs::write(&head, serde_json::to_string(&shrunk).unwrap()).unwrap();
    assert_eq!(
        cli(
            &["diff", &base.to_string_lossy(), &head.to_string_lossy()],
            &dir
        ),
        2
    );
    // A bad --fail-on is rejected during parsing, before dispatch. Usage errors
    // exit 1, matching commander (clap's own default would be 2).
    assert_eq!(
        cli(
            &[
                "diff",
                &base.to_string_lossy(),
                &head.to_string_lossy(),
                "--fail-on",
                "oops"
            ],
            &dir
        ),
        1
    );
    // …and `--help` is a success.
    assert_eq!(cli(&["--help"], &dir), 0);
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn the_argv_layer_accepts_config_before_or_after_the_subcommand() {
    let dir = tmp("argv-config");
    let out = dir.join("sdk");
    write(
        &dir,
        "custom.json",
        &json!({ "version": 1, "go": { "output": out.to_string_lossy() } }),
    );
    let custom = dir.join("custom.json").to_string_lossy().to_string();
    // `--config` is global: both positions resolve the same sdk.json, and the
    // per-language `output` from it is used when --output is omitted.
    for args in [
        vec![
            "--config",
            custom.as_str(),
            "generate",
            "--spec",
            &spec(),
            "--lang",
            "go",
        ],
        vec![
            "generate",
            "--config",
            custom.as_str(),
            "--spec",
            &spec(),
            "--lang",
            "go",
        ],
    ] {
        std::fs::remove_dir_all(&out).ok();
        assert_eq!(cli(&args, &dir), 0, "{args:?}");
        assert!(exists(&out, "client.go"), "{args:?}");
    }
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn the_argv_layer_falls_back_to_the_config_spec_when_spec_is_omitted() {
    // DIVERGENCE (additive): commander marks `generate --spec` REQUIRED, which
    // makes the TS's own `opts.spec ?? config?.spec` fallback unreachable from
    // the CLI. Here `--spec` is optional, so the documented sdk.json `api`/`spec`
    // key works. Passing `--spec` behaves identically to the TS.
    let dir = tmp("argv-config-spec");
    let out = dir.join("sdk");
    write(
        &dir,
        "sdk.json",
        &json!({ "version": 1, "api": spec(), "go": { "output": out.to_string_lossy() } }),
    );
    assert_eq!(cli(&["generate", "--lang", "go"], &dir), 0);
    assert!(exists(&out, "client.go"));

    // With neither, the error names both ways out.
    let bare = tmp("argv-no-spec");
    assert_eq!(cli(&["generate", "--lang", "go"], &bare), 1);
    std::fs::remove_dir_all(&dir).ok();
    std::fs::remove_dir_all(&bare).ok();
}

#[test]
fn init_does_not_resolve_a_config_first() {
    // `init` CREATES a config, so resolving one first would make it fail in a
    // directory that already holds an (unsupported) opensdk.config.mjs.
    let dir = tmp("argv-init");
    std::fs::write(dir.join("opensdk.config.mjs"), "export default {};\n").unwrap();
    assert_eq!(cli(&["init"], &dir), 0);
    assert!(exists(&dir, "sdk.json"));
    std::fs::remove_dir_all(&dir).ok();
}

// ── the real binary ──────────────────────────────────────────────────────────

/// Run the compiled `opensdk` binary, returning `(exit code, stdout, stderr)`.
///
/// Needed for the assertions that are only visible on the WIRE: the console
/// output (a re-processed chain source is otherwise indistinguishable from a
/// cached one) and the process exit status itself.
fn run_bin(args: &[&str], cwd: &Path) -> (i32, String, String) {
    let out = std::process::Command::new(env!("CARGO_BIN_EXE_opensdk"))
        .args(args)
        .current_dir(cwd)
        .output()
        .expect("run the opensdk binary");
    (
        out.status.code().unwrap_or(-1),
        String::from_utf8_lossy(&out.stdout).to_string(),
        String::from_utf8_lossy(&out.stderr).to_string(),
    )
}

#[test]
fn a_chain_source_shared_by_two_targets_is_processed_exactly_once() {
    let dir = tmp("chain-once");
    write(
        &dir,
        "chain.json",
        &json!({
            "version": 1,
            "sources": { "petstore": { "inputs": [{ "location": spec() }] } },
            "targets": {
                "a": { "target": "go", "source": "petstore",
                       "output": dir.join("a").to_string_lossy(), "options": { "tests": false } },
                "b": { "target": "python", "source": "petstore",
                       "output": dir.join("b").to_string_lossy(), "options": { "tests": false } }
            }
        }),
    );
    let (code, stdout, stderr) = run_bin(&["run"], &dir);
    assert_eq!(code, 0, "stderr: {stderr}");
    assert_eq!(
        stdout.matches("Processed source \"petstore\"").count(),
        1,
        "the source must be processed once for both targets:\n{stdout}"
    );
    assert_eq!(stdout.matches("Generating target").count(), 2, "{stdout}");
    assert!(exists(&dir, "a/client.go") && exists(&dir, "b/pyproject.toml"));
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn the_binary_reports_errors_on_stderr_and_exits_one() {
    let dir = tmp("bin-err");
    let (code, _, stderr) = run_bin(&["generate", "--spec", &spec(), "--lang", "cobol"], &dir);
    assert_eq!(code, 1);
    assert!(
        stderr.contains("Unknown opensdk language: cobol"),
        "{stderr}"
    );
    std::fs::remove_dir_all(&dir).ok();
}

// ── per-file write modes on REGENERATION ─────────────────────────────────────

#[test]
fn regeneration_honors_the_emitters_per_file_write_modes() {
    // On a FRESH directory every write mode behaves like `overwrite`, so this
    // only shows up on the second run: node declares `tsconfig.json`/`README.md`
    // as `skipIfExists` (user-owned scaffolds) and `package.json` as `mergeJson`
    // (the user's keys win).
    let dir = tmp("write-modes");
    let opts = GenerateCommandOptions {
        emitter_options: Some(obj(json!({ "packageName": "petstore" }))),
        ..gen("typescript", &dir)
    };
    generate_command(&opts, &dir).unwrap();

    std::fs::write(dir.join("tsconfig.json"), "{ \"mine\": true }\n").unwrap();
    let mut pkg: Value = serde_json::from_str(&read(&dir, "package.json")).unwrap();
    pkg["scripts"] = json!({ "mine": "echo hi" });
    std::fs::write(
        dir.join("package.json"),
        serde_json::to_string_pretty(&pkg).unwrap(),
    )
    .unwrap();

    generate_command(&opts, &dir).unwrap();

    // skipIfExists: the user's scaffold is never clobbered.
    assert_eq!(read(&dir, "tsconfig.json"), "{ \"mine\": true }\n");
    // mergeJson: the user's key survives alongside the generated ones.
    let merged: Value = serde_json::from_str(&read(&dir, "package.json")).unwrap();
    assert_eq!(merged["scripts"]["mine"], json!("echo hi"));
    assert_eq!(merged["name"], json!("petstore"));
    // …while a plain `overwrite` file is regenerated.
    std::fs::write(dir.join("src/client.ts"), "// gone\n").unwrap();
    generate_command(&opts, &dir).unwrap();
    assert_ne!(read(&dir, "src/client.ts"), "// gone\n");
    std::fs::remove_dir_all(&dir).ok();
}
