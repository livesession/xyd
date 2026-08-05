//! Tier-1 golden parity: generate_java(input.json) === the emitted subset of
//! each fixture's output/ tree, byte-exact. The vendored runtime + *_test.go
//! equivalents are DEFERRED, so the harness compares ONLY the files the emitter
//! produces (no faked full-tree match) and prints coverage per fixture.

use serde_json::Value;
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use xyd_opensdk_java::generate_java;

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-java/__fixtures__")
}

fn run(fixture: &str) -> (usize, usize, Vec<String>) {
    let dir = fixtures_dir().join(fixture);
    let spec: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("input.json")).unwrap()).unwrap();
    let emitted: BTreeMap<String, String> = generate_java(&spec);

    let out_root = dir.join("output");
    let mut matched = 0usize;
    let total = emitted.len();
    let mut mismatches: Vec<String> = Vec::new();

    for (rel, content) in &emitted {
        let golden_path = out_root.join(rel);
        match std::fs::read_to_string(&golden_path) {
            Ok(golden) if &golden == content => matched += 1,
            Ok(golden) => {
                let first = first_diff(content, &golden);
                mismatches.push(format!("{rel}: DIFFERS ({first})"));
            }
            Err(_) => mismatches.push(format!("{rel}: emitted but NOT in golden tree")),
        }
    }
    (matched, total, mismatches)
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
    let (matched, total, mismatches) = run(fixture);
    println!("[{fixture}] {matched}/{total} emitted files byte-exact");
    assert!(
        mismatches.is_empty(),
        "[{fixture}] {} mismatch(es):\n{}",
        mismatches.len(),
        mismatches.join("\n")
    );
    assert!(total > 0, "[{fixture}] emitted nothing");
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
