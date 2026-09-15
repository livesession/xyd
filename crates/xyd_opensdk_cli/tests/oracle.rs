//! The gate: every `__fixtures__/<group>/<case>/output.json` was produced by the
//! REAL TypeScript (`packages/xyd-opensdk-cli/__tests__/rust-oracle.test.ts`
//! under `O2S_BUILD_DOCS=1`) and this test asserts the Rust port reproduces it.
//!
//! The goldens are the ORACLE. If Rust and a golden disagree, the Rust is wrong
//! — never regenerate a golden to make this pass. (The TS generator doubles as
//! its own regen guard, so the TS cannot drift away from them either, for as
//! long as the TS still exists.)
//!
//! Comparison is on parsed `serde_json::Value`s. With serde_json's
//! `preserve_order`, `Value::Object` is an `IndexMap` whose `PartialEq` is
//! order-INSENSITIVE — exactly the vitest `toEqual` semantics the oracle was
//! written under. Every place where order IS load-bearing therefore also
//! carries an explicit `*Keys`/`*Order` ARRAY in the golden (array equality is
//! ordered), which is what actually pins it.

use std::path::{Path, PathBuf};

use serde_json::{json, Map, Value};

use xyd_opensdk_cli::cli_targets::{
    cli_backend_keys, is_cli_target, split_cli_options, CLI_CONVERTER_KEYS,
};
use xyd_opensdk_cli::config::{resolve_config, ResolvedConfig};
use xyd_opensdk_cli::diff::{exit_code, render_report, DiffFailOn};
use xyd_opensdk_cli::generate::{apply_publish_identity, load_ir};
use xyd_opensdk_cli::grouping::{converter_options, load_grouping, ConverterInputs};
use xyd_opensdk_cli::init::{init_command, init_plan, InitOptions};

/// Replaced with the case directory's absolute path at run time (and folded
/// back before comparing, so goldens stay machine-independent).
const CASE_TOKEN: &str = "__CASE__";

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__")
}

fn read_json(path: &Path) -> Value {
    let raw =
        std::fs::read_to_string(path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()));
    serde_json::from_str(&raw).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()))
}

/// `<group>` case directories that contain an `input.json`, sorted.
fn cases(group: &str) -> Vec<PathBuf> {
    let dir = fixtures_dir().join(group);
    let Ok(entries) = std::fs::read_dir(&dir) else {
        return Vec::new();
    };
    let mut out: Vec<PathBuf> = entries
        .filter_map(Result::ok)
        .map(|e| e.path())
        .filter(|p| p.join("input.json").is_file())
        .collect();
    out.sort();
    out
}

fn case_id(case: &Path) -> String {
    case.file_name().unwrap().to_string_lossy().to_string()
}

fn case_dir_str(case: &Path) -> String {
    case.to_string_lossy().to_string()
}

/// Substitute `__CASE__` with the case dir, recursively (mirrors the TS `sub`).
fn sub(value: &Value, case_dir: &str) -> Value {
    match value {
        Value::String(s) => Value::String(s.replace(CASE_TOKEN, case_dir)),
        Value::Array(a) => Value::Array(a.iter().map(|v| sub(v, case_dir)).collect()),
        Value::Object(o) => Value::Object(
            o.iter()
                .map(|(k, v)| (k.clone(), sub(v, case_dir)))
                .collect(),
        ),
        other => other.clone(),
    }
}

/// Fold the case dir back to `__CASE__` (mirrors the TS `unsub`).
fn unsub(text: &str, case_dir: &str) -> String {
    text.replace(case_dir, CASE_TOKEN)
}

fn or_null(v: Option<&Value>) -> Value {
    v.cloned().unwrap_or(Value::Null)
}

fn keys_of(v: Option<&Value>) -> Value {
    match v {
        Some(Value::Object(o)) => Value::Array(
            o.keys()
                .map(|k| Value::String(k.clone()))
                .collect::<Vec<_>>(),
        ),
        _ => Value::Null,
    }
}

fn opt_str(v: Option<&String>) -> Value {
    v.map_or(Value::Null, |s| Value::String(s.clone()))
}

