//! Test-kit for the CLI-mode emitters' self-contained tests (this whole
//! feature is Rust-only, so — unlike the migration-era parity harnesses —
//! nothing here may reference packages/ outside crates/).
//!
//! - `common_fixtures_dir()` / `fixture_cases()`: the canonical shared
//!   CLI-mode spec inputs every emitter generates from.
//! - golden-TREE helpers: read/bless/compare a whole generated file tree
//!   (`__fixtures__/cli/<case>/output/**`), with `XYD_BLESS=1` regen.
//! - `recording_cli_path()`: builds the recording binary once per test
//!   process for the env-gated argv-verification smokes.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

/// `crates/xyd_opensdk_cli_common/__fixtures__/cli` — the shared emitter
/// inputs (each case: `opencli.json` source + blessed `input.json` IR).
pub fn common_fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("__fixtures__")
        .join("cli")
}

/// Sorted case directories that carry an `input.json`.
pub fn fixture_cases() -> Vec<PathBuf> {
    let dir = common_fixtures_dir();
    let mut cases: Vec<PathBuf> = std::fs::read_dir(&dir)
        .unwrap_or_else(|e| panic!("read {}: {e}", dir.display()))
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.is_dir() && p.join("input.json").exists())
        .collect();
    cases.sort();
    cases
}

pub fn bless() -> bool {
    std::env::var("XYD_BLESS").is_ok()
}

/// Read a golden file tree into relative-path → contents.
pub fn read_tree(root: &Path) -> BTreeMap<String, String> {
    let mut out = BTreeMap::new();
    if !root.exists() {
        return out;
    }
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        for entry in
            std::fs::read_dir(&dir).unwrap_or_else(|e| panic!("read {}: {e}", dir.display()))
        {
            let path = entry.expect("dir entry").path();
            if path.is_dir() {
                stack.push(path);
            } else {
                let rel = path
                    .strip_prefix(root)
                    .expect("under root")
                    .to_string_lossy()
                    .replace('\\', "/");
                let contents = std::fs::read_to_string(&path)
                    .unwrap_or_else(|e| panic!("read {}: {e}", path.display()));
                out.insert(rel, contents);
            }
        }
    }
    out
}

/// Replace the golden tree with `files` (delete + rewrite — the tree form of
/// the XYD_BLESS single-file pattern).
pub fn bless_tree(root: &Path, files: &BTreeMap<String, String>) {
    if root.exists() {
        std::fs::remove_dir_all(root).unwrap_or_else(|e| panic!("clear {}: {e}", root.display()));
    }
    for (rel, contents) in files {
        let path = root.join(rel);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .unwrap_or_else(|e| panic!("mkdir {}: {e}", parent.display()));
        }
        std::fs::write(&path, contents).unwrap_or_else(|e| panic!("write {}: {e}", path.display()));
    }
}

/// Three-way tree diff: (missing-from-generated, differing, extra-in-generated).
pub fn compare_trees(
    generated: &BTreeMap<String, String>,
    golden: &BTreeMap<String, String>,
) -> Vec<String> {
    let mut failures = Vec::new();
    for path in golden.keys() {
        if !generated.contains_key(path) {
            failures.push(format!("missing generated file: {path}"));
        }
    }
    for (path, contents) in generated {
        match golden.get(path) {
            None => failures.push(format!("extra generated file: {path}")),
            Some(want) if want != contents => {
                let line = first_divergent_line(contents, want);
                failures.push(format!("differs: {path} (first divergence at line {line})"));
            }
            Some(_) => {}
        }
    }
    failures
}

fn first_divergent_line(got: &str, want: &str) -> usize {
    let got_lines: Vec<&str> = got.lines().collect();
    let want_lines: Vec<&str> = want.lines().collect();
    let n = got_lines.len().max(want_lines.len());
    for i in 0..n {
        if got_lines.get(i) != want_lines.get(i) {
            return i + 1;
        }
    }
    0
}

/// Path to the recording binary, building it (once per process) via cargo —
/// which is guaranteed present inside a `cargo test` run.
pub fn recording_cli_path() -> PathBuf {
    static PATH: OnceLock<PathBuf> = OnceLock::new();
    PATH.get_or_init(|| {
        let workspace_root = Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("crates/ parent")
            .to_path_buf();
        let status = std::process::Command::new(env!("CARGO"))
            .args([
                "build",
                "-p",
                "xyd_opensdk_cli_common",
                "--bin",
                "xyd-recording-cli",
            ])
            .current_dir(&workspace_root)
            .status()
            .expect("spawn cargo build for the recording cli");
        assert!(status.success(), "cargo build xyd-recording-cli failed");
        let target_dir = std::env::var("CARGO_TARGET_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| workspace_root.join("target"));
        let bin = target_dir.join("debug").join(if cfg!(windows) {
            "xyd-recording-cli.exe"
        } else {
            "xyd-recording-cli"
        });
        assert!(bin.exists(), "recording cli not found at {}", bin.display());
        bin
    })
    .clone()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tree_compare_reports_all_three_ways() {
        let mut generated = BTreeMap::new();
        generated.insert("same.txt".to_string(), "a\n".to_string());
        generated.insert("diff.txt".to_string(), "a\nb\n".to_string());
        generated.insert("extra.txt".to_string(), "x\n".to_string());
        let mut golden = BTreeMap::new();
        golden.insert("same.txt".to_string(), "a\n".to_string());
        golden.insert("diff.txt".to_string(), "a\nc\n".to_string());
        golden.insert("missing.txt".to_string(), "m\n".to_string());
        let failures = compare_trees(&generated, &golden);
        assert_eq!(failures.len(), 3, "{failures:?}");
        assert!(failures
            .iter()
            .any(|f| f.contains("missing generated file: missing.txt")));
        assert!(failures
            .iter()
            .any(|f| f.contains("extra generated file: extra.txt")));
        assert!(failures
            .iter()
            .any(|f| f.contains("differs: diff.txt") && f.contains("line 2")));
    }
}
