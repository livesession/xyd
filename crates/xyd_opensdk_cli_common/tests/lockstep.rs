//! Contract lockstep gate: the shared `input.json` files every CLI-mode
//! emitter generates from are BLESSED CONVERTER OUTPUT — this test converts
//! each case's `opencli.json` and byte-compares, so the emitters can never
//! consume an IR shape the converter doesn't actually emit.
//!
//! Regenerate (then review):
//!   XYD_BLESS=1 cargo test -p xyd_opensdk_cli_common --test lockstep

use std::path::PathBuf;

use xyd_opencli2opensdk::opencli2opensdk;
use xyd_opensdk_cli_common::testkit::{bless, common_fixtures_dir, fixture_cases};
use xyd_opensdk_cli_common::{is_cli_spec, CliPlan, CliRoot};

/// Cases enumerated by their SOURCE (`opencli.json`) — `fixture_cases()`
/// filters on the blessed `input.json`, which this very test mints.
fn source_cases() -> Vec<PathBuf> {
    let dir = common_fixtures_dir();
    let mut cases: Vec<PathBuf> = std::fs::read_dir(&dir)
        .unwrap_or_else(|e| panic!("read {}: {e}", dir.display()))
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.is_dir() && p.join("opencli.json").exists())
        .collect();
    cases.sort();
    cases
}

#[test]
fn shared_inputs_are_converter_output() {
    let cases = source_cases();
    assert!(!cases.is_empty(), "no shared fixture cases found");

    let mut failures: Vec<String> = Vec::new();
    for case in &cases {
        let name = case.file_name().unwrap().to_string_lossy().to_string();
        let source_path = case.join("opencli.json");
        let source = std::fs::read_to_string(&source_path)
            .unwrap_or_else(|e| panic!("read {}: {e}", source_path.display()));
        let doc: serde_json::Value = serde_json::from_str(&source)
            .unwrap_or_else(|e| panic!("parse {}: {e}", source_path.display()));
        let spec = opencli2opensdk(&doc, None).unwrap_or_else(|e| panic!("convert {name}: {e}"));
        let mut rendered = serde_json::to_string_pretty(&spec).expect("serialize");
        rendered.push('\n');

        let input_path = case.join("input.json");
        if bless() {
            std::fs::write(&input_path, &rendered)
                .unwrap_or_else(|e| panic!("bless {}: {e}", input_path.display()));
            continue;
        }
        let committed = std::fs::read_to_string(&input_path).unwrap_or_else(|e| {
            panic!(
                "read {}: {e} (run XYD_BLESS=1 cargo test to mint it)",
                input_path.display()
            )
        });
        if rendered != committed {
            failures.push(name);
        }
    }
    if !failures.is_empty() {
        panic!(
            "LOCKSTEP FAILED — shared inputs are stale for: {} (XYD_BLESS=1 to regenerate, then review)",
            failures.join(", ")
        );
    }
}

/// Every shared input must parse through the consume-side contract layer —
/// the same code path the emitters use.
#[test]
fn shared_inputs_satisfy_the_consume_contract() {
    for case in fixture_cases() {
        let name = case.file_name().unwrap().to_string_lossy().to_string();
        let input_path = case.join("input.json");
        if !input_path.exists() {
            continue; // lockstep test reports the mint hint
        }
        let spec: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&input_path).expect("read input"))
                .expect("parse input");
        assert!(is_cli_spec(&spec), "{name}: not detected as CLI-mode");
        CliRoot::parse(&spec).unwrap_or_else(|e| panic!("{name}: {e}"));

        let mut stack: Vec<&serde_json::Value> = vec![&spec];
        let mut methods = 0usize;
        while let Some(node) = stack.pop() {
            if let Some(ms) = node.get("methods").and_then(|m| m.as_array()) {
                for m in ms {
                    CliPlan::for_method(m).unwrap_or_else(|e| panic!("{name}: {e}"));
                    methods += 1;
                }
            }
            if let Some(rs) = node.get("resources").and_then(|r| r.as_array()) {
                stack.extend(rs);
            }
        }
        assert!(methods > 0, "{name}: no methods found");
    }
}
