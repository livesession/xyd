//! `emitterOptions` actually take effect — and, just as importantly, an EMPTY
//! options bag changes nothing.
//!
//! The parity suites prove the no-options path is byte-exact. They cannot prove
//! the options path does anything at all: a `resolve_*` that accepted `options`
//! and never read it would pass every one of them. That silent-ignore failure is
//! the thing this file exists to catch.
//!
//! Node is the richest case — it owns `busybox`, which is the only option that
//! ADDS a file and rewrites two others.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde_json::{json, Value};
use xyd_opensdk_node::{generate_node, generate_node_with};

fn fixture() -> Value {
    let p: PathBuf = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/xyd-opensdk-node/__fixtures__/1.basic/input.json");
    serde_json::from_str(&std::fs::read_to_string(p).unwrap()).unwrap()
}

fn gen(options: Value) -> BTreeMap<String, String> {
    generate_node_with(&fixture(), &options)
}

#[test]
fn an_empty_bag_is_a_no_op() {
    let base = generate_node(&fixture());
    assert_eq!(gen(json!({})), base, "{{}} must equal no options");
    assert_eq!(gen(Value::Null), base, "null must equal no options");
}

#[test]
fn package_name_reaches_the_manifest() {
    let files = gen(json!({ "packageName": "@acme/custom-sdk" }));
    let manifest = &files["package.json"];
    assert!(
        manifest.contains("\"name\": \"@acme/custom-sdk\""),
        "packageName not in package.json:\n{manifest}"
    );
}

#[test]
fn base_url_and_env_var_reach_the_runtime() {
    let files = gen(json!({ "baseURL": "https://custom.test/v9", "envVar": "CUSTOM_KEY" }));
    let all = files.values().cloned().collect::<Vec<_>>().join("\n");
    assert!(all.contains("https://custom.test/v9"), "baseURL missing");
    assert!(all.contains("CUSTOM_KEY"), "envVar missing");
}

#[test]
fn export_shape_flips_between_default_and_named() {
    // Default: `export { X as default }`.
    assert!(gen(json!({}))["src/index.ts"].contains(" as default } from './client';"));

    // exportPackage selects a NAMED export...
    let named = gen(json!({ "exportPackage": true }));
    assert!(
        !named["src/index.ts"].contains(" as default } from './client';"),
        "exportPackage must drop the default export"
    );
    // ...and a string is used verbatim as the symbol.
    let custom = gen(json!({ "exportPackage": "AcmeClient" }));
    assert!(
        custom["src/index.ts"].contains("export { AcmeClient } from './client';"),
        "{}",
        custom["src/index.ts"]
    );
    // exportPackage: false is NOT "named" — it falls back to the default export.
    assert!(gen(json!({ "exportPackage": false }))["src/index.ts"]
        .contains(" as default } from './client';"));
}

#[test]
fn tests_false_drops_exactly_the_test_files() {
    let with = gen(json!({}));
    let without = gen(json!({ "tests": false }));
    assert!(
        without.len() < with.len(),
        "tests:false did not drop anything ({} vs {})",
        without.len(),
        with.len()
    );
    let dropped: Vec<&String> = with.keys().filter(|k| !without.contains_key(*k)).collect();
    assert!(!dropped.is_empty());
    for path in &dropped {
        // `tsconfig.test.json` is top-level but IS part of generateTests in the
        // TS emitter (it type-checks src + tests in one pass, keeping the `tsc`
        // build src-only), so it drops with the rest.
        assert!(
            path.starts_with("tests/") || path.as_str() == "tsconfig.test.json",
            "tests:false dropped a NON-test file: {path}"
        );
    }
    // Nothing OUTSIDE the test set may disappear.
    assert!(without.contains_key("src/client.ts"));
    assert!(without.contains_key("package.json"));
}

// ---- busybox: the only option that adds a file -----------------------------

#[test]
fn busybox_is_absent_by_default() {
    assert!(!gen(json!({})).contains_key("src/busybox.ts"));
    assert!(!gen(json!({ "busybox": false })).contains_key("src/busybox.ts"));
}

#[test]
fn busybox_namespace_style_exports_a_named_object() {
    let files = gen(json!({ "busybox": true }));
    assert!(files.contains_key("src/busybox.ts"));
    assert!(files["src/index.ts"].contains("export * as busybox from './busybox';"));

    // A custom namespace name.
    let named = gen(json!({ "busybox": { "style": "namespace", "name": "apiutils" } }));
    assert!(named["src/index.ts"].contains("export * as apiutils from './busybox';"));
}

#[test]
fn busybox_flat_style_re_exports_each_helper() {
    let files = gen(json!({ "busybox": "flat" }));
    let index = &files["src/index.ts"];
    assert!(index.contains("export { isAPIError, isStatus,"), "{index}");
    assert!(index.contains("} from './busybox';"), "{index}");
}

#[test]
fn busybox_static_style_lands_on_the_client_class() {
    let files = gen(json!({ "busybox": "static" }));
    let client = &files["src/client.ts"];
    assert!(
        client.contains("import * as busybox from './busybox';"),
        "{client}"
    );
    assert!(
        client.contains("  static isNotFound = busybox.isNotFound;"),
        "{client}"
    );
    // static helpers are NOT re-exported from the package root.
    assert!(!files["src/index.ts"].contains("from './busybox';"));
}

#[test]
fn the_busybox_file_itself_is_emitted_once_and_compiles_shape() {
    let files = gen(json!({ "busybox": true }));
    let body = &files["src/busybox.ts"];
    assert!(
        body.starts_with("// Code generated by opensdk. DO NOT EDIT."),
        "header missing"
    );
    assert!(body.contains("import { APIError } from './core/error';"));
    for helper in [
        "isAPIError",
        "isStatus",
        "isNotFound",
        "isUnauthorized",
        "isForbidden",
        "isConflict",
        "isRateLimited",
        "isServerError",
        "errMessage",
        "apiErrMessage",
    ] {
        assert!(
            body.contains(&format!("export function {helper}(")),
            "{helper} missing from src/busybox.ts"
        );
    }
}
