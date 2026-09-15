//! Fixture-parity harness for the SDK/CLI toolchain — a VENDORED copy.
//!
//! `xyd_parity` (in xyd) and this crate are the same harness. It is duplicated
//! rather than shared on purpose: `xyd_parity` depends on `xyd_uniform` for its
//! canonicalizer, and `xyd_uniform` is xyd's docs data model, which does NOT
//! move to the opensdk repo. Sharing would drag the whole docs model across the
//! boundary to give the toolchain's tests a 185-line JSON comparator.
//!
//! The duplication is bounded and enforced, not tolerated: `src/canon.rs` is a
//! BYTE-IDENTICAL copy of `xyd_uniform/src/canon.rs`, so CI can assert
//! `diff` is empty and drift becomes unmergeable.
//!
//! `fixtures_dir` is deliberately absent. It resolved
//! `../../packages/<pkg>/__fixtures__`, which the A5 sweep made obsolete when
//! fixtures moved in-crate; no caller in the moving cluster remains.

pub mod canon;

use std::fs;
use std::path::{Path, PathBuf};

use serde_json::Value;

/// Enumerate fixture case directories (those containing an `output.json`),
/// sorted by name for stable test ordering.
pub fn fixture_cases(fixtures: &Path) -> Vec<PathBuf> {
    let mut cases: Vec<PathBuf> = fs::read_dir(fixtures)
        .unwrap_or_else(|e| panic!("fixtures dir {}: {e}", fixtures.display()))
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.is_dir() && p.join("output.json").exists())
        .collect();
    cases.sort();
    cases
}

/// Read + parse a fixture's `output.json` oracle.
pub fn read_oracle(case_dir: &Path) -> Value {
    let p = case_dir.join("output.json");
    let raw = fs::read_to_string(&p).unwrap_or_else(|e| panic!("read {}: {e}", p.display()));
    serde_json::from_str(&raw).unwrap_or_else(|e| panic!("parse {}: {e}", p.display()))
}

/// Assert structural parity (canonicalized `Value` equality) between the Rust
/// result and the committed oracle. On mismatch, panics with the first N
/// divergent JSON-pointer paths. Honors `XYD_PARITY_DUMP=1`.
pub fn assert_parity(case_dir: &Path, actual: &Value) {
    if std::env::var("XYD_PARITY_DUMP").as_deref() == Ok("1") {
        let dump = case_dir.join("output.rust.json");
        let pretty = serde_json::to_string_pretty(actual).expect("serialize dump");
        fs::write(&dump, pretty).unwrap_or_else(|e| panic!("write {}: {e}", dump.display()));
    }

    let oracle = read_oracle(case_dir);
    if canon::canon_eq(actual, &oracle) {
        return;
    }

    const LIMIT: usize = 12;
    let diffs = canon::diff_paths(actual, &oracle, LIMIT);
    let mut msg = format!(
        "PARITY FAILED: {} ({} divergence(s) shown, limit {LIMIT})\n",
        case_dir.display(),
        diffs.len()
    );
    for (ptr, left, right) in &diffs {
        msg.push_str(&format!(
            "  at {ptr}\n    rust:   {}\n    oracle: {}\n",
            truncate(&left.to_string(), 200),
            truncate(&right.to_string(), 200),
        ));
    }
    msg.push_str("(rerun with XYD_PARITY_DUMP=1 to write output.rust.json next to the fixture)");
    panic!("{msg}");
}

fn truncate(s: &str, max: usize) -> String {
    if s.len() <= max {
        s.to_string()
    } else {
        let mut end = max;
        while !s.is_char_boundary(end) {
            end -= 1;
        }
        format!("{}… ({} bytes)", &s[..end], s.len())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn parity_passes_on_equal_trees() {
        let dir = std::env::temp_dir().join("xyd-parity-selftest-eq");
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("output.json"), r#"{"a": 1, "b": [2.0]}"#).unwrap();
        assert_parity(&dir, &json!({"b": [2], "a": 1.0})); // order + number canon
    }

    #[test]
    #[should_panic(expected = "PARITY FAILED")]
    fn parity_panics_with_pointer_paths() {
        let dir = std::env::temp_dir().join("xyd-parity-selftest-ne");
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("output.json"), r#"{"a": 1}"#).unwrap();
        assert_parity(&dir, &json!({"a": 2}));
    }
}
