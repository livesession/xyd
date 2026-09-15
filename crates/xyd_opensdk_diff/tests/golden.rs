//! Gate against the TypeScript oracle.
//!
//! `packages/xyd-opensdk-core/__fixtures__/diff/` is JS-owned: the inputs
//! (`_specs/*.json`) and the expected output (`<case>/output.json`) were both
//! minted by running the REAL `diffIR` from
//! `packages/xyd-opensdk-core/src/diff.ts` over specs derived from the
//! committed IR fixtures in `packages/xyd-opensdk-go/__fixtures__`.
//!
//! **Rust never rewrites those files.** Regeneration is an explicit act on the
//! JS side (`O2S_BUILD_DOCS=1` + the vitest run in
//! `packages/xyd-opensdk-core/__tests__/diff.golden.test.ts`), performed on a
//! clean tree BEFORE any Rust change. A golden regenerated to make this test
//! pass is a dead oracle.
//!
//! `XYD_PARITY_DUMP=1` writes the Rust result as `output.rust.json` next to a
//! failing case for eyeballing.

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_diff::diff_ir;

fn corpus_dir() -> PathBuf {
    std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../xyd_opensdk_core/__fixtures__/diff")
}

fn read_json(path: &Path) -> Value {
    let raw =
        std::fs::read_to_string(path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()));
    serde_json::from_str(&raw).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()))
}

/// Resolve a case's `{ base, head }` spec names into the shared `_specs` pool.
fn load_pair(corpus: &Path, case_dir: &Path) -> (Value, Value) {
    let kase = read_json(&case_dir.join("case.json"));
    let name = |key: &str| {
        kase.get(key)
            .and_then(Value::as_str)
            .unwrap_or_else(|| panic!("{}/case.json has no {key}", case_dir.display()))
            .to_string()
    };
    let specs = corpus.join("_specs");
    (
        read_json(&specs.join(format!("{}.json", name("base")))),
        read_json(&specs.join(format!("{}.json", name("head")))),
    )
}

#[test]
fn matches_the_typescript_oracle() {
    let corpus = corpus_dir();
    let cases = xyd_parity::fixture_cases(&corpus);
    assert_eq!(cases.len(), 27, "unexpected corpus size: {cases:?}");

    // Collect every failing case first: when a semantic regresses, the COUNT of
    // affected cases is the useful signal (and it is what proves this gate
    // bites when the port is deliberately perturbed).
    let mut failed: Vec<&PathBuf> = Vec::new();
    for case_dir in &cases {
        let (base, head) = load_pair(&corpus, case_dir);
        let actual = serde_json::to_value(diff_ir(&base, &head)).expect("serialize diff");
        if !xyd_uniform::canon::canon_eq(&actual, &xyd_parity::read_oracle(case_dir)) {
            failed.push(case_dir);
        }
    }

    if let Some(first) = failed.first() {
        let names: Vec<&str> = failed
            .iter()
            .filter_map(|p| p.file_name().and_then(|n| n.to_str()))
            .collect();
        eprintln!(
            "ORACLE MISMATCH in {}/{} case(s): {}",
            failed.len(),
            cases.len(),
            names.join(", ")
        );
        // Re-run the first failure through the parity harness for a pointered diff.
        let (base, head) = load_pair(&corpus, first);
        let actual = serde_json::to_value(diff_ir(&base, &head)).expect("serialize diff");
        xyd_parity::assert_parity(first, &actual);
        unreachable!("assert_parity must panic on a known-bad case");
    }
}

/// The corpus is only as good as its reach: this pins WHICH `(kind, severity)`
/// pairs the oracle actually exercises, so silently dropping a case (or a whole
/// classification branch) fails loudly rather than shrinking the gate.
///
/// `pagination-added` is absent on purpose — the TS emits nothing when `base`
/// has no pagination and `head` does. `15.pagination-response` pins that
/// negative.
#[test]
fn oracle_covers_every_change_kind() {
    let corpus = corpus_dir();
    let mut seen: BTreeSet<String> = BTreeSet::new();
    for case_dir in xyd_parity::fixture_cases(&corpus) {
        let (base, head) = load_pair(&corpus, &case_dir);
        for change in diff_ir(&base, &head).changes {
            let severity = serde_json::to_value(change.severity).unwrap();
            seen.insert(format!("{}:{}", change.kind, severity.as_str().unwrap()));
        }
    }

    let expected: BTreeSet<String> = [
        "alias-target-changed:breaking",
        "binding-changed:breaking",
        "body-added:breaking",
        "body-added:safe",
        "body-encoding-changed:breaking",
        "body-removed:breaking",
        "body-required-flip:breaking",
        "body-type-changed:breaking",
        "deprecated-added:risky",
        "enum-value-added:risky",
        "enum-value-removed:breaking",
        "field-added:breaking",
        "field-added:safe",
        "field-nullable-flip:risky",
        "field-removed:breaking",
        "field-required-flip:breaking",
        "field-type-changed:breaking",
        "method-added:safe",
        "method-removed:breaking",
        "pagination-removed:breaking",
        "pagination-style-changed:breaking",
        "param-added:breaking",
        "param-added:safe",
        "param-removed:breaking",
        "param-required-flip:breaking",
        "param-type-changed:breaking",
        "param-wire-name-changed:risky",
        "response-type-changed:breaking",
        "sdk-behavior-changed:safe",
        "security-changed:breaking",
        "type-added:safe",
        "type-kind-changed:breaking",
        "type-removed:breaking",
        "union-variant-added:safe",
        "union-variant-removed:breaking",
    ]
    .iter()
    .map(|s| s.to_string())
    .collect();

    assert_eq!(seen, expected);
}
