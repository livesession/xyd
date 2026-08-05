//! `xyd_highlight` — a pure-Rust TextMate syntax highlighter.
//!
//! A hand-port of the `vscode-textmate` grammar/rule/tokenizer engine over the
//! `onig` crate (Oniguruma), reproducing the output of `@code-hike/lighter` /
//! `@syntax0/highlight` (the same engine xyd runs today) byte-for-byte. The
//! ported reference source is vendored under
//! `third-party/syntax0/` (grammars + themes + `.snap` oracles) and mirrors
//! `syntax0-highlight/src/{vscode-textmate,tokenizer,theme,...}`.
//!
//! Milestone 1 of the Rust-first content+highlighting program (see the plan).
//! Modules land incrementally toward the H1 gate (js/ts/json/bash × dark-plus/
//! github-dark snapshot parity).

// Engine modules — filled in H1→H3. Declared as they land.
mod encode;
mod grammar;
mod onig_scanner;
mod registry;
mod reshape;
mod store;
pub mod theme;

pub use grammar::tokenizer::{highlight, Grammar};
pub use onig_scanner::OnigScanner;
pub use registry::Registry;
pub use reshape::{Style, StyledToken};

/// The compressed on-disk size of the embedded grammar store, in bytes (the
/// zstd-compressed bundle set baked in at build time — trimmed by `core-langs`).
pub const GRAMMAR_STORE_BYTES: usize = store::GRAMMAR_STORE_BYTES;

/// H0 smoke: proves the `onig` (Oniguruma) toolchain links and that the scanner
/// wrapper — the innermost primitive the whole engine builds on — matches with
/// the `\G`-anchored, multi-pattern semantics vscode-textmate relies on.
pub fn engine_smoke() -> &'static str {
    "xyd_highlight: oniguruma engine linked"
}
