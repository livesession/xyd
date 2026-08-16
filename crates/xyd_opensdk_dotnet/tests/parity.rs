//! Tier-1 full-tree golden parity: `generate_dotnet(input.json)` === the committed
//! `output/` tree from `@xyd-js/opensdk-dotnet`, byte-exact. Now that the emitter
//! produces the FULL tree (adds the vendored runtime `Transport.cs`/`Pagination.cs`
//! plus the `<Sdk>.Tests/**` project), each fixture is checked three ways — every
//! golden file is emitted and byte-exact; every emitted file has a matching golden
//! (no extras); and a per-fixture floor equal to the golden file count so a silent
//! drop can't pass. Diffs report the path plus the first differing line.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opensdk_dotnet::generate_dotnet;

fn fixtures_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-dotnet/__fixtures__")
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
    let dir = fixtures_root().join(name);
    let input = std::fs::read_to_string(dir.join("input.json"))
        .unwrap_or_else(|e| panic!("read {name}/input.json: {e}"));
    let spec: Value = serde_json::from_str(&input).expect("parse input.json");

    let emitted = generate_dotnet(&spec);
    let golden = read_golden_tree(&dir.join("output"));

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
fn parity_1_basic() {
    run_case("1.basic");
}

#[test]
fn parity_2_wire() {
    run_case("2.wire");
}

#[test]
fn parity_3_unions() {
    run_case("3.unions");
}

#[test]
fn parity_9_x_open_sdk() {
    run_case("9.x-open-sdk");
}
