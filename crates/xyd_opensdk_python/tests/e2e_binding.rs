//! The PYTHON half of the e2e OFFLINE BINDING GUARD.
//!
//! Port of the always-on (no toolchain, no env gate) tier of
//! `packages/xyd-opensdk-ci/src/sdk-e2e.ts` `defineSdkE2E`, which asserts —
//! once per committed per-method fixture — that
//!
//! ```text
//! expectedRequest(m.ir, m.leaf.method) === m.fixture.request
//! adapter.callKey(m.leaf.segments, m.leaf.method) === m.fixture.call
//! ```
//!
//! The first assertion is language-agnostic and lives ONCE in
//! `xyd_opensdk_cli_common::e2e`; this file supplies only the per-language
//! seam — Python's [`call_key`], the Rust port of the `callKey` in
//! `packages/xyd-opensdk-python/__tests__/e2e/harness.ts`.
//!
//! Like the TS original this runs in the DEFAULT test pass: it needs no Python
//! interpreter and no network, because it compares pure-IR derivations against
//! the 242 committed `recorded.json` fixtures. (The gated tiers — the real
//! driver run and the generated-pytest self-test — stay in TypeScript.)

use std::path::{Path, PathBuf};

use serde_json::Value;

use xyd_opensdk_cli_common::e2e::{expected_request, load_per_method_fixtures};
use xyd_opensdk_python::naming::snake_case;

/// A shrinking corpus must not silently pass: the committed count is 242.
const FLOOR: usize = 238;

/// Python's client-access shape, byte-for-byte the harness's
/// `` `${segments.map(snakeCase).join('.')}.${snakeCase(method.action)}` ``.
fn call_key(segments: &[String], method: &Value) -> String {
    let chain = segments
        .iter()
        .map(|s| snake_case(s))
        .collect::<Vec<_>>()
        .join(".");
    let action = method.get("action").and_then(Value::as_str).unwrap_or("");
    format!("{chain}.{}", snake_case(action))
}

/// `packages/xyd-opensdk-python/__fixtures__/-2.complex.openai` relative to this
/// crate. Nothing has moved yet — the fixtures still live in the TS package.
fn corpus_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__/-2.complex.openai")
}

#[test]
fn offline_binding_guard_matches_every_recorded_fixture() {
    let cases = load_per_method_fixtures(&corpus_dir());
    let total = cases.len();

    let mut request_failures: Vec<String> = Vec::new();
    let mut call_failures: Vec<String> = Vec::new();

    for case in &cases {
        let actual = serde_json::to_value(expected_request(&case.ir, &case.leaf_method))
            .expect("RecordedRequest serializes");
        if actual != case.fixture["request"] {
            request_failures.push(format!(
                "{}\n     expected: {}\n     actual:   {}",
                case.slug, case.fixture["request"], actual
            ));
        }

        let actual_call = call_key(&case.leaf_segments, &case.leaf_method);
        let expected_call = case.fixture["call"].as_str().unwrap_or_default();
        if actual_call != expected_call {
            call_failures.push(format!(
                "{}\n     expected: {expected_call}\n     actual:   {actual_call}",
                case.slug
            ));
        }
    }

    let matched = total - request_failures.len().max(call_failures.len());
    assert!(
        request_failures.is_empty(),
        "{} of {total} fixtures have a mismatched request:\n  - {}",
        request_failures.len(),
        request_failures.join("\n  - ")
    );
    assert!(
        call_failures.is_empty(),
        "{} of {total} fixtures have a mismatched call key:\n  - {}",
        call_failures.len(),
        call_failures.join("\n  - ")
    );

    assert!(
        total >= FLOOR,
        "per-method corpus shrank: {total} fixtures with both input.json and \
         recorded.json, expected at least {FLOOR}"
    );
    println!("offline binding guard: {matched}/{total} fixtures matched");
}
