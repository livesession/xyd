//! Split flag spellings into short (`-x`), long (`--xy`) and old-style (`-xy`).
//!
//! Byte-for-byte port of `packages/xyd-opencli-completion/src/flags.ts`. Flag strings
//! here are always ASCII (`--<name>` / `-<alias>` built by `tree::option_to_completion`),
//! so char-count / byte-slice length are equivalent to the TS `.length`.

/// Short (`-x`), long (`--xy`) and old-style (`-xy`) spellings parsed from raw flags.
pub struct Flags {
    pub short: Vec<String>,
    pub long: Vec<String>,
    pub old: Vec<String>,
}

/// `--xy` → long `"xy"`; `-x` (exactly two chars) → short `"x"`; `-xy` (longer) → old `"xy"`.
pub fn split_flags(flags: &[String]) -> Flags {
    let mut short = Vec::new();
    let mut long = Vec::new();
    let mut old = Vec::new();
    for f in flags {
        if let Some(rest) = f.strip_prefix("--") {
            long.push(rest.to_string());
        } else if let Some(rest) = f.strip_prefix('-') {
            // `-x` (rest is one char) is short; anything longer (`-xy`) is old-style.
            if rest.chars().count() == 1 {
                short.push(rest.to_string());
            } else {
                old.push(rest.to_string());
            }
        }
    }
    Flags { short, long, old }
}
