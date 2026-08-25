//! Self-contained golden gate (this crate is Rust-only: no TS oracle, no
//! xyd_parity fixtures_dir — the committed `output.json` files ARE the
//! contract, reviewed by hand).
//!
//! For every `__fixtures__/<case>/`, run the converter on `input.json`
//! (+ optional `options.json`) and byte-compare the pretty-printed spec
//! against the committed `output.json`.
//!
//! Regenerate the goldens (then review the diff — they are the emitter
//! contract):
//!   XYD_BLESS=1 cargo test -p xyd_opencli2opensdk

use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opencli2opensdk::{opencli2opensdk, Error, Options};

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("__fixtures__")
}

fn read_json(path: &Path) -> Value {
    let raw =
        std::fs::read_to_string(path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()));
    serde_json::from_str(&raw).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()))
}

fn cases() -> Vec<PathBuf> {
    let dir = fixtures_dir();
    let mut cases: Vec<PathBuf> = std::fs::read_dir(&dir)
        .unwrap_or_else(|e| panic!("read {}: {e}", dir.display()))
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.is_dir() && p.join("input.json").exists())
        .collect();
    cases.sort();
    cases
}

fn run_case(case_dir: &Path) -> String {
    let input = read_json(&case_dir.join("input.json"));
    let options: Option<Options> = {
        let path = case_dir.join("options.json");
        if path.exists() {
            Some(
                serde_json::from_value(read_json(&path))
                    .unwrap_or_else(|e| panic!("bad options in {}: {e}", path.display())),
            )
        } else {
            None
        }
    };
    let spec = opencli2opensdk(&input, options)
        .unwrap_or_else(|e| panic!("convert {}: {e}", case_dir.display()));
    let mut rendered = serde_json::to_string_pretty(&spec).expect("serialize spec");
    rendered.push('\n');
    rendered
}

/// First divergence, with a little context, for a readable failure message.
fn first_divergence(got: &str, want: &str) -> String {
    let got_lines: Vec<&str> = got.lines().collect();
    let want_lines: Vec<&str> = want.lines().collect();
    let n = got_lines.len().max(want_lines.len());
    for i in 0..n {
        let g = got_lines.get(i).copied().unwrap_or("<eof>");
        let w = want_lines.get(i).copied().unwrap_or("<eof>");
        if g != w {
            return format!("line {}:\n      got:  {g}\n      want: {w}", i + 1);
        }
    }
    "identical lines but differing bytes (trailing whitespace?)".to_string()
}

#[test]
fn golden_all_cases() {
    let bless = std::env::var("XYD_BLESS").is_ok();
    let cases = cases();
    assert!(!cases.is_empty(), "no fixture cases found");

    let mut failures: Vec<String> = Vec::new();
    for case in &cases {
        let name = case.file_name().unwrap().to_string_lossy().to_string();
        let rendered = run_case(case);
        let golden_path = case.join("output.json");
        if bless {
            std::fs::write(&golden_path, &rendered)
                .unwrap_or_else(|e| panic!("bless {}: {e}", golden_path.display()));
            continue;
        }
        let golden = std::fs::read_to_string(&golden_path).unwrap_or_else(|e| {
            panic!(
                "read golden {}: {e} (run XYD_BLESS=1 cargo test to mint it)",
                golden_path.display()
            )
        });
        if rendered != golden {
            failures.push(format!(
                "  {name}: {}",
                first_divergence(&rendered, &golden)
            ));
        }
    }

    if !failures.is_empty() {
        panic!(
            "GOLDEN FAILED — {} of {} cases diverged (XYD_BLESS=1 to regenerate, then review):\n{}",
            failures.len(),
            cases.len(),
            failures.join("\n")
        );
    }
    eprintln!("golden: {} cases identical", cases.len());
}

#[test]
fn rejects_non_opencli_input() {
    let doc: Value = serde_json::json!({ "openapi": "3.0.0", "paths": {} });
    match opencli2opensdk(&doc, None) {
        Err(Error::NotOpenCli(got)) => assert_eq!(got, "undefined"),
        Err(e) => panic!("expected NotOpenCli, got {e}"),
        Ok(_) => panic!("expected NotOpenCli, got Ok"),
    }
}

#[test]
fn rejects_empty_document() {
    let doc: Value = serde_json::json!({ "opencli": "1.0.0", "info": { "title": "x" } });
    match opencli2opensdk(&doc, None) {
        Err(Error::Empty) => {}
        Err(e) => panic!("expected Empty, got {e}"),
        Ok(_) => panic!("expected Empty, got Ok"),
    }
}
