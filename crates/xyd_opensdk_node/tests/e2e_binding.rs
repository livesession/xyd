//! The NODE half of the e2e OFFLINE BINDING GUARD.
//!
//! Port of the always-on (no toolchain, no env gate) tier of `defineSdkE2E` in
//! `packages/xyd-opensdk-ci/src/sdk-e2e.ts`: for every committed per-method
//! `recorded.json`, assert that
//!
//!   1. the language-agnostic `expected_request` still derives the recorded
//!      request binding (method/path/query/bodyFields/auth/contentType), and
//!   2. this emitter's CALL KEY — Node's client-access shape, camelCase resource
//!      chain + camelCase method — still names the recorded call.
//!
//! Deliberately NOT gated: it needs no Node toolchain, so it runs in the default
//! `cargo test`, matching the TypeScript behavior it replaces.

use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_cli_common::{expected_request, load_per_method_fixtures};
use xyd_opensdk_node::{camel_case, node_method_name};

/// Committed corpus (nothing has moved out of `packages/` yet).
fn corpus_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/xyd-opensdk-node/__fixtures__/-2.complex.openai")
}

/// A shrinking corpus must not be able to pass: 242 fixtures are committed.
const FLOOR: usize = 238;

/// Port of `callKey` in `packages/xyd-opensdk-node/__tests__/e2e/harness.ts`:
/// `segments.map(camelCase).join('.') + '.' + nodeMethodName(method.action)`.
fn call_key(segments: &[String], method: &Value) -> String {
    let chain = segments
        .iter()
        .map(|s| camel_case(s))
        .collect::<Vec<_>>()
        .join(".");
    let action = method.get("action").and_then(Value::as_str).unwrap_or("");
    format!("{chain}.{}", node_method_name(action))
}

#[test]
fn e2e_offline_binding_guard() {
    let dir = corpus_dir();
    let cases = load_per_method_fixtures(&dir);
    assert!(
        cases.len() >= FLOOR,
        "per-method corpus shrank: {} cases at {} (floor {FLOOR})",
        cases.len(),
        dir.display()
    );

    let total = cases.len();
    let mut failures: Vec<String> = Vec::new();
    for case in cases {
        let actual = serde_json::to_value(expected_request(&case.ir, &case.leaf_method))
            .expect("serialize expected request");
        let expected = case.fixture.get("request").cloned().unwrap_or(Value::Null);
        if actual != expected {
            failures.push(format!(
                "  {}: request\n    expected {expected}\n    actual   {actual}",
                case.slug
            ));
        }

        let actual_key = call_key(&case.leaf_segments, &case.leaf_method);
        let expected_key = case
            .fixture
            .get("call")
            .and_then(Value::as_str)
            .unwrap_or_default();
        if actual_key != expected_key {
            failures.push(format!(
                "  {}: call key\n    expected {expected_key}\n    actual   {actual_key}",
                case.slug
            ));
        }
    }

    if !failures.is_empty() {
        panic!(
            "OFFLINE BINDING GUARD FAILED ({} problem(s) over {total} case(s)):\n{}",
            failures.len(),
            failures.join("\n")
        );
    }
    eprintln!("node offline binding guard: {total}/{total} cases matched");
}
