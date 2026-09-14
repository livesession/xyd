//! The gate: every `__fixtures__/<group>/<case>/output.json` was produced by the
//! REAL TypeScript (`packages/xyd-opensdk-core/__tests__/rust-oracle.test.ts`
//! under `O2S_BUILD_DOCS=1`) and this test asserts the Rust port reproduces it.
//!
//! The goldens are the ORACLE. If Rust and a golden disagree, the Rust is wrong
//! — never regenerate a golden to make this pass. (The TS generator is also its
//! own regen guard, so the TS cannot drift away from them either, for as long as
//! the TS still exists.)
//!
//! Comparison is on parsed `serde_json::Value`s. With serde_json's
//! `preserve_order`, a `Value::Object` is an `IndexMap`, whose `PartialEq` is
//! order-INSENSITIVE — which is exactly the vitest `toEqual` semantics the
//! oracle was written under. Where key order IS load-bearing
//! (`grouping.mountRules`, `chain.sources`/`targets`) it is pinned separately by
//! unit tests in `src/config.rs` and by `ordered_projections_are_not_just_sorted`
//! below.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde_json::{json, Map, Value};
use xyd_opensdk_config::{
    config::{
        ChainSource, ChainTarget, LanguageSection, OperationHint, PublishTarget, SdkGrouping,
    },
    find_type, load_opensdk_spec, merge_publish_targets, walk_methods, ChainJson,
    LoadOpensdkSpecOptions, SdkJson, SDK_JSON_DECLARED_KEYS,
};

/// JSON cannot express `undefined`; the corpus uses this sentinel (see the
/// matching constant in the TypeScript generator).
const UNDEFINED_SENTINEL: &str = "__UNDEFINED__";
/// Replaced with the case directory's absolute path at run time.
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

// ── projections (must mirror the TypeScript generator one-for-one) ────────────

fn opt(v: Option<&String>) -> Value {
    v.map_or(Value::Null, |s| Value::String(s.clone()))
}

fn opt_value(v: Option<&Value>) -> Value {
    v.cloned().unwrap_or(Value::Null)
}

/// `{ declared, extra }` — the split that proves the 8 fields were TYPED, not
/// passed through as an opaque bag.
fn project_publish(p: Option<&PublishTarget>) -> Value {
    let Some(p) = p else { return Value::Null };
    let mut declared = Map::new();
    let mut push = |k: &str, v: Option<&String>| {
        if let Some(v) = v {
            declared.insert(k.to_string(), Value::String(v.clone()));
        }
    };
    push("author", p.author.as_ref());
    push("license", p.license.as_ref());
    push("repository", p.repository.as_ref());
    push("homepage", p.homepage.as_ref());
    push("version", p.version.as_ref());
    push("registry", p.registry.as_ref());
    push("tokenEnv", p.token_env.as_ref());
    push("packageName", p.package_name.as_ref());
    json!({ "declared": Value::Object(declared), "extra": Value::Object(p.extra.clone()) })
}

fn project_hint(h: &OperationHint) -> Value {
    json!({ "mountOn": opt(h.mount_on.as_ref()), "action": opt(h.action.as_ref()) })
}

fn project_grouping(g: Option<&SdkGrouping>) -> Value {
    let Some(g) = g else { return Value::Null };
    let hints = match g.operation_hints.as_ref() {
        None => Value::Null,
        Some(map) => Value::Object(
            map.iter()
                .map(|(k, h)| (k.clone(), project_hint(h)))
                .collect(),
        ),
    };
    json!({
        "mountRules": g.mount_rules.clone().map_or(Value::Null, Value::Object),
        "operationHints": hints,
    })
}

fn project_section(s: &LanguageSection) -> Value {
    json!({
        "output": opt(s.output.as_ref()),
        "behavior": opt_value(s.behavior.as_ref()),
        "publish": project_publish(s.publish.as_ref()),
        "options": Value::Object(s.options.clone()),
    })
}

fn project_sdk_json(doc: &SdkJson) -> Value {
    let sections: Map<String, Value> = doc
        .sections()
        .iter()
        .map(|(k, s)| (k.clone(), project_section(s)))
        .collect();
    json!({
        "$schema": opt(doc.schema.as_ref()),
        "version": serde_json::to_value(&doc.version).unwrap(),
        "api": opt(doc.api.as_ref()),
        "spec": opt(doc.spec.as_ref()),
        "sdk": opt(doc.sdk.as_ref()),
        "sdkName": opt(doc.sdk_name.as_ref()),
        "behavior": opt_value(doc.behavior.as_ref()),
        "grouping": project_grouping(doc.grouping.as_ref()),
        "publish": project_publish(doc.publish.as_ref()),
        "sections": Value::Object(sections),
        "nonSectionKeys": Value::Object(doc.non_section_values()),
    })
}

