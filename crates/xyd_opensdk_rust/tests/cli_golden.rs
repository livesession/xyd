//! CLI-mode golden gate (self-contained; Rust-only feature, so goldens live
//! IN this crate and inputs come from the shared xyd_opensdk_cli_common
//! fixtures — never from packages/).
//!
//! Regenerate (then review):
//!   XYD_BLESS=1 cargo test -p xyd_opensdk_rust --test cli_golden

use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_cli_common::testkit;
use xyd_opensdk_rust::generate_rust;

fn golden_root(case_name: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("__fixtures__")
        .join("cli")
        .join(case_name)
        .join("output")
}

#[test]
fn cli_golden_all_cases() {
    let cases = testkit::fixture_cases();
    assert!(!cases.is_empty(), "no shared CLI fixture cases found");

    let mut failures: Vec<String> = Vec::new();
    for case in &cases {
        let name = case.file_name().unwrap().to_string_lossy().to_string();
        let input: Value = serde_json::from_str(
            &std::fs::read_to_string(case.join("input.json")).expect("read shared input"),
        )
        .expect("parse shared input");
        let generated = generate_rust(&input);
        let golden_dir = golden_root(&name);
        if testkit::bless() {
            testkit::bless_tree(&golden_dir, &generated);
            continue;
        }
        let golden = testkit::read_tree(&golden_dir);
        assert!(
            !golden.is_empty(),
            "{name}: no golden tree at {} (run XYD_BLESS=1 cargo test to mint it)",
            golden_dir.display()
        );
        for problem in testkit::compare_trees(&generated, &golden) {
            failures.push(format!("  {name}: {problem}"));
        }
    }
    if !failures.is_empty() {
        panic!(
            "CLI GOLDEN FAILED (XYD_BLESS=1 to regenerate, then review):\n{}",
            failures.join("\n")
        );
    }
    eprintln!("cli golden: {} cases identical", cases.len());
}

/// HTTP specs (no root x-cli) must be untouched by the CLI branch.
#[test]
fn http_specs_bypass_cli_mode() {
    let spec = serde_json::json!({
        "opensdk": "1.0.0",
        "info": { "title": "plain", "version": "1.0.0" },
        "resources": [ { "name": "users", "methods": [ {
            "action": "list", "httpMethod": "get", "path": "/users"
        } ] } ],
        "sdk": {}
    });
    let files = generate_rust(&spec);
    assert!(files.contains_key("src/transport.rs"));
    assert!(!files.contains_key("src/runner.rs"));
}
