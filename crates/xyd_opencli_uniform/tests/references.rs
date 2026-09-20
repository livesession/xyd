//! Golden gate for the OpenCLI → Uniform converter.
//!
//! The oracle is `packages/xyd-opencli/__fixtures__/references/<case>/`, frozen
//! from the TypeScript `opencliToReferences` (commit 3ad88386):
//!
//! ```text
//! input.json                   an OpenCLI document
//! references.json              expected output with DEFAULT options
//! references.per-command.json  expected output with { globalOptionsPerCommand: true }
//! ```
//!
//! These files are READ-ONLY. If Rust and a golden disagree, Rust is wrong —
//! never regenerate them from this side.

use std::path::{Path, PathBuf};

use serde_json::Value;
use xyd_opencli_uniform::{opencli_to_references, OpencliToReferencesOptions};
use xyd_uniform::canon;

const DEFAULT_GOLDEN: &str = "references.json";
const PER_COMMAND_GOLDEN: &str = "references.per-command.json";

fn fixtures_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("packages")
        .join("xyd-opencli")
        .join("__fixtures__")
        .join("references")
}

/// Case directories (those carrying both goldens), sorted for stable ordering.
fn cases() -> Vec<PathBuf> {
    let dir = fixtures_dir();
    let mut cases: Vec<PathBuf> = std::fs::read_dir(&dir)
        .unwrap_or_else(|e| panic!("read fixtures dir {}: {e}", dir.display()))
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.is_dir() && p.join(DEFAULT_GOLDEN).exists())
        .collect();
    cases.sort();
    cases
}

fn read(path: &Path) -> Value {
    let raw =
        std::fs::read_to_string(path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()));
    serde_json::from_str(&raw).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()))
}

/// Compare one case in one mode. `Ok(reference count)` so the caller can prove
/// the comparison was not vacuous; `Err(report)` on divergence.
fn check(case: &Path, golden: &str, options: &OpencliToReferencesOptions) -> Result<usize, String> {
    let name = case.file_name().unwrap().to_string_lossy();
    let spec = read(&case.join("input.json"));
    let expected = read(&case.join(golden));
    let actual = Value::Array(opencli_to_references(&spec, options));

    if canon::canon_eq(&actual, &expected) {
        // Structural equality is the vitest `toEqual` oracle semantics, but the
        // goldens are `JSON.stringify(refs, null, 2)` artifacts — so also pin
        // the SERIALIZATION (key order, 2-space indent). serde_json is built
        // with `preserve_order`, making insertion order observable here.
        let rendered = serde_json::to_string_pretty(&actual).expect("serialize");
        let golden_text = std::fs::read_to_string(case.join(golden)).expect("read golden");
        if rendered.trim_end() != golden_text.trim_end() {
            return Err(format!(
                "  {name}/{golden}: structurally equal but SERIALIZATION differs \
                 (key order / formatting)\n{}",
                first_line_diff(&rendered, &golden_text)
            ));
        }
        return Ok(expected.as_array().map(Vec::len).unwrap_or(0));
    }

    let diffs = canon::diff_paths(&actual, &expected, 12)
        .iter()
        .map(|(ptr, rust, oracle)| {
            format!(
                "    at {ptr}\n      rust:   {}\n      golden: {}",
                truncate(&rust.to_string()),
                truncate(&oracle.to_string())
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    Err(format!("  {name}/{golden}\n{diffs}"))
}

/// Run every case in one mode, reporting the pass count out of the total rather
/// than aborting on the first divergence.
fn run_mode(golden: &str, options: &OpencliToReferencesOptions) {
    let cases = cases();
    assert!(!cases.is_empty(), "no fixture cases discovered");

    let mut passed = 0usize;
    let mut refs = 0usize;
    let mut failures: Vec<String> = Vec::new();
    for case in &cases {
        match check(case, golden, options) {
            Ok(n) => {
                passed += 1;
                refs += n;
            }
            Err(report) => failures.push(report),
        }
    }

    assert!(
        failures.is_empty(),
        "{golden}: {passed}/{} case(s) matched — {} FAILED:\n{}",
        cases.len(),
        failures.len(),
        failures.join("\n"),
    );
    assert!(refs > 0, "goldens contained no references at all");
    eprintln!(
        "{golden}: {passed}/{} case(s), {refs} reference(s) compared",
        cases.len()
    );
}

/// First differing line of two renderings, for the serialization report.
fn first_line_diff(rust: &str, golden: &str) -> String {
    for (i, (a, b)) in rust.lines().zip(golden.lines()).enumerate() {
        if a != b {
            return format!(
                "    line {}\n      rust:   {}\n      golden: {}",
                i + 1,
                truncate(a),
                truncate(b)
            );
        }
    }
    format!(
        "    line counts differ: rust {} vs golden {}",
        rust.lines().count(),
        golden.lines().count()
    )
}

fn truncate(s: &str) -> String {
    const MAX: usize = 200;
    if s.len() <= MAX {
        return s.to_string();
    }
    let mut end = MAX;
    while !s.is_char_boundary(end) {
        end -= 1;
    }
    format!("{}… ({} bytes)", &s[..end], s.len())
}

#[test]
fn fixture_cases_are_discovered() {
    let cases = cases();
    assert!(
        !cases.is_empty(),
        "no fixture cases found under {} — the golden gate would pass vacuously",
        fixtures_dir().display()
    );
    // Every case must carry BOTH goldens, or one mode silently goes untested.
    for case in &cases {
        assert!(
            case.join(PER_COMMAND_GOLDEN).exists(),
            "{}: missing {PER_COMMAND_GOLDEN}",
            case.display()
        );
    }
    assert_eq!(cases.len(), 17, "expected the 17 committed fixture cases");
}

#[test]
fn default_options_match_goldens() {
    run_mode(DEFAULT_GOLDEN, &OpencliToReferencesOptions::default());
}

#[test]
fn global_options_per_command_matches_goldens() {
    run_mode(
        PER_COMMAND_GOLDEN,
        &OpencliToReferencesOptions {
            regions: None,
            global_options_per_command: true,
        },
    );
}

/// The two modes must actually differ somewhere, otherwise
/// `global_options_per_command` could be a no-op and both gates would still be
/// green. `6.xyd-cli` is the case with root-level recursive options.
#[test]
fn the_two_modes_diverge_on_a_cli_with_global_options() {
    let case = fixtures_dir().join("6.xyd-cli");
    let default = read(&case.join(DEFAULT_GOLDEN));
    let per_command = read(&case.join(PER_COMMAND_GOLDEN));
    assert!(
        !canon::canon_eq(&default, &per_command),
        "6.xyd-cli goldens are identical across modes — the gate cannot detect a no-op"
    );
}
