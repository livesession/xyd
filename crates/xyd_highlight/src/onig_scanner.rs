//! `OnigScanner` — the innermost primitive of the TextMate engine.
//!
//! Given N regex patterns and a haystack + a start byte offset, it finds the
//! pattern whose match starts earliest at/after `start` (ties → lowest pattern
//! index) and returns that pattern's index + capture-group byte offsets. `\G`
//! (`ONIG_ANCHOR_BEGIN_POSITION`) anchors at `start`, which is how TextMate
//! `begin`/`while`/`match` rules pin to the tokenizer's current position.
//!
//! Offsets are UTF-8 byte offsets throughout (Oniguruma is byte-oriented on a
//! UTF-8 string). vscode works in UTF-16 internally, but the observable output —
//! the token *content* substrings — is identical for the ASCII-dominant code in
//! the H1 corpus. (Astral-plane fidelity vs UTF-16 unit advancement is tracked
//! for a later stage; no H1 grammar/theme fixture exercises it.)
//!
//! ## Two backends (one primitive)
//!
//! The whole engine (grammar/rule/tokenizer) consumes ONLY the
//! [`OnigScanner::new`] and [`OnigScanner::find_next_match`] pair. This module
//! provides that identical API over two swappable regex backends, selected by
//! feature (exactly one):
//!
//! * **`native-onig`** (default) — a Rust port of `vscode-oniguruma`'s
//!   `OnigScanner.findNextMatchSync` directly over the `onig` crate (Oniguruma
//!   C). This is the server / napi path; unchanged.
//! * **`js-scanner`** — no `onig` dependency (it can't link on wasm32). A host
//!   registers a [`ScannerBackend`] once via [`register_scanner_backend`]; the
//!   wasm crate wires it to the SAME `onig.wasm` (vscode-oniguruma) through a JS
//!   binding, so match semantics — and therefore token output — are byte-parity
//!   preserved by construction. See `.ai/client-wasm-highlighter-spike.md`.

// ---------------------------------------------------------------------------
// Shared public types (both backends)
// ---------------------------------------------------------------------------

/// One capture group's byte span, or `None` when the group did not participate
/// (Oniguruma region `beg == -1`).
pub type CaptureSpan = Option<(usize, usize)>;

/// Result of a scan: which pattern matched + every capture group (index 0 is the
/// whole match).
#[derive(Debug, Clone)]
pub struct ScanMatch {
    pub pattern_index: usize,
    pub captures: Vec<CaptureSpan>,
}

impl ScanMatch {
    /// The whole-match span (capture group 0). Always present on a match.
    pub fn whole(&self) -> (usize, usize) {
        self.captures[0].expect("group 0 is always the whole match")
    }
}

// Exactly-one-backend guard. `native-onig` takes precedence when both are on
// (so a stray `--features js-scanner` on top of the default never yields an
// unregistered backend), which is why the delegated module is gated on
// `not(feature = "native-onig")`.
#[cfg(all(not(feature = "native-onig"), not(feature = "js-scanner")))]
compile_error!(
    "xyd_highlight: enable exactly one scanner backend feature — \
     `native-onig` (default) or `js-scanner`"
);

// ---------------------------------------------------------------------------
// Backend A — native Oniguruma (onig_sys / C). Server / napi path.
// ---------------------------------------------------------------------------

#[cfg(feature = "native-onig")]
mod native {
    use super::{CaptureSpan, ScanMatch};
    use onig::{Regex, RegexOptions, Region, SearchOptions, Syntax};

    /// A compiled set of TextMate patterns searched together. A pattern that
    /// fails to compile is stored as `None` (never matches) — mirroring
    /// vscode-textmate, which logs the bad regex and treats its rule as inert
    /// rather than aborting.
    pub struct OnigScanner {
        regexes: Vec<Option<Regex>>,
    }

