//! Fixture-parity harness (S6+ Rust migration) — tier-1 of the two-tier gate.
//!
//! Every converter crate's `tests/parity.rs` walks its JS package's committed
//! `__fixtures__/<case>/` directories and asserts the Rust output is
//! structurally equal (JS `toEqual` semantics — see `xyd_uniform::canon`) to
//! the frozen `output.json` oracle.
//!
//! Rules:
//! - **The oracle is JS-owned**: the committed `output.json` is the JS
//!   implementation's output. Rust NEVER rewrites it — regen stays an explicit,
//!   env-gated act on the JS side (e.g. `OAS_BUILD_FIXTURES=1`).
//! - `XYD_PARITY_DUMP=1` writes the Rust result as `output.rust.json`
//!   (gitignored) next to the fixture for eyeball diffing.
//! - Fixtures whose oracle embeds JS-closure plugin post-processing are
//!   skip-listed here and covered by the through-shim vitest tier instead.

use std::fs;
use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_uniform::canon;

/// Resolve `packages/<pkg>/__fixtures__` relative to a crate's manifest dir
/// (crates/<crate> → ../../packages/<pkg>/__fixtures__).
pub fn fixtures_dir(manifest_dir: &str, pkg: &str) -> PathBuf {
    Path::new(manifest_dir)
        .join("..")
        .join("..")
        .join("packages")
        .join(pkg)
        .join("__fixtures__")
}

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
