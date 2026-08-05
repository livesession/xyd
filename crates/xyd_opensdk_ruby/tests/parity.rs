//! Tier-1 golden parity: generate_ruby(input.json) === the committed output/
//! tree, byte-exact per EMITTED file. The emitter is a generated-code emitter
//! (deferred: transport.rb runtime + test/*), so we compare only the files it
//! emits and REQUIRE every emitted file to match a golden — with an explicit
//! floor so a silently-empty emit can't pass. (Self-contained; no xyd_parity.)

use serde_json::Value;
use std::path::{Path, PathBuf};

use xyd_opensdk_ruby::generate_ruby;

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/xyd-opensdk-ruby/__fixtures__")
}

fn run_case(name: &str, min_files: usize) {
    let case = fixtures_dir().join(name);
    let input: Value =
        serde_json::from_str(&std::fs::read_to_string(case.join("input.json")).unwrap()).unwrap();
    let emitted = generate_ruby(&input);
    let out_dir = case.join("output");

    let mut checked = 0usize;
    let mut mismatches: Vec<String> = Vec::new();
    for (rel, content) in &emitted {
        let golden_path = out_dir.join(rel);
        assert!(
            golden_path.exists(),
            "{name}: emitted {rel} but there is no golden at {}",
            golden_path.display()
        );
        let golden = std::fs::read_to_string(&golden_path).unwrap();
        if &golden != content {
            // Show the first differing line for a precise report.
            let first = golden
                .lines()
                .zip(content.lines())
                .enumerate()
                .find(|(_, (a, b))| a != b)
                .map(|(i, (a, b))| format!(" first diff line {}: golden={a:?} rust={b:?}", i + 1))
                .unwrap_or_else(|| " (length/tail differs)".to_string());
            mismatches.push(format!("  {rel}:{first}"));
        }
        checked += 1;
    }
    assert!(
        mismatches.is_empty(),
        "{name}: {} file(s) diverged:\n{}",
        mismatches.len(),
        mismatches.join("\n")
    );
    assert!(
        checked >= min_files,
        "{name}: only {checked} files emitted (< floor {min_files}) — emitter likely broke"
    );
}

#[test]
fn basic() {
    run_case("1.basic", 5);
}
#[test]
fn wire() {
    run_case("2.wire", 5);
}
#[test]
fn unions() {
    run_case("3.unions", 5);
}
#[test]
fn x_open_sdk() {
    run_case("9.x-open-sdk", 5);
}
