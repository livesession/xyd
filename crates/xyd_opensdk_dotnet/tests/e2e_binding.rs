//! The .NET half of the e2e OFFLINE BINDING GUARD.
//!
//! Port of the always-on (no toolchain, no env gate) assertions `defineSdkE2E`
//! ran per method in `packages/xyd-opensdk-ci/src/sdk-e2e.ts`:
//!
//! ```ts
//! expect(expectedRequest(m.ir, m.leaf.method)).toEqual(m.fixture.request);
//! expect(adapter.callKey(m.leaf.segments, m.leaf.method)).toEqual(m.fixture.call);
//! ```
//!
//! The first assertion is language-agnostic and lives once in
//! `xyd_opensdk_cli_common::expected_request`. The second is the per-language
//! seam: `@xyd-js/opensdk-dotnet`'s `__tests__/e2e/harness.ts` defines
//!
//! ```ts
//! const callKey = (segments, method) =>
//!   `${segments.map(pascalCase).join('.')}.${methodName(method.action)}`;
//! ```
//!
//! i.e. .NET's client-access shape — `client.Admin.Organization.AdminApiKeys
//! .Create(...)`. It is reproduced below on top of the emitter's OWN
//! `pascal_case`/`method_name`, so the guard can never describe a naming the
//! emitter does not actually emit.
//!
//! This runs in the default `cargo test` (matching the TS behavior): it is pure
//! derivation over committed fixtures — no `dotnet`, no network, no env gate.
//! It is the coverage that must outlive `packages/xyd-opensdk-dotnet`.

use std::path::PathBuf;

use serde_json::Value;
use xyd_opensdk_cli_common::{expected_request, load_per_method_fixtures};
use xyd_opensdk_dotnet::naming::{method_name, pascal_case};

/// The corpus is not vendored into `crates/` yet — it still lives beside the
/// (about to be deleted) TypeScript package.
fn corpus_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/xyd-opensdk-dotnet/__fixtures__/-2.complex.openai")
}

/// A shrinking corpus must not quietly turn this guard into a no-op. 242 dirs
/// carry both `input.json` and `recorded.json` today.
const FLOOR: usize = 238;

/// `callKey` from `__tests__/e2e/harness.ts`: the PascalCase resource chain,
/// dot-joined, then the PascalCase action verb.
fn call_key(segments: &[String], method: &Value) -> String {
    let chain = segments
        .iter()
        .map(|s| pascal_case(s))
        .collect::<Vec<_>>()
        .join(".");
    let action = method.get("action").and_then(Value::as_str).unwrap_or("");
    format!("{}.{}", chain, method_name(action))
}

#[test]
fn offline_binding_guard_over_every_per_method_fixture() {
    let cases = load_per_method_fixtures(&corpus_dir());
    let total = cases.len();

    let mut failures: Vec<String> = Vec::new();
    let mut matched = 0usize;

    for case in &cases {
        let mut ok = true;

        let actual_request = serde_json::to_value(expected_request(&case.ir, &case.leaf_method))
            .expect("RecordedRequest serializes");
        let expected = &case.fixture["request"];
        if &actual_request != expected {
            ok = false;
            failures.push(format!(
                "{}: request mismatch\n  expected: {}\n  actual:   {}",
                case.slug, expected, actual_request,
            ));
        }

        let actual_call = call_key(&case.leaf_segments, &case.leaf_method);
        let expected_call = case.fixture["call"]
            .as_str()
            .unwrap_or_else(|| panic!("{}: recorded.json has no string `call`", case.slug));
        if actual_call != expected_call {
            ok = false;
            failures.push(format!(
                "{}: call mismatch\n  expected: {expected_call}\n  actual:   {actual_call}",
                case.slug,
            ));
        }

        if ok {
            matched += 1;
        }
    }

    assert!(
        failures.is_empty(),
        "{} of {total} per-method fixtures failed the offline binding guard:\n{}",
        failures.len(),
        failures.join("\n"),
    );

    assert!(
        total >= FLOOR,
        "per-method corpus shrank: {total} fixtures with both input.json and \
         recorded.json, floor is {FLOOR} (dir: {})",
        corpus_dir().display(),
    );

    assert_eq!(matched, total, "matched/total accounting is inconsistent");
    eprintln!("dotnet offline binding guard: {matched}/{total} per-method fixtures matched");
}

#[test]
fn call_key_matches_the_dotnet_client_access_shape() {
    let method = serde_json::json!({ "action": "create" });
    assert_eq!(
        call_key(
            &[
                "admin".to_string(),
                "organization".to_string(),
                "admin_api_keys".to_string()
            ],
            &method
        ),
        "Admin.Organization.AdminApiKeys.Create",
    );

    // `methodName` falls back to "Invoke" for an empty action verb.
    assert_eq!(
        call_key(&["batches".to_string()], &serde_json::json!({"action": ""})),
        "Batches.Invoke",
    );
}