// ── converter-options ────────────────────────────────────────────────────────

fn inputs_from(value: &Value) -> ConverterInputs {
    ConverterInputs {
        sdk_name: value
            .get("sdkName")
            .and_then(Value::as_str)
            .map(str::to_string),
        mount_rules: value.get("mountRules").cloned(),
        operation_hints: value.get("operationHints").cloned(),
        grouping: value
            .get("grouping")
            .and_then(Value::as_str)
            .map(str::to_string),
        sdk: value.get("sdk").cloned(),
    }
}

fn run_converter_options(case: &Path) -> Value {
    let dir = case_dir_str(case);
    let input = read_json(&case.join("input.json"));
    let inputs = inputs_from(&sub(input.get("inputs").unwrap_or(&json!({})), &dir));
    match converter_options(&inputs, case) {
        Err(e) => json!({ "error": unsub(&e.0, &dir) }),
        Ok(options) => {
            let keys: Vec<Value> = options.keys().map(|k| Value::String(k.clone())).collect();
            json!({ "options": Value::Object(options), "optionKeys": keys })
        }
    }
}

fn run_load_grouping(case: &Path) -> Value {
    let dir = case_dir_str(case);
    let input = read_json(&case.join("input.json"));
    let path = sub(&input["grouping"], &dir);
    match load_grouping(path.as_str().unwrap(), case) {
        Err(e) => json!({ "error": unsub(&e.0, &dir) }),
        Ok(g) => json!({
            "mountRules": or_null(g.mount_rules.as_ref()),
            "operationHints": or_null(g.operation_hints.as_ref()),
            "mountRuleKeys": keys_of(g.mount_rules.as_ref()),
        }),
    }
}

// ── resolved-config ──────────────────────────────────────────────────────────

fn project_config(c: Option<&ResolvedConfig>, case_dir: &str) -> Value {
    let Some(c) = c else { return Value::Null };
    let emitter_options: Vec<Value> = c
        .emitter_options
        .iter()
        .map(|(lang, opts)| {
            let keys: Vec<Value> = opts.keys().map(|k| Value::String(k.clone())).collect();
            json!({ "lang": lang, "options": Value::Object(opts.clone()), "optionKeys": keys })
        })
        .collect();
    let targets: Vec<Value> = c
        .targets
        .iter()
        .map(|(lang, t)| {
            let publish = t
                .publish
                .as_ref()
                .map(|p| serde_json::to_value(p).expect("publish serializes"));
            json!({
                "lang": lang,
                "output": opt_str(t.output.as_ref()),
                "behavior": or_null(t.behavior.as_ref()),
                "publish": or_null(publish.as_ref()),
                "publishKeys": keys_of(publish.as_ref()),
                "merge": t.merge.map_or(Value::Null, Value::Bool),
            })
        })
        .collect();
    let publish = c
        .publish
        .as_ref()
        .map(|p| serde_json::to_value(p).expect("publish serializes"));
    json!({
        "spec": c.spec.as_ref().map_or(Value::Null, |s| Value::String(unsub(s, case_dir))),
        "sdkName": opt_str(c.sdk_name.as_ref()),
        "sdk": or_null(c.sdk.as_ref()),
        "mountRules": or_null(c.mount_rules.as_ref()),
        "mountRuleKeys": keys_of(c.mount_rules.as_ref()),
        "operationHints": or_null(c.operation_hints.as_ref()),
        "publish": or_null(publish.as_ref()),
        "publishKeys": keys_of(publish.as_ref()),
        "merge": c.merge.map_or(Value::Null, Value::Bool),
        // The TS leaves both fields UNSET when empty; the Rust models that as an
        // empty Vec, so `has*` is the emptiness test.
        "hasEmitterOptions": !c.emitter_options.is_empty(),
        "hasTargets": !c.targets.is_empty(),
        "declaredLanguages": c.declared_languages(),
        "emitterOptions": emitter_options,
        "targets": targets,
        "sourceKind": c.source.as_ref().map_or(Value::Null, |s| Value::String(s.kind.clone())),
        "sourceFilePath": c.source.as_ref().map_or(Value::Null, |s| Value::String(unsub(&s.file_path, case_dir))),
    })
}

