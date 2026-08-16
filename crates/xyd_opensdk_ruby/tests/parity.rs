//! Tier-1 full-tree golden parity: generate_ruby(input.json) === the committed
//! output/ tree, byte-exact. Now that the emitter produces the FULL tree (adds
//! the vendored transport runtime + the minitest suite), each fixture is checked
//! three ways: (a) every golden file under output/ is emitted and byte-exact,
//! (b) every emitted file has a matching golden (no extras), and (c) a per
//! -fixture floor equal to the golden file count so a silent drop can't pass.
//! Diffs report the path + first differing line. (Self-contained; no xyd_parity.)

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_ruby::generate_ruby;

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-ruby/__fixtures__")
}

/// Every file under `root`, keyed by its path relative to `root` (posix slashes).
fn read_golden_tree(root: &Path) -> BTreeMap<String, String> {
    let mut out = BTreeMap::new();
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        for entry in std::fs::read_dir(&dir).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                stack.push(path);
            } else {
                let rel = path
                    .strip_prefix(root)
                    .unwrap()
                    .to_string_lossy()
                    .replace('\\', "/");
                out.insert(rel, std::fs::read_to_string(&path).unwrap());
            }
        }
    }
    out
}

/// The 1-based first differing line, with both sides, for a precise report.
fn first_diff(golden: &str, got: &str) -> String {
    let g: Vec<&str> = golden.split('\n').collect();
    let r: Vec<&str> = got.split('\n').collect();
    for i in 0..g.len().max(r.len()) {
        let a = g.get(i).copied().unwrap_or("<EOF>");
        let b = r.get(i).copied().unwrap_or("<EOF>");
        if a != b {
            return format!("first diff line {}: golden={a:?} rust={b:?}", i + 1);
        }
    }
    "(identical by line; length/tail differs)".to_string()
}

fn run_case(name: &str) {
    let case = fixtures_dir().join(name);
    let input: Value =
        serde_json::from_str(&std::fs::read_to_string(case.join("input.json")).unwrap()).unwrap();
    let emitted = generate_ruby(&input);
    let golden = read_golden_tree(&case.join("output"));

    let mut problems: Vec<String> = Vec::new();

    // (a) every golden is emitted and byte-exact.
    for (rel, want) in &golden {
        match emitted.get(rel) {
            None => problems.push(format!("  MISSING {rel} (golden not emitted)")),
            Some(got) if got != want => {
                problems.push(format!("  DIFF {rel}: {}", first_diff(want, got)))
            }
            Some(_) => {}
        }
    }
    // (b) every emitted file has a golden (no extras).
    for rel in emitted.keys() {
        if !golden.contains_key(rel) {
            problems.push(format!("  EXTRA {rel} (emitted with no golden)"));
        }
    }

    assert!(
        problems.is_empty(),
        "{name}: {} problem(s) vs golden tree ({} golden / {} emitted):\n{}",
        problems.len(),
        golden.len(),
        emitted.len(),
        problems.join("\n")
    );
    // (c) floor: the full golden tree must be emitted, nothing silently dropped.
    assert_eq!(
        emitted.len(),
        golden.len(),
        "{name}: emitted {} files but golden tree has {} — count drift",
        emitted.len(),
        golden.len()
    );
}

#[test]
fn basic() {
    run_case("1.basic");
}
#[test]
fn wire() {
    run_case("2.wire");
}
#[test]
fn unions() {
    run_case("3.unions");
}
#[test]
fn x_open_sdk() {
    run_case("9.x-open-sdk");
}