    impl OnigScanner {
        /// Compile the patterns. Uses `CAPTURE_GROUP` (all numbered/named groups
        /// end up in the region) + the default Oniguruma syntax, matching
        /// vscode-oniguruma's `onig_new(..., ONIG_OPTION_CAPTURE_GROUP,
        /// ONIG_SYNTAX_DEFAULT, ...)`.
        pub fn new<S: AsRef<str>>(patterns: &[S]) -> Self {
            let regexes = patterns
                .iter()
                .map(|p| {
                    Regex::with_options(
                        p.as_ref(),
                        RegexOptions::REGEX_OPTION_CAPTURE_GROUP,
                        Syntax::default(),
                    )
                    .ok()
                })
                .collect();
            OnigScanner { regexes }
        }

        /// Number of patterns (including any that failed to compile).
        pub fn len(&self) -> usize {
            self.regexes.len()
        }

        pub fn is_empty(&self) -> bool {
            self.regexes.is_empty()
        }

        /// Find the earliest match at/after `start` across all patterns. `start`
        /// must be a char boundary in `text`. Returns `None` if nothing matches.
        pub fn find_next_match(&self, text: &str, start: usize) -> Option<ScanMatch> {
            let mut best: Option<(usize, usize, Region)> = None; // (index, match_start, region)

            for (index, maybe_regex) in self.regexes.iter().enumerate() {
                let Some(regex) = maybe_regex else { continue };
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
                    // Strictly-earlier start wins; equal start keeps the earlier
                    // pattern (lower index), so we do NOT replace on a tie.
                    Some((_, best_start, _)) => match_start < *best_start,
                    None => true,
                };
                if take {
                    best = Some((index, match_start, region));
                }
                // Can't beat a match that starts exactly at `start`; because we
                // scan in index order, the first such pattern also wins ties.
                // Short-circuit exactly as vscode-oniguruma's native scanner does.
                if match_start == start {
                    break;
                }
            }

            best.map(|(pattern_index, _, region)| ScanMatch {
                pattern_index,
                captures: region_to_captures(&region),
            })
        }
    }

    /// Convert an Oniguruma `Region` into per-group spans. Non-participating
    /// groups (`beg == -1`) become `None`.
    fn region_to_captures(region: &Region) -> Vec<CaptureSpan> {
        (0..region.len()).map(|i| region.pos(i)).collect()
    }
}

#[cfg(feature = "native-onig")]
pub use native::OnigScanner;

// ---------------------------------------------------------------------------
// Backend B — delegated (host-registered). wasm / onig.wasm path.
// ---------------------------------------------------------------------------

#[cfg(all(feature = "js-scanner", not(feature = "native-onig")))]
mod delegated {
    use std::sync::OnceLock;

    use super::ScanMatch;

    /// The regex primitive the engine delegates to when built without native
    /// Oniguruma. A host (the wasm crate) implements this over `onig.wasm` and
    /// registers it once via [`register_scanner_backend`].
    ///
    /// Contract (must match the native backend exactly for byte-parity):
    /// * `compile(patterns)` → an opaque scanner handle. A pattern that fails to
    ///   compile must be treated as never-matching (inert), not an error.
    /// * `find(handle, text, start)` → the earliest match at/after the UTF-8
    ///   byte offset `start`, ties broken toward the lowest pattern index; `\G`
    ///   anchored at `start`. Capture spans are UTF-8 byte offsets; a
    ///   non-participating group is `None`. The whole-match group 0 is required.
    /// * `free(handle)` → release the scanner (called on `Drop`).
    pub trait ScannerBackend: Send + Sync {
        fn compile(&self, patterns: &[&str]) -> u64;
        fn find(&self, handle: u64, text: &str, start: usize) -> Option<ScanMatch>;
        fn free(&self, handle: u64);
    }

    static BACKEND: OnceLock<Box<dyn ScannerBackend>> = OnceLock::new();

