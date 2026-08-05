//! Snapshot-parity gate — asserts the embedded [`Registry`] reproduces the REAL
//! `@syntax0/highlight` engine byte-for-byte across the top-20 docs languages +
//! two cross-grammar embed cases, in github-dark + dark-plus.
//!
//! The oracle is JS-OWNED: `scripts/gen-goldens.mjs` runs the reference engine
//! over the corpus and commits `tests/goldens/*.json` (each = `{lang, code,
//! themes:{<theme>: lines}}`). This test loads those goldens and compares them to
//! `Registry::highlight_lang(...)`. Rust NEVER writes goldens.
//!
//! Everything here runs off the crate's OWN embedded assets (grammars + themes +
//! language-data baked in by `build.rs`) — no code9 path, no network. That is
//! the proof the corpus is embedded.

use std::path::PathBuf;

use serde_json::Value;
use xyd_highlight::Registry;

fn goldens_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/goldens")
}

/// Run the embedded engine and return the styled `.lines` as JSON, in the same
/// shape as a golden's per-theme entry.
fn run(reg: &Registry, lang: &str, theme: &str, code: &str) -> Value {
    let lines = reg
        .highlight_lang(code, lang, theme)
        .unwrap_or_else(|| panic!("highlight_lang failed for lang={lang} theme={theme}"));
    serde_json::to_value(lines).expect("serialize styled lines")
}

/// The first `[line, token]` index where two token-line arrays diverge, with the
/// offending values — for honest failure reporting (which token, not just which
/// case).
fn first_divergence(expected: &Value, got: &Value) -> String {
    let (e, g) = match (expected.as_array(), got.as_array()) {
        (Some(e), Some(g)) => (e, g),
        _ => return format!("shape mismatch\n  expected: {expected}\n  got:      {got}"),
    };
    for (li, (el, gl)) in e.iter().zip(g.iter()).enumerate() {
        let (ea, ga) = (el.as_array(), gl.as_array());
        if let (Some(ea), Some(ga)) = (ea, ga) {
            for (ti, (et, gt)) in ea.iter().zip(ga.iter()).enumerate() {
                if et != gt {
                    return format!(
                        "line {li} token {ti}:\n    expected: {et}\n    got:      {gt}"
                    );
                }
            }
            if ea.len() != ga.len() {
                return format!(
                    "line {li}: token count {} != {}\n    expected: {el}\n    got:      {gl}",
                    ea.len(),
                    ga.len()
                );
            }
        } else if el != gl {
            return format!("line {li}:\n    expected: {el}\n    got:      {gl}");
        }
    }
    if e.len() != g.len() {
        return format!("line count {} != {}", e.len(), g.len());
    }
    "no divergence found (values equal?)".to_string()
}

/// Byte-parity across every committed golden × every theme it records — the
/// top-20 languages + the cross-grammar embed cases.
#[test]
fn goldens_parity() {
    let reg = Registry::new();
    let dir = goldens_dir();
    let mut cases: Vec<_> = std::fs::read_dir(&dir)
        .unwrap_or_else(|e| panic!("read goldens {}: {e}", dir.display()))
        .flatten()
        .map(|e| e.path())
        .filter(|p| p.extension().is_some_and(|x| x == "json"))
        .collect();
    cases.sort();
    assert!(!cases.is_empty(), "no goldens in {}", dir.display());

    let mut failures = Vec::new();
    let mut checked = 0usize;
    for path in &cases {
        let name = path.file_stem().unwrap().to_string_lossy().into_owned();
        let json = std::fs::read_to_string(path).unwrap();
        let golden: Value = serde_json::from_str(&json).expect("valid golden JSON");
        let lang = golden["lang"].as_str().expect("golden.lang");
        let code = golden["code"].as_str().expect("golden.code");
        let themes = golden["themes"].as_object().expect("golden.themes");
        for (theme, expected) in themes {
            checked += 1;
            let got = run(&reg, lang, theme, code);
            if &got != expected {
                failures.push(format!(
                    "\n[{name} x {theme}] (lang={lang}) MISMATCH\n  {}",
                    first_divergence(expected, &got)
                ));
            }
        }
    }

    assert!(
        failures.is_empty(),
        "byte-parity failures ({} of {checked} cells):{}",
        failures.len(),
        failures.join("")
    );
}

/// Oracle-independent check against the values committed in the reference
/// engine's `tokens.test.ts.snap` (`remove empty space tokens 1`), driven
/// through the EMBEDDED registry — proves the H1 js × github-dark output is
/// still byte-exact and served from baked-in assets.
#[test]
fn committed_tokens_snapshot() {
    let expected: Value = serde_json::json!([
        [
            { "content": "export default   function ", "style": { "color": "#FF7B72" } },
            { "content": "Gallery", "style": { "color": "#D2A8FF" } },
            { "content": "() ", "style": { "color": "#FFA657" } },
            { "content": "{", "style": { "color": "#C9D1D9" } }
        ],
        [ { "content": "", "style": { "color": "#C9D1D9" } } ],
        [ { "content": "  }", "style": { "color": "#C9D1D9" } } ]
    ]);

    let reg = Registry::new();
    let got = run(
        &reg,
        "js",
        "github-dark",
        "export default   function Gallery() {\n\n  }",
    );
    assert_eq!(
        got, expected,
        "js x github-dark must match the committed snapshot (from embedded assets)"
    );
}
