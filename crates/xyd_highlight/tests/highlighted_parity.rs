//! H3 parity gate — asserts [`highlighted_code`] reproduces the REAL
//! `codehike/code` `highlight()` output byte-for-byte across the H2 language
//! corpus + `meta`/edge cases, in github-dark + dark-plus.
//!
//! The oracle is JS-OWNED: `scripts/gen-codehike-goldens.mjs` runs the actual
//! `codehike/code` `highlight()` the xyd sites consume and commits
//! `tests/goldens-codehike/*.json` (each = `{name, value, alias, meta,
//! themes:{<theme>: HighlightedCode}}`). This test loads those goldens and
//! compares them to `highlighted_code(value, alias, meta, theme)`. Rust NEVER
//! writes goldens.
//!
//! Everything runs off the crate's OWN embedded assets — no codehike at test
//! time, no network.

use std::path::PathBuf;

use serde_json::Value;
use xyd_highlight::highlighted_code;

fn goldens_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/goldens-codehike")
}

/// A compact, honest first-divergence report between two `HighlightedCode`
/// objects: names the differing scalar field, or the first differing `tokens`
/// element (which token, not just "tokens differ").
fn first_divergence(expected: &Value, got: &Value) -> String {
    let (eo, go) = match (expected.as_object(), got.as_object()) {
        (Some(e), Some(g)) => (e, g),
        _ => return format!("shape mismatch\n  expected: {expected}\n  got:      {got}"),
    };
    for key in [
        "value",
        "lang",
        "meta",
        "code",
        "annotations",
        "themeName",
        "style",
    ] {
        if eo.get(key) != go.get(key) {
            return format!(
                "field `{key}`:\n    expected: {}\n    got:      {}",
                eo.get(key).unwrap_or(&Value::Null),
                go.get(key).unwrap_or(&Value::Null)
            );
        }
    }
    let et = eo.get("tokens").and_then(Value::as_array);
    let gt = go.get("tokens").and_then(Value::as_array);
    if let (Some(et), Some(gt)) = (et, gt) {
        for (i, (e, g)) in et.iter().zip(gt.iter()).enumerate() {
            if e != g {
                return format!("tokens[{i}]:\n    expected: {e}\n    got:      {g}");
            }
        }
        if et.len() != gt.len() {
            return format!(
                "tokens length {} != {}\n    expected tail: {:?}\n    got tail:      {:?}",
                et.len(),
                gt.len(),
                et.get(gt.len().min(et.len())),
                gt.get(et.len().min(gt.len())),
            );
        }
    }
    "no divergence found (values equal?)".to_string()
}

#[test]
fn codehike_goldens_parity() {
    let dir = goldens_dir();
    let mut cases: Vec<_> = std::fs::read_dir(&dir)
        .unwrap_or_else(|e| panic!("read goldens {}: {e}", dir.display()))
        .flatten()
        .map(|e| e.path())
        .filter(|p| p.extension().is_some_and(|x| x == "json"))
        .collect();
    cases.sort();
    assert!(
        !cases.is_empty(),
        "no codehike goldens in {}",
        dir.display()
    );

    let mut failures = Vec::new();
    let mut checked = 0usize;
    for path in &cases {
        let name = path.file_stem().unwrap().to_string_lossy().into_owned();
        let json = std::fs::read_to_string(path).unwrap();
        let golden: Value = serde_json::from_str(&json).expect("valid golden JSON");
        let value = golden["value"].as_str().expect("golden.value");
        let alias = golden["alias"].as_str().expect("golden.alias");
        let meta = golden["meta"].as_str().expect("golden.meta");
        let themes = golden["themes"].as_object().expect("golden.themes");
        for (theme, expected) in themes {
            checked += 1;
            let hc = highlighted_code(value, alias, meta, theme);
            let got = serde_json::to_value(&hc).expect("serialize HighlightedCode");
            // Value equality (the task's spec) is order-insensitive for objects
            // under `preserve_order`, so ALSO compare serialized strings — that
            // pins key order (value/lang/meta/code/tokens/annotations/themeName/
            // style, and color/background/colorScheme) to codehike's exactly. The
            // golden Value keeps its file key order (preserve_order), so
            // re-serializing it yields codehike's byte string.
            let got_str = serde_json::to_string(&got).expect("serialize got");
            let exp_str = serde_json::to_string(expected).expect("serialize expected");
            if &got != expected || got_str != exp_str {
                failures.push(format!(
                    "\n[{name} x {theme}] (alias={alias}) MISMATCH\n  {}",
                    first_divergence(expected, &got)
                ));
            }
        }
    }

    assert!(
        failures.is_empty(),
        "codehike byte-parity failures ({} of {checked} cells):{}",
        failures.len(),
        failures.join("")
    );
}