    /// Install the regex backend. Call once before highlighting (idempotent — a
    /// second call is ignored). Single-threaded wasm makes the `OnceLock` free.
    pub fn register_scanner_backend(backend: Box<dyn ScannerBackend>) {
        let _ = BACKEND.set(backend);
    }

    fn backend() -> &'static dyn ScannerBackend {
        BACKEND
            .get()
            .expect(
                "xyd_highlight: no scanner backend registered — call \
                 register_scanner_backend() before highlighting (js-scanner build)",
            )
            .as_ref()
    }

    /// The `js-scanner` sibling of the native `OnigScanner`: same constructor +
    /// `find_next_match` surface, backed by the registered [`ScannerBackend`].
    pub struct OnigScanner {
        handle: u64,
        count: usize,
    }

    impl OnigScanner {
        pub fn new<S: AsRef<str>>(patterns: &[S]) -> Self {
            let refs: Vec<&str> = patterns.iter().map(|s| s.as_ref()).collect();
            let handle = backend().compile(&refs);
            OnigScanner {
                handle,
                count: refs.len(),
            }
        }

        pub fn len(&self) -> usize {
            self.count
        }

        pub fn is_empty(&self) -> bool {
            self.count == 0
        }

        pub fn find_next_match(&self, text: &str, start: usize) -> Option<ScanMatch> {
            backend().find(self.handle, text, start)
        }
    }

    impl Drop for OnigScanner {
        fn drop(&mut self) {
            backend().free(self.handle);
        }
    }
}

#[cfg(all(feature = "js-scanner", not(feature = "native-onig")))]
pub use delegated::{register_scanner_backend, OnigScanner, ScannerBackend};

// ---------------------------------------------------------------------------
// Tests — only under the native backend (they assert concrete Oniguruma spans).
// ---------------------------------------------------------------------------

#[cfg(all(test, feature = "native-onig"))]
mod tests {
    use super::*;

    #[test]
    fn smoke_links_oniguruma() {
        // Proves the onig_sys (Oniguruma C) toolchain links and searches.
        let s = OnigScanner::new(&[r"\w+"]);
        let m = s.find_next_match("  foo", 0).expect("should match");
        assert_eq!(m.pattern_index, 0);
        assert_eq!(m.whole(), (2, 5));
    }

    #[test]
    fn earliest_wins_ties_to_lowest_index() {
        // Two patterns both able to match "foo"; the earlier-listed one wins the
        // tie, and an earlier-starting match beats a later one.
        let s = OnigScanner::new(&[r"foo", r"\w+"]);
        let m = s.find_next_match("foo", 0).unwrap();
        assert_eq!(
            m.pattern_index, 0,
            "tie at same start → lowest pattern index"
        );

        let s2 = OnigScanner::new(&[r"bar", r"foo"]);
        let m2 = s2.find_next_match("xx foo bar", 0).unwrap();
        assert_eq!(m2.pattern_index, 1, "foo starts earlier than bar");
        assert_eq!(m2.whole(), (3, 6));
    }

    #[test]
    fn backslash_g_anchors_at_start() {
        // \G must anchor at the search start, not string start — the property
        // TextMate begin/while rules depend on.
        let s = OnigScanner::new(&[r"\Gfoo"]);
        assert!(
            s.find_next_match("xfoo", 0).is_none(),
            "\\G at 0 can't skip 'x'"
        );
        let m = s.find_next_match("xfoo", 1).expect("\\G anchored at 1");
        assert_eq!(m.whole(), (1, 4));
    }

    #[test]
    fn capture_groups_and_nonparticipating() {
        let s = OnigScanner::new(&[r"(a)(b)?(c)"]);
        let m = s.find_next_match("ac", 0).unwrap();
        assert_eq!(m.captures[0], Some((0, 2)), "whole match");
        assert_eq!(m.captures[1], Some((0, 1)), "group 1 = a");
        assert_eq!(m.captures[2], None, "group 2 (b?) did not participate");
        assert_eq!(m.captures[3], Some((1, 2)), "group 3 = c");
    }
}
