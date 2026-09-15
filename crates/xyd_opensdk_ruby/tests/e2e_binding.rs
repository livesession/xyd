//! The RUBY half of the e2e OFFLINE BINDING GUARD.
//!
//! Port of the always-on (no toolchain, no env gate) tier of `defineSdkE2E` in
//! `packages/xyd-opensdk-ci/src/sdk-e2e.ts`, which ran once per committed
//! per-method `recorded.json`:
//!
//! ```text
//! expect(expectedRequest(m.ir, m.leaf.method)).toEqual(m.fixture.request);
//! expect(adapter.callKey(m.leaf.segments, m.leaf.method)).toEqual(m.fixture.call);
//! ```
//!
//! Half (1) is language-agnostic and lives in `xyd_opensdk_cli_common::e2e`.
//! Half (2) is this emitter's seam: Ruby's client-access shape — a snake_case
//! resource chain plus the snake_case action, mirroring the generated
//! `client.<attr>.<attr>.<action>` accessor chain.
//!
//! Deliberately NOT env-gated: it needs no Ruby toolchain, so it runs in the
//! default `cargo test`, matching the TypeScript behavior it replaces.

use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_cli_common::{expected_request, load_per_method_fixtures};
use xyd_opensdk_ruby::snake_case;

/// Committed corpus (nothing has moved out of `packages/` yet).
fn corpus_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__/-2.complex.openai")
}

/// A shrinking corpus must not be able to pass: 242 fixtures are committed.
const FLOOR: usize = 238;

/// Port of `callKey` in `packages/xyd-opensdk-ruby/__tests__/e2e/harness.ts`:
/// `segments.map(snakeCase).join('.') + '.' + snakeCase(method.action)`.
fn call_key(segments: &[String], method: &Value) -> String {
    let chain = segments
        .iter()
        .map(|s| snake_case(s))
        .collect::<Vec<_>>()
        .join(".");
    let action = method.get("action").and_then(Value::as_str).unwrap_or("");
    format!("{chain}.{}", snake_case(action))
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

        let actual_call = call_key(&case.leaf_segments, &case.leaf_method);
        let expected_call = case
            .fixture
            .get("call")
            .and_then(Value::as_str)
            .unwrap_or_default();
        if actual_call != expected_call {
            failures.push(format!(
                "  {}: call key\n    expected {expected_call}\n    actual   {actual_call}",
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
    eprintln!("ruby offline binding guard: {total}/{total} cases matched");
}

/// The call key is Ruby's client-access chain, not a passthrough of the IR
/// names: every segment and the action go through `snake_case` (which also
/// keyword-guards, e.g. `end` -> `end_`).
#[test]
fn call_key_matches_the_ruby_client_access_shape() {
    assert_eq!(
        call_key(
            &["fineTuning".to_string(), "checkpoints".to_string()],
            &serde_json::json!({ "action": "listPermissions" }),
        ),
        "fine_tuning.checkpoints.list_permissions"
    );
    // A missing action degrades to the bare chain + ".", never panics.
    assert_eq!(
        call_key(&["batches".to_string()], &serde_json::json!({})),
        "batches."
    );
}