fn run_resolved_config(case: &Path) -> Value {
    let dir = case_dir_str(case);
    let input = read_json(&case.join("input.json"));
    let explicit = input
        .get("explicitPath")
        .and_then(Value::as_str)
        .map(|s| s.replace(CASE_TOKEN, &dir));
    match resolve_config(case, explicit.as_deref()) {
        Err(e) => json!({ "error": unsub(&e.0, &dir) }),
        Ok(c) => json!({ "config": project_config(c.as_ref(), &dir) }),
    }
}

// ── cli-split ────────────────────────────────────────────────────────────────

fn run_cli_split(case: &Path) -> Value {
    let input = read_json(&case.join("input.json"));
    let lang = input["lang"].as_str().unwrap();
    let bag: Map<String, Value> = input["bag"].as_object().cloned().unwrap_or_default();
    let (split, error) = match split_cli_options(lang, &bag) {
        Ok(s) => {
            let converter_order: Vec<Value> = s
                .converter
                .keys()
                .map(|k| Value::String(k.clone()))
                .collect();
            let backend_order: Vec<Value> =
                s.backend.keys().map(|k| Value::String(k.clone())).collect();
            (
                json!({
                    "converter": Value::Object(s.converter),
                    "backend": Value::Object(s.backend),
                    "converterOrder": converter_order,
                    "backendOrder": backend_order,
                }),
                Value::Null,
            )
        }
        Err(e) => (Value::Null, Value::String(e.0)),
    };
    json!({
        "isCliTarget": is_cli_target(Some(lang)),
        "backendKeys": cli_backend_keys(lang),
        "converterKeys": CLI_CONVERTER_KEYS,
        "split": split,
        "error": error,
    })
}

// ── diff-report ──────────────────────────────────────────────────────────────

fn run_diff_report(case: &Path) -> Value {
    let empty = Map::new();
    let base = load_ir(&case.join("base.json").to_string_lossy(), &empty).expect("base IR");
    let head = load_ir(&case.join("head.json").to_string_lossy(), &empty).expect("head IR");
    let diff = xyd_opensdk_diff::diff_ir(&base, &head);
    // One entry per `console.log` — the TS captures `calls.map(join(' '))`, so
    // the final newline never enters the comparison.
    let report = render_report(&diff);
    let lines: Vec<Value> = report
        .strip_suffix('\n')
        .unwrap_or(&report)
        .split('\n')
        .map(|l| Value::String(l.to_string()))
        .collect();
    json!({
        "reportLines": lines,
        "exit": {
            "breaking": exit_code(&diff, DiffFailOn::Breaking),
            "risky": exit_code(&diff, DiffFailOn::Risky),
            "any": exit_code(&diff, DiffFailOn::Any),
        }
    })
}

// ── init-templates ───────────────────────────────────────────────────────────

fn run_init_template(case: &Path) -> Value {
    let input = read_json(&case.join("input.json"));
    let opts = InitOptions {
        project: None,
        format: input
            .get("format")
            .and_then(Value::as_str)
            .map(str::to_string),
        dir: input.get("dir").and_then(Value::as_str).map(str::to_string),
        lang: input
            .get("lang")
            .and_then(Value::as_str)
            .map(str::to_string),
        chain: input.get("chain").and_then(Value::as_bool).unwrap_or(false),
    };
    // A throwaway project dir, exactly like the TS oracle's mkdtemp.
    let tmp = std::env::temp_dir().join(format!(
        "opensdk-rs-oracle-init-{}-{}",
        std::process::id(),
        case_id(case)
    ));
    std::fs::remove_dir_all(&tmp).ok();
    std::fs::create_dir_all(&tmp).expect("create temp project");
    let tmp_str = tmp.to_string_lossy().to_string();

    let plan = init_plan(&opts, &tmp);
    init_command(&opts, &tmp).expect("first init succeeds");
    let body = std::fs::read_to_string(&plan.path).expect("scaffold written");
    let rerun = init_command(&opts, &tmp)
        .err()
        .map_or(Value::Null, |e| Value::String(e.0));
    let rel = plan
        .path
        .strip_prefix(&format!("{tmp_str}/"))
        .unwrap_or(&plan.path)
        .to_string();
    std::fs::remove_dir_all(&tmp).ok();

    json!({
        "relPath": rel,
        "body": body,
        "logged": [format!("Created {}", unsub(&plan.path, &tmp_str))],
        "rerunError": rerun,
    })
}