fn project_chain_source(s: &ChainSource) -> Value {
    let locations = |v: &Vec<xyd_opensdk_config::ChainInput>| {
        Value::Array(
            v.iter()
                .map(|i| json!({ "location": i.location }))
                .collect(),
        )
    };
    json!({
        "inputs": locations(&s.inputs),
        "overlays": s.overlays.as_ref().map_or(Value::Null, locations),
        "output": opt(s.output.as_ref()),
    })
}

fn project_chain_target(t: &ChainTarget) -> Value {
    json!({
        "target": t.target,
        "source": t.source,
        "output": opt(t.output.as_ref()),
        "sdkName": opt(t.sdk_name.as_ref()),
        "behavior": opt_value(t.behavior.as_ref()),
        "grouping": project_grouping(t.grouping.as_ref()),
        "options": t.options.clone().map_or(Value::Null, Value::Object),
        "publish": project_publish(t.publish.as_ref()),
        "tests": t.tests.map_or(Value::Null, Value::Bool),
    })
}

fn project_chain_json(doc: &ChainJson) -> Value {
    let sources: Map<String, Value> = doc
        .sources()
        .iter()
        .map(|(k, s)| (k.clone(), project_chain_source(s)))
        .collect();
    let targets: Map<String, Value> = doc
        .targets()
        .iter()
        .map(|(k, t)| (k.clone(), project_chain_target(t)))
        .collect();
    json!({
        "$schema": opt(doc.schema.as_ref()),
        "version": serde_json::to_value(&doc.version).unwrap(),
        "behavior": opt_value(doc.behavior.as_ref()),
        "publish": project_publish(doc.publish.as_ref()),
        "sources": Value::Object(sources),
        "targets": Value::Object(targets),
    })
}

// ── per-group runners ────────────────────────────────────────────────────────

/// A corpus layer → a `PublishTarget`. `null` is an absent LAYER; a field whose
/// value is the sentinel is an absent FIELD (JS `{ license: undefined }`).
fn decode_layer(raw: &Value) -> Option<PublishTarget> {
    let obj = raw.as_object()?;
    let cleaned: Map<String, Value> = obj
        .iter()
        .filter(|(_, v)| v.as_str() != Some(UNDEFINED_SENTINEL))
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();
    Some(serde_json::from_value(Value::Object(cleaned)).expect("layer must fit PublishTarget"))
}

fn run_merge_publish(input: &Value) -> Value {
    let owned: Vec<Option<PublishTarget>> = input["layers"]
        .as_array()
        .expect("layers")
        .iter()
        .map(decode_layer)
        .collect();
    let layers: Vec<Option<&PublishTarget>> = owned.iter().map(Option::as_ref).collect();
    json!({ "result": project_publish(merge_publish_targets(&layers).as_ref()) })
}

fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .expect("repo root")
}

fn run_spec_helpers(input: &Value) -> Value {
    let spec = match input.get("specFile").and_then(Value::as_str) {
        Some(rel) => read_json(&repo_root().join(rel)),
        None => input["spec"].clone(),
    };
    let types: Map<String, Value> = input["lookups"]
        .as_array()
        .expect("lookups")
        .iter()
        .map(|n| {
            let name = n.as_str().expect("lookup name");
            (
                name.to_string(),
                find_type(&spec, name).cloned().unwrap_or(Value::Null),
            )
        })
        .collect();
    let walk: Vec<String> = walk_methods(&spec)
        .into_iter()
        .map(|(path, m)| {
            format!(
                "{} {}",
                path.join("/"),
                m.get("action").and_then(Value::as_str).unwrap_or("")
            )
        })
        .collect();
    json!({
        "types": Value::Object(types),
        "typeCount": spec.get("types").and_then(Value::as_array).map_or(0, Vec::len),
        "walk": walk,
    })
}

fn run_load_spec(input: &Value, case_dir: &Path) -> Value {
    let case = case_dir.to_string_lossy().to_string();
    let sub = |s: &str| s.replace(CASE_TOKEN, &case);
    let source = sub(input["source"].as_str().expect("source"));
    let opts = input["cwd"].as_str().map(|c| LoadOpensdkSpecOptions {
        cwd: Some(PathBuf::from(sub(c))),
    });
    json!({ "loaded": load_opensdk_spec(&source, opts.as_ref()).unwrap_or(Value::Null) })
}

