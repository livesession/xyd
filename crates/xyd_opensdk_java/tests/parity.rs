//! Full-tree golden parity: `generate_java(input.json)` reproduces each fixture's
//! ENTIRE `output/` tree byte-exact — the generated code AND the vendored runtime
//! (Json, Transport, the status-mapped exception hierarchy, page containers) AND
//! the SDK's own test suite. Bidirectional: (a) every golden is emitted and
//! byte-identical, (b) nothing extra is emitted, (c) counts match. Diffs report
//! the path + first differing line.

use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

use xyd_opensdk_java::generate_java;

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-java/__fixtures__")
}

/// Every file under `output/`, relative to it.
fn golden_files(out_root: &Path) -> BTreeMap<String, String> {
    let mut map = BTreeMap::new();
    fn walk(root: &Path, dir: &Path, map: &mut BTreeMap<String, String>) {
        for entry in std::fs::read_dir(dir).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                walk(root, &path, map);
            } else {
                let rel = path
                    .strip_prefix(root)
                    .unwrap()
                    .to_string_lossy()
                    .to_string();
                map.insert(rel, std::fs::read_to_string(&path).unwrap());
            }
        }
    }
    walk(out_root, out_root, &mut map);
    map
}

fn first_diff(a: &str, b: &str) -> String {
    for (i, (la, lb)) in a.lines().zip(b.lines()).enumerate() {
        if la != lb {
            return format!("line {}: rust={la:?} golden={lb:?}", i + 1);
        }
    }
    if a.lines().count() != b.lines().count() {
        return format!(
            "line count rust={} golden={}",
            a.lines().count(),
            b.lines().count()
        );
    }
    "trailing bytes differ".to_string()
}

fn check(fixture: &str) {
    let dir = fixtures_dir().join(fixture);
    let spec: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("input.json")).unwrap()).unwrap();
    let emitted: BTreeMap<String, String> = generate_java(&spec);
    let golden = golden_files(&dir.join("output"));

    let mut problems: Vec<String> = Vec::new();

    // (a) every golden emitted + byte-exact
    for (rel, gold) in &golden {
        match emitted.get(rel) {
            Some(got) if got == gold => {}
            Some(got) => problems.push(format!("{rel}: DIFFERS ({})", first_diff(got, gold))),
            None => problems.push(format!("{rel}: in golden tree but NOT emitted")),
        }
    }
    // (b) no extras
    for rel in emitted.keys() {
        if !golden.contains_key(rel) {
            problems.push(format!("{rel}: emitted but NOT in golden tree"));
        }
    }

    let emitted_paths: BTreeSet<&String> = emitted.keys().collect();
    let golden_paths: BTreeSet<&String> = golden.keys().collect();
    let matched = golden
        .iter()
        .filter(|(k, v)| emitted.get(*k).map(|g| g == *v).unwrap_or(false))
        .count();
    println!(
        "[{fixture}] {matched}/{} golden files byte-exact",
        golden.len()
    );

    assert!(
        problems.is_empty(),
        "[{fixture}] {} problem(s):\n{}",
        problems.len(),
        problems.join("\n")
    );
    // (c) count floor — full-tree, both directions
    assert_eq!(
        emitted_paths, golden_paths,
        "[{fixture}] emitted/golden path sets differ"
    );
    assert_eq!(
        emitted.len(),
        golden.len(),
        "[{fixture}] emitted {} files, golden has {}",
        emitted.len(),
        golden.len()
    );
    assert!(!golden.is_empty(), "[{fixture}] empty golden tree");
}

#[test]
fn basic() {
    check("1.basic");
}
#[test]
fn wire() {
    check("2.wire");
}
#[test]
fn unions() {
    check("3.unions");
}
#[test]
fn x_open_sdk() {
    check("9.x-open-sdk");
}