// ── publish-identity ─────────────────────────────────────────────────────────

fn run_publish_identity(case: &Path) -> Value {
    let input = read_json(&case.join("input.json"));
    let info = input["info"].clone();
    let publish: Option<xyd_opensdk_config::PublishTarget> = match input.get("publish") {
        None | Some(Value::Null) => None,
        Some(v) => Some(serde_json::from_value(v.clone()).expect("publish parses")),
    };
    let out = apply_publish_identity(&info, publish.as_ref());
    let keys: Vec<Value> = out
        .as_object()
        .unwrap()
        .keys()
        .map(|k| Value::String(k.clone()))
        .collect();
    json!({
        "info": out,
        "infoKeys": keys,
        // The input must never be mutated — per-language calls share one base.
        "inputUnchanged": input["info"] == info,
    })
}

// ── generate-tree ────────────────────────────────────────────────────────────
//
// The BEHAVIOURAL half: `generate` writes a tree, so the golden is a MANIFEST of
// the tree the real TypeScript produced — every relative path with the sha256 of
// its bytes. This covers option threading, publish identity, the multi-target
// loop, CLI-target routing, and the `write_project` lifecycle (`.sdk/sdk.lock`
// is part of the tree) in one comparison.

/// The repo root, from `crates/xyd_opensdk_cli`.
fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .expect("repo root")
}

const PETSTORE: &str = "crates/xyd_openapi2opensdk/__fixtures__/1.basic/input.json";

fn sha256_hex(bytes: &[u8]) -> String {
    // The framework already owns a sha256 over UTF-8; generated SDKs are all
    // text, so reuse it rather than adding a hashing dependency here.
    xyd_opensdk_framework::sha256_hex(&String::from_utf8_lossy(bytes))
}

fn tree_manifest(root: &Path, prefix: &str, out: &mut Map<String, Value>) {
    let dir = if prefix.is_empty() {
        root.to_path_buf()
    } else {
        root.join(prefix)
    };
    let Ok(entries) = std::fs::read_dir(&dir) else {
        return;
    };
    let mut names: Vec<(String, bool)> = entries
        .filter_map(Result::ok)
        .map(|e| {
            (
                e.file_name().to_string_lossy().to_string(),
                e.path().is_dir(),
            )
        })
        .collect();
    names.sort();
    for (name, is_dir) in names {
        let rel = if prefix.is_empty() {
            name.clone()
        } else {
            format!("{prefix}/{name}")
        };
        if is_dir {
            tree_manifest(root, &rel, out);
        } else {
            let bytes = std::fs::read(root.join(&rel)).expect("read generated file");
            out.insert(rel, Value::String(sha256_hex(&bytes)));
        }
    }
}

