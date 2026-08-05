//! H1 snapshot-parity gate: reproduce the `syntax0-highlight` test inputs and
//! assert `highlight(code, lang, theme).lines` is byte-identical to the
//! reference engine's output for **js/ts/json/bash × github-dark/dark-plus**.
//!
//! The committed oracle (`js × github-dark`) equals
//! `test/__snapshots__/tokens.test.ts.snap` verbatim (see [`committed_tokens_snapshot`]).
//! The remaining seven cells are pinned to the output of the real
//! `@syntax0/highlight` engine run over the identical `tokens.test.ts` input —
//! i.e. the reference the Rust port must match.
//!
//! Grammars + themes load from the code9 CDN tree (`syntax0-cdn/dist-static`).
//! Override the base dir with `XYD_HIGHLIGHT_FIXTURES` when the checkout lives
//! elsewhere.

use std::path::PathBuf;

use serde_json::Value;
use xyd_highlight::theme::Theme;
use xyd_highlight::{highlight, Grammar};

/// The exact code from `tokens.test.ts` / `scopes.test.ts`.
const CODE: &str = "export default   function Gallery() {\n\n  }";

/// Reference output for the H1 matrix, keyed `"<lang>__<theme>"`. `js__github-dark`
/// is byte-identical to the committed `tokens.test.ts.snap`; the rest come from
/// running `@syntax0/highlight` on `CODE`.
const ORACLE: &str = r##"{"js__github-dark":[[{"content":"export default   function ","style":{"color":"#FF7B72"}},{"content":"Gallery","style":{"color":"#D2A8FF"}},{"content":"() ","style":{"color":"#FFA657"}},{"content":"{","style":{"color":"#C9D1D9"}}],[{"content":"","style":{"color":"#C9D1D9"}}],[{"content":"  }","style":{"color":"#C9D1D9"}}]],"js__dark-plus":[[{"content":"export default   ","style":{"color":"#C586C0"}},{"content":"function ","style":{"color":"#569CD6"}},{"content":"Gallery","style":{"color":"#DCDCAA"}},{"content":"() {","style":{"color":"#D4D4D4"}}],[{"content":"","style":{"color":"#D4D4D4"}}],[{"content":"  }","style":{"color":"#D4D4D4"}}]],"ts__github-dark":[[{"content":"export default   function ","style":{"color":"#FF7B72"}},{"content":"Gallery","style":{"color":"#D2A8FF"}},{"content":"() ","style":{"color":"#FFA657"}},{"content":"{","style":{"color":"#C9D1D9"}}],[{"content":"","style":{"color":"#C9D1D9"}}],[{"content":"  }","style":{"color":"#C9D1D9"}}]],"ts__dark-plus":[[{"content":"export default   ","style":{"color":"#C586C0"}},{"content":"function ","style":{"color":"#569CD6"}},{"content":"Gallery","style":{"color":"#DCDCAA"}},{"content":"() {","style":{"color":"#D4D4D4"}}],[{"content":"","style":{"color":"#D4D4D4"}}],[{"content":"  }","style":{"color":"#D4D4D4"}}]],"json__github-dark":[[{"content":"export default   function Gallery() {","style":{"color":"#C9D1D9"}}],[{"content":"","style":{"color":"#C9D1D9"}}],[{"content":"  }","style":{"color":"#C9D1D9"}}]],"json__dark-plus":[[{"content":"export default   function Gallery() {","style":{"color":"#D4D4D4"}}],[{"content":"","style":{"color":"#D4D4D4"}}],[{"content":"  }","style":{"color":"#D4D4D4"}}]],"bash__github-dark":[[{"content":"export","style":{"color":"#FF7B72"}},{"content":" default   function Gallery() {","style":{"color":"#C9D1D9"}}],[{"content":"","style":{"color":"#C9D1D9"}}],[{"content":"  }","style":{"color":"#C9D1D9"}}]],"bash__dark-plus":[[{"content":"export ","style":{"color":"#569CD6"}},{"content":"default   function Gallery","style":{"color":"#9CDCFE"}},{"content":"() {","style":{"color":"#D4D4D4"}}],[{"content":"","style":{"color":"#D4D4D4"}}],[{"content":"  }","style":{"color":"#D4D4D4"}}]]}"##;

