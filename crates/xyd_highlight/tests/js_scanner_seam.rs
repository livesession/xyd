//! Delegated-backend (`js-scanner`) seam parity — runs ONLY under
//! `--no-default-features --features js-scanner`.
//!
//! Proves the delegated scanner seam is behavior-preserving: with a
//! `ScannerBackend` wired to Oniguruma (here the native `onig` **dev**-dep,
//! standing in for the wasm build's onig.wasm), `highlighted_code()` reproduces
//! the committed codehike goldens (`tests/goldens-codehike/*.json`)
//! byte-for-byte — exactly like the default `native-onig` build.
//!
//! This is the in-repo evidence for route (a) in
//! `.ai/client-wasm-highlighter-spike.md`: the ENTIRE engine runs through the
//! host-registered seam (`OnigScanner::new` / `find_next_match` →
//! `ScannerBackend`), and only the regex primitive is delegated. Because
//! onig.wasm is the SAME Oniguruma engine (same UTF-8-byte match semantics),
//! swapping this dev-dep backend for the wasm one preserves parity by
//! construction.
//!
//! Under the default features this file compiles to an empty crate (the
//! `#![cfg]` gate), so it never runs in the normal `native-onig` test pass.
#![cfg(all(feature = "js-scanner", not(feature = "native-onig")))]

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use onig::{Regex, RegexOptions, Region, SearchOptions, Syntax};
use serde_json::Value;
use xyd_highlight::{
    highlighted_code, register_scanner_backend, CaptureSpan, ScanMatch, ScannerBackend,
};

/// An Oniguruma-backed [`ScannerBackend`]. `onig::Regex` is not `Send`/`Sync`,
/// so it can't live in the `Send + Sync` backend; instead we store the pattern
/// STRINGS per handle and (re)compile on each `find`. The engine creates one
/// scanner per tokenizer step and searches it once (find-once), so this matches
/// the native backend's compile cost — no correctness or speed surprise.
#[derive(Default)]
struct OnigDevBackend {
    patterns: Mutex<HashMap<u64, Vec<String>>>,
    next: AtomicU64,
}

impl ScannerBackend for OnigDevBackend {
    fn compile(&self, patterns: &[&str]) -> u64 {
        let id = self.next.fetch_add(1, Ordering::SeqCst);
        self.patterns
            .lock()
            .unwrap()
            .insert(id, patterns.iter().map(|s| s.to_string()).collect());
        id
    }

    fn find(&self, handle: u64, text: &str, start: usize) -> Option<ScanMatch> {
        let patterns = self.patterns.lock().unwrap().get(&handle).cloned()?;

        // Byte-identical to the native backend's earliest-match algorithm:
        // strictly-earlier start wins, ties keep the lower pattern index, a
        // match exactly at `start` short-circuits. A pattern that fails to
        // compile is inert (skipped), never an error.
        let mut best: Option<(usize, usize, Region)> = None; // (index, match_start, region)
        for (index, pat) in patterns.iter().enumerate() {
            let Ok(regex) = Regex::with_options(
                pat,
                RegexOptions::REGEX_OPTION_CAPTURE_GROUP,
                Syntax::default(),
            ) else {
                continue;
            };
            let mut region = Region::new();
            let found = regex.search_with_options(
                text,
                start,
                text.len(),
                SearchOptions::SEARCH_OPTION_NONE,
                Some(&mut region),
            );
            let Some(match_start) = found else { continue };

            let take = match &best {
                Some((_, best_start, _)) => match_start < *best_start,
                None => true,
            };
            if take {
                best = Some((index, match_start, region));
            }
            if match_start == start {
                break;
            }
        }

        best.map(|(pattern_index, _, region)| ScanMatch {
            pattern_index,
            captures: (0..region.len())
                .map(|i| region.pos(i))
                .collect::<Vec<CaptureSpan>>(),
        })
    }

    fn free(&self, handle: u64) {
        self.patterns.lock().unwrap().remove(&handle);
    }
}

fn goldens_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/goldens-codehike")
}

/// The curated subset exercised through the delegated seam. Kept to the four
/// languages the task names (js/ts/json/bash) so the recompile-per-find backend
/// stays fast; the FULL corpus runs through the native backend in
/// `highlighted_parity.rs`.
const SEAM_GOLDENS: &[&str] = &["js", "ts", "json", "bash"];

#[test]
fn delegated_backend_matches_codehike_goldens() {
    register_scanner_backend(Box::<OnigDevBackend>::default());

    let dir = goldens_dir();
    let mut failures = Vec::new();
    let mut checked = 0usize;

    for name in SEAM_GOLDENS {
        let path = dir.join(format!("{name}.json"));
        let json = std::fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("read golden {}: {e}", path.display()));
        let golden: Value = serde_json::from_str(&json).expect("valid golden JSON");
        let value = golden["value"].as_str().expect("golden.value");
        let alias = golden["alias"].as_str().expect("golden.alias");
        let meta = golden["meta"].as_str().expect("golden.meta");
        let themes = golden["themes"].as_object().expect("golden.themes");

        for (theme, expected) in themes {
            checked += 1;
            let hc = highlighted_code(value, alias, meta, theme);
            let got = serde_json::to_value(&hc).expect("serialize HighlightedCode");
            // Value equality plus serialized-string equality (pins key order),
            // exactly like the native goldens gate.
            let got_str = serde_json::to_string(&got).expect("serialize got");
            let exp_str = serde_json::to_string(expected).expect("serialize expected");
            if &got != expected || got_str != exp_str {
                failures.push(format!("[{name} x {theme}] (alias={alias}) MISMATCH"));
            }
        }
    }

    assert!(checked > 0, "no seam goldens checked");
    assert!(
        failures.is_empty(),
        "delegated-backend byte-parity failures ({} of {checked} cells): {}",
        failures.len(),
        failures.join(", ")
    );
}