fn run_generate_tree(case: &Path) -> Value {
    use xyd_opensdk_cli::generate::{
        generate_command, generate_targets, GenerateCommandOptions, GenerateTargetsOptions,
    };
    use xyd_opensdk_cli::parse::{parse_command, ParseCommandOptions};

    let input = read_json(&case.join("input.json"));
    let spec = repo_root().join(PETSTORE).to_string_lossy().to_string();
    let out = std::env::temp_dir().join(format!(
        "opensdk-rs-oracle-tree-{}-{}",
        std::process::id(),
        case_id(case)
    ));
    std::fs::remove_dir_all(&out).ok();
    std::fs::create_dir_all(&out).expect("temp out dir");
    let sdk_out = out.join("sdk").to_string_lossy().to_string();

    // A pre-parsed OpenSDK IR exercises `load_ir`'s pass-through branch.
    let mut source = spec.clone();
    if input.get("fromIr").and_then(Value::as_bool) == Some(true) {
        source = out.join("ir.json").to_string_lossy().to_string();
        parse_command(
            &ParseCommandOptions {
                inputs: ConverterInputs::default(),
                spec: spec.clone(),
                output: Some(source.clone()),
            },
            &out,
        )
        .expect("parse to IR");
    }

    let inputs = ConverterInputs {
        sdk_name: input
            .get("sdkName")
            .and_then(Value::as_str)
            .map(str::to_string),
        mount_rules: input.get("mountRules").cloned(),
        operation_hints: None,
        grouping: None,
        sdk: None,
    };
    let dry_run = input.get("dryRun").and_then(Value::as_bool) == Some(true);
    let no_tests = input.get("noTests").and_then(Value::as_bool) == Some(true);

    if input.get("mode").and_then(Value::as_str) == Some("targets") {
        let config = resolve_config(case, None)
            .expect("resolve sdk.json")
            .expect("sdk.json present");
        generate_targets(
            &GenerateTargetsOptions {
                inputs: ConverterInputs {
                    sdk: config.sdk.clone(),
                    ..inputs
                },
                spec: source.clone(),
                output: sdk_out,
                dry_run,
                no_tests,
                merge: false,
            },
            &config,
            &out,
        )
        .expect("generate targets");
    } else {
        generate_command(
            &GenerateCommandOptions {
                inputs,
                spec: source.clone(),
                lang: input["lang"].as_str().expect("lang").to_string(),
                output: sdk_out,
                dry_run,
                no_tests,
                emitter_options: input
                    .get("emitterOptions")
                    .and_then(Value::as_object)
                    .cloned(),
                publish: input
                    .get("publish")
                    .map(|p| serde_json::from_value(p.clone()).expect("publish parses")),
                merge: false,
            },
            &out,
        )
        .expect("generate");
    }

    // The IR staging file is an input, not part of the generated tree.
    if source != spec {
        std::fs::remove_file(&source).ok();
    }
    let mut files = Map::new();
    tree_manifest(&out, "", &mut files);
    std::fs::remove_dir_all(&out).ok();
    json!({ "fileCount": files.len(), "files": Value::Object(files) })
}

// ── the gate ─────────────────────────────────────────────────────────────────

type Runner = fn(&Path) -> Value;

fn groups() -> Vec<(&'static str, Runner)> {
    vec![
        ("converter-options", run_converter_options as Runner),
        ("load-grouping", run_load_grouping as Runner),
        ("resolved-config", run_resolved_config as Runner),
        ("cli-split", run_cli_split as Runner),
        ("diff-report", run_diff_report as Runner),
        ("init-templates", run_init_template as Runner),
        ("publish-identity", run_publish_identity as Runner),
        ("generate-tree", run_generate_tree as Runner),
    ]
}

#[test]
fn every_fixture_matches_its_typescript_golden() {
    let mut checked = 0usize;
    let mut failures: Vec<String> = Vec::new();
    for (group, run) in groups() {
        for case in cases(group) {
            let id = format!("{group}/{}", case_id(&case));
            let golden_path = case.join("output.json");
            assert!(
                golden_path.is_file(),
                "{id}: golden missing — run the TS generator with O2S_BUILD_DOCS=1"
            );
            let golden = read_json(&golden_path);
            let actual = run(&case);
            if actual != golden {
                failures.push(format!(
                    "{id}\n  expected: {}\n  actual:   {}",
                    serde_json::to_string_pretty(&golden).unwrap(),
                    serde_json::to_string_pretty(&actual).unwrap()
                ));
            }
            checked += 1;
        }
    }
    assert!(
        failures.is_empty(),
        "{} of {checked} case(s) diverge from the TypeScript oracle:\n\n{}",
        failures.len(),
        failures.join("\n\n")
    );
    // A silently-empty corpus would make this test vacuously green.
    assert!(
        checked >= 40,
        "only {checked} oracle cases ran — the corpus is incomplete"
    );
}

/// Every group must actually contribute cases (a renamed directory would
/// otherwise silently drop a whole capability from the gate).
#[test]
fn no_group_is_empty() {
    for (group, _) in groups() {
        assert!(
            !cases(group).is_empty(),
            "fixture group `{group}` has no cases"
        );
    }
}