const DEFAULT_FIXTURES: &str =
    "/Users/zdunecki/Code/livesession/codable/third-party/code9/packages/syntax0-cdn/dist-static";

fn fixtures_base() -> PathBuf {
    std::env::var("XYD_HIGHLIGHT_FIXTURES")
        .unwrap_or_else(|_| DEFAULT_FIXTURES.to_string())
        .into()
}

/// `lang alias → (grammar file id, scopeName)` — the subset of
/// `language-data.ts` needed for H1.
fn lang_data(lang: &str) -> (&'static str, &'static str) {
    match lang {
        "js" => ("javascript", "source.js"),
        "ts" => ("typescript", "source.ts"),
        "json" => ("json", "source.json"),
        "bash" => ("shellscript", "source.shell"),
        other => panic!("unsupported H1 lang: {other}"),
    }
}

fn load_grammar(lang: &str) -> Grammar {
    let (id, scope) = lang_data(lang);
    let path = fixtures_base().join("grammars").join(format!("{id}.json"));
    let json = std::fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("read grammar {}: {e}", path.display()));
    Grammar::load(&json, scope)
}

fn load_theme(name: &str) -> Theme {
    let path = fixtures_base().join("themes").join(format!("{name}.json"));
    let json = std::fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("read theme {}: {e}", path.display()));
    let value: Value = serde_json::from_str(&json).expect("valid theme JSON");
    Theme::from_vscode_json(&value)
}

/// Run the Rust engine and return the `.lines` as a `serde_json::Value` in the
/// same shape as `syntax0`'s snapshot (array of arrays of `{content, style}`).
fn run(lang: &str, theme: &str) -> Value {
    let grammar = load_grammar(lang);
    let theme = load_theme(theme);
    let lines = highlight(CODE, &grammar, &theme);
    serde_json::to_value(lines).expect("serialize styled lines")
}

fn oracle() -> Value {
    serde_json::from_str(ORACLE).expect("valid oracle JSON")
}

#[test]
fn tokens_parity_full_matrix() {
    let oracle = oracle();
    let langs = ["js", "ts", "json", "bash"];
    let themes = ["github-dark", "dark-plus"];

    let mut failures = Vec::new();
    for lang in langs {
        for theme in themes {
            let key = format!("{lang}__{theme}");
            let expected = oracle
                .get(&key)
                .unwrap_or_else(|| panic!("oracle missing {key}"));
            let got = run(lang, theme);
            if &got != expected {
                failures.push(format!(
                    "\n[{key}] MISMATCH\n  expected: {}\n  got:      {}",
                    serde_json::to_string(expected).unwrap(),
                    serde_json::to_string(&got).unwrap(),
                ));
            }
        }
    }

    assert!(
        failures.is_empty(),
        "byte-parity failures:{}",
        failures.join("")
    );
}

/// Explicit, oracle-independent check against the values committed in
/// `tokens.test.ts.snap` (`remove empty space tokens 1`).
#[test]
fn committed_tokens_snapshot() {
    // Transcribed verbatim from
    // test/__snapshots__/tokens.test.ts.snap.
    let expected: Value = serde_json::json!([
        [
            { "content": "export default   function ", "style": { "color": "#FF7B72" } },
            { "content": "Gallery", "style": { "color": "#D2A8FF" } },
            { "content": "() ", "style": { "color": "#FFA657" } },
            { "content": "{", "style": { "color": "#C9D1D9" } }
        ],
        [
            { "content": "", "style": { "color": "#C9D1D9" } }
        ],
        [
            { "content": "  }", "style": { "color": "#C9D1D9" } }
        ]
    ]);

    let got = run("js", "github-dark");
    assert_eq!(
        got, expected,
        "js × github-dark must match the committed snapshot"
    );
}
