//! `emitterOptions` take effect, and an EMPTY bag changes nothing.
//!
//! The parity suites prove the no-options path is byte-exact; they cannot prove
//! the options path does anything, since a `resolve_*` that accepts `options`
//! and never reads it would still pass them. That silent-ignore case is what
//! this file catches.

use std::path::{Path, PathBuf};

use serde_json::{json, Value};
use xyd_opensdk_go::{generate_go, generate_go_with};

fn fixture() -> Value {
    let p: PathBuf = Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__/1.basic/input.json");
    serde_json::from_str(&std::fs::read_to_string(p).unwrap()).unwrap()
}

#[test]
fn an_empty_bag_is_a_no_op() {
    let base = generate_go(&fixture());
    assert_eq!(generate_go_with(&fixture(), &json!({})), base);
    assert_eq!(generate_go_with(&fixture(), &Value::Null), base);
}

#[test]
fn base_url_reaches_the_output() {
    let files = generate_go_with(&fixture(), &json!({ "baseURL": "https://custom.test/v9" }));
    let all = files.values().cloned().collect::<Vec<_>>().join("\n");
    assert!(
        all.contains("https://custom.test/v9"),
        "baseURL override never reached the output"
    );
}

#[test]
fn tests_false_drops_files() {
    let with = generate_go_with(&fixture(), &json!({}));
    let without = generate_go_with(&fixture(), &json!({ "tests": false }));
    assert!(
        without.len() < with.len(),
        "tests:false dropped nothing ({} vs {}) — the gate is not wired",
        without.len(),
        with.len()
    );
}
