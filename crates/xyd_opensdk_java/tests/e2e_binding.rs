//! The Java half of the e2e OFFLINE BINDING GUARD.
//!
//! Port of the ALWAYS-ON (no toolchain, no env gate) half of `defineSdkE2E`
//! (`packages/xyd-opensdk-ci/src/sdk-e2e.ts`): for every committed per-method
//! `recorded.json`, assert that
//!
//!   1. the request the SDK is expected to issue (`expected_request`, the shared
//!      language-agnostic derivation in `xyd_opensdk_cli_common::e2e`) still
//!      matches the recorded `request`, and
//!   2. the call key — Java's client-access shape, `camelCase` resource
//!      accessors joined by `.` plus the java method name — still matches the
//!      recorded `call`.
//!
//! (2) is the per-language seam: the same `callKey` the TypeScript harness
//! (`packages/xyd-opensdk-java/__tests__/e2e/harness.ts`) hands the shared
//! driver, built out of the emitter's OWN naming helpers so the guard cannot
//! drift from the client it describes.
//!
//! The toolchain-requiring half (generate → `javac` → run → diff the real
//! request) stays in the gated e2e; this file runs in the default `cargo test`.

use serde_json::Value;
use std::path::{Path, PathBuf};

use xyd_opensdk_cli_common::e2e::{expected_request, load_per_method_fixtures};
use xyd_opensdk_java::jsrt::{camel_case, java_method_name};

/// A shrinking corpus must not silently pass: 242 fixtures are committed today.
const FLOOR: usize = 238;

fn corpus_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__/-2.complex.openai")
}

/// harness.ts:
/// ``const callKey = (segments, method) =>
///   `${segments.map(camelCase).join('.')}.${javaMethodName(method.action)}`;``
fn call_key(segments: &[String], method: &Value) -> String {
    let chain: Vec<String> = segments.iter().map(|s| camel_case(s)).collect();
    let action = method.get("action").and_then(Value::as_str).unwrap_or("");
    format!("{}.{}", chain.join("."), java_method_name(action))
}

#[test]
fn offline_binding_guard_matches_every_recorded_fixture() {
    let cases = load_per_method_fixtures(&corpus_dir());
    assert!(
        cases.len() >= FLOOR,
        "per-method corpus shrank: {} cases < floor {FLOOR} (in {})",
        cases.len(),
        corpus_dir().display()
    );

    let mut request_failures: Vec<String> = Vec::new();
    let mut call_failures: Vec<String> = Vec::new();

    for case in &cases {
        let actual = serde_json::to_value(expected_request(&case.ir, &case.leaf_method))
            .expect("RecordedRequest serializes");
        if actual != case.fixture["request"] {
            request_failures.push(format!(
                "  {}\n    expected: {}\n    recorded: {}",
                case.slug, actual, case.fixture["request"]
            ));
        }

        let actual_call = call_key(&case.leaf_segments, &case.leaf_method);
        let recorded_call = case.fixture["call"].as_str().unwrap_or_default();
        if actual_call != recorded_call {
            call_failures.push(format!(
                "  {}\n    expected: {actual_call}\n    recorded: {recorded_call}",
                case.slug
            ));
        }
    }

    assert!(
        request_failures.is_empty(),
        "{}/{} fixtures disagree on the expected REQUEST:\n{}",
        request_failures.len(),
        cases.len(),
        request_failures.join("\n")
    );
    assert!(
        call_failures.is_empty(),
        "{}/{} fixtures disagree on the CALL KEY:\n{}",
        call_failures.len(),
        cases.len(),
        call_failures.join("\n")
    );

    println!(
        "offline binding guard: {}/{} per-method fixtures matched (request + call key)",
        cases.len(),
        cases.len()
    );
}
