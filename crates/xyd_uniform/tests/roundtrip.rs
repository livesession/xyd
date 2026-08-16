//! Shape drift-alarm: every committed fixture oracle must deserialize into the
//! typed model and re-serialize to a canon-equal tree. If the TS types evolve
//! (new field, renamed field), this test — not a runtime surprise — is where
//! the Rust mirror finds out.
//!
//! `deny_unknown_fields` is deliberately NOT used on the model (converters may
//! attach source-specific extras via `context`), so the failure mode this
//! guards is asymmetric: a field the model doesn't know gets DROPPED on
//! deserialize → the re-serialized tree diverges from the oracle → parity
//! fails here with the exact JSON pointer.

use std::fs;
use std::path::PathBuf;

use serde_json::Value;
use xyd_uniform::{canon, Reference};

fn fixtures(pkg: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages")
        .join(pkg)
        .join("__fixtures__")
}

fn roundtrip_all(pkg: &str) {
    let dir = fixtures(pkg);
    let mut cases = 0;
    for entry in fs::read_dir(&dir).expect("fixtures dir") {
        let case = entry.expect("entry").path();
        let oracle_path = case.join("output.json");
        if !oracle_path.exists() {
            continue;
        }
        let raw = fs::read_to_string(&oracle_path).expect("read oracle");
        let oracle: Value = serde_json::from_str(&raw).expect("oracle is JSON");

        // Reference[] oracles only. (xyd-gql/-2.complex.monday/output.json is a
        // dead `{}` placeholder — its case is not in the gql test matrix; W1
        // decides whether to regenerate or delete it.)
        if !oracle.is_array() {
            eprintln!("skip (non-array oracle): {}", oracle_path.display());
            continue;
        }

        let typed: Vec<Reference> = serde_json::from_str(&raw).unwrap_or_else(|e| {
            panic!(
                "{}: model can't deserialize oracle: {e}",
                oracle_path.display()
            )
        });
        let back: Value = serde_json::to_value(&typed).expect("re-serialize");

        let diffs = canon::diff_paths(&back, &oracle, 5);
        assert!(
            diffs.is_empty(),
            "{}: model drops/renames fields — first divergences: {:#?}",
            oracle_path.display(),
            diffs
        );
        cases += 1;
    }
    assert!(cases > 0, "no fixture cases found under {}", dir.display());
    println!("{pkg}: {cases} oracle(s) round-tripped");
}

#[test]
fn gql_oracles_roundtrip() {
    roundtrip_all("xyd-gql");
}

#[test]
fn openapi_oracles_roundtrip() {
    roundtrip_all("xyd-openapi");
}

#[test]
fn mcp_uniform_oracles_roundtrip() {
    roundtrip_all("xyd-mcp-uniform");
}
