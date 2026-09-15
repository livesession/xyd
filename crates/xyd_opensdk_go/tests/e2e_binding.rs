//! The e2e OFFLINE BINDING GUARD for Go — the always-on (no toolchain, no env
//! gate) half of `defineSdkE2E` in `packages/xyd-opensdk-ci/src/sdk-e2e.ts`.
//!
//! For every committed per-method fixture it makes the same two assertions the
//! TypeScript suite makes, once per operation:
//!
//! 1. `expected_request(ir, leaf_method)` == the fixture's `request` — the
//!    language-agnostic IR→HTTP binding (shared, lives in
//!    `xyd_opensdk_cli_common::e2e`; never re-derived here);
//! 2. `call_key(leaf_segments, leaf_method)` == the fixture's `call` — the Go
//!    seam, which reuses the emitter's own `pascal_case`/`go_method_name`, so a
//!    naming change that would rename a generated client method is caught here.
//!
//! This is the coverage that would be lost when `packages/xyd-opensdk-go` is
//! deleted: 242 committed `recorded.json` files under
//! `__fixtures__/-2.complex.openai/`. Like the TypeScript original there is NO
//! env gate — it runs in the default `cargo test`.

use std::path::{Path, PathBuf};

use xyd_opensdk_cli_common::{expected_request, load_per_method_fixtures};
use xyd_opensdk_go::call_key;

/// A shrinking corpus must not be able to pass. 242 fixtures are committed
/// today; the floor allows only trivial churn below that.
const FLOOR: usize = 238;

fn corpus_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__/-2.complex.openai")
}

#[test]
fn recorded_requests_match_the_ir_binding() {
    let cases = load_per_method_fixtures(&corpus_dir());
    assert!(
        cases.len() >= FLOOR,
        "found only {} per-method fixtures with both input.json and recorded.json in {} \
         (floor {FLOOR}) — the guard would pass with reduced coverage",
        cases.len(),
        corpus_dir().display()
    );

    let mut request_failures: Vec<String> = Vec::new();
    let mut call_failures: Vec<String> = Vec::new();
    let mut matched = 0usize;

    for case in &cases {
        let before = (request_failures.len(), call_failures.len());

        let got_request = serde_json::to_value(expected_request(&case.ir, &case.leaf_method))
            .expect("serialize expected request");
        let want_request = &case.fixture["request"];
        // Value equality: key-order independent, key-SET exact (so a missing or
        // extra `contentType` is a failure, matching vitest's toEqual).
        if &got_request != want_request {
            request_failures.push(format!(
                "  {}\n      got:  {got_request}\n      want: {want_request}",
                case.slug
            ));
        }

        let got_call = call_key(&case.leaf_segments, &case.leaf_method);
        let want_call = case.fixture["call"]
            .as_str()
            .unwrap_or_else(|| panic!("{}: recorded.json has no string `call`", case.slug));
        if got_call != want_call {
            call_failures.push(format!(
                "  {}\n      got:  {got_call}\n      want: {want_call}",
                case.slug
            ));
        }

        if (request_failures.len(), call_failures.len()) == before {
            matched += 1;
        }
    }

    println!(
        "go e2e offline binding guard: {matched}/{} fixtures fully matched \
         ({} request mismatches, {} call-key mismatches)",
        cases.len(),
        request_failures.len(),
        call_failures.len()
    );

    assert!(
        request_failures.is_empty(),
        "{} of {} fixtures have a diverging REQUEST binding:\n{}",
        request_failures.len(),
        cases.len(),
        request_failures.join("\n")
    );
    assert!(
        call_failures.is_empty(),
        "{} of {} fixtures have a diverging CALL KEY:\n{}",
        call_failures.len(),
        cases.len(),
        call_failures.join("\n")
    );
}

#[test]
fn the_corpus_exercises_the_go_naming_rules() {
    // Guards the guard: if every call key were a single flat `Resource.List`,
    // the sweep above could pass without exercising nested receivers, the
    // create→New / retrieve→Get remaps, or initialism uppercasing.
    let cases = load_per_method_fixtures(&corpus_dir());
    let keys: Vec<String> = cases
        .iter()
        .map(|c| call_key(&c.leaf_segments, &c.leaf_method))
        .collect();

    assert!(
        keys.iter().any(|k| k.matches('.').count() > 1),
        "no nested-resource call key in the corpus"
    );
    assert!(
        keys.iter().any(|k| k.ends_with(".New")),
        "no create→New call key in the corpus"
    );
    assert!(
        keys.iter().any(|k| k.ends_with(".Get")),
        "no retrieve→Get call key in the corpus"
    );
}