// ── the gate ─────────────────────────────────────────────────────────────────

/// Every group's `<case> -> projection`, recomputed from the committed inputs.
fn build() -> BTreeMap<String, Value> {
    let mut out = BTreeMap::new();
    let mut add = |group: &str, case: &Path, value: Value| {
        out.insert(format!("{group}/{}", case_id(case)), value);
    };

    for case in cases("merge-publish") {
        let v = run_merge_publish(&read_json(&case.join("input.json")));
        add("merge-publish", &case, v);
    }
    for case in cases("sdk-json") {
        let doc: SdkJson = serde_json::from_value(read_json(&case.join("input.json")))
            .unwrap_or_else(|e| panic!("{}: {e}", case.display()));
        // A declared key that leaked into the index-signature bag would mean the
        // struct never typed it.
        for key in SDK_JSON_DECLARED_KEYS {
            assert!(
                !doc.rest.contains_key(*key),
                "{}: declared key {key} leaked into `rest`",
                case.display()
            );
        }
        let v = project_sdk_json(&doc);
        add("sdk-json", &case, v);
    }
    for case in cases("chain-json") {
        let doc: ChainJson = serde_json::from_value(read_json(&case.join("input.json")))
            .unwrap_or_else(|e| panic!("{}: {e}", case.display()));
        let v = project_chain_json(&doc);
        add("chain-json", &case, v);
    }
    for case in cases("spec-helpers") {
        let v = run_spec_helpers(&read_json(&case.join("input.json")));
        add("spec-helpers", &case, v);
    }
    for case in cases("load-spec") {
        let v = run_load_spec(&read_json(&case.join("input.json")), &case);
        add("load-spec", &case, v);
    }
    out
}

fn golden_path(id: &str) -> PathBuf {
    fixtures_dir().join(id).join("output.json")
}

#[test]
fn every_fixture_matches_the_typescript_golden() {
    let all = build();
    // A silently-empty corpus would make this vacuously green.
    assert!(
        all.len() >= 40,
        "expected the full corpus, found {} cases",
        all.len()
    );

    let mut failures: Vec<String> = Vec::new();
    for (id, got) in &all {
        let path = golden_path(id);
        if !path.is_file() {
            failures.push(format!("{id}: no committed golden at {}", path.display()));
            continue;
        }
        let want = read_json(&path);
        if got != &want {
            failures.push(format!(
                "{id}:\n  rust   = {}\n  oracle = {}",
                serde_json::to_string(got).unwrap(),
                serde_json::to_string(&want).unwrap()
            ));
        }
    }
    assert!(
        failures.is_empty(),
        "{} of {} fixtures diverge from the TypeScript oracle:\n\n{}",
        failures.len(),
        all.len(),
        failures.join("\n\n")
    );
}

/// The golden comparison is order-insensitive by design, so the two places where
/// key order IS load-bearing get their own assertion against real fixture data.
#[test]
fn ordered_projections_are_not_just_sorted() {
    // `grouping.mountRules` — the converter scans it longest-prefix-first with a
    // strict `>`, so a re-sort changes which rule wins on a length tie.
    let doc: SdkJson = serde_json::from_value(read_json(
        &fixtures_dir().join("sdk-json/07.real-openai-grouping/input.json"),
    ))
    .unwrap();
    let rules = doc.grouping.as_ref().unwrap().mount_rules.as_ref().unwrap();
    let order: Vec<&str> = rules.keys().map(String::as_str).collect();
    // File order, which is NOT sorted order — that is the whole point.
    assert_eq!(
        order,
        ["organization", "assistants", "threads", "chatkit"],
        "mountRules must keep file order"
    );
    let mut sorted = order.clone();
    sorted.sort_unstable();
    assert_ne!(order, sorted, "fixture no longer detects a re-sort");

    // `chain.sources` / `chain.targets` — `run_chain` processes them in
    // declaration order.
    let chain: ChainJson = serde_json::from_value(read_json(
        &fixtures_dir().join("chain-json/01.real-apitoolchain/input.json"),
    ))
    .unwrap();
    let sources: Vec<String> = chain.sources().into_iter().map(|(k, _)| k).collect();
    assert_eq!(sources, ["gitprovider", "registry-api", "api"]);
    let targets: Vec<String> = chain.targets().into_iter().map(|(k, _)| k).collect();
    assert_eq!(
        targets,
        [
            "gitprovider-node",
            "registry-api-node",
            "api-node",
            "api-cli"
        ]
    );
}
