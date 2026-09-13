//! The per-file writeMode contract, gated against `write-modes.json` — captured
//! from the TypeScript emitter BEFORE any of this was ported, so it is a true
//! oracle rather than a self-consistent snapshot.
//!
//! writeMode is what makes regeneration non-destructive, and until the Rust
//! emitters produced it the orchestrator had to call the TS `generateProject`
//! just to rebuild the map. That is why it is pinned per language.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_ruby::generate_ruby_files;

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-ruby/__fixtures__")
}

#[test]
fn write_modes_match_the_typescript_golden() {
    let golden_path = fixtures_dir().join("write-modes.json");
    let golden: BTreeMap<String, BTreeMap<String, String>> =
        serde_json::from_str(&std::fs::read_to_string(&golden_path).unwrap()).unwrap();
    assert!(
        !golden.is_empty(),
        "empty golden at {golden_path:?} — the oracle would pass vacuously"
    );

    for (fixture, want) in &golden {
        let input = fixtures_dir().join(fixture).join("input.json");
        let spec: Value = serde_json::from_str(&std::fs::read_to_string(&input).unwrap()).unwrap();

        // Only NON-default modes are recorded, matching the golden's shape.
        let got: BTreeMap<String, String> = generate_ruby_files(&spec)
            .into_iter()
            .filter_map(|(path, f)| {
                f.write_mode.map(|m| {
                    let s = serde_json::to_value(m).unwrap();
                    (path, s.as_str().unwrap().to_string())
                })
            })
            .collect();

        assert_eq!(
            &got, want,
            "{fixture}: writeMode map differs from the TS golden"
        );
    }
}
