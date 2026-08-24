//! 3-way line merge + text/binary guard — Rust port of
//! `packages/xyd-opensdk-merge/src/index.ts`.
//!
//! The TS implementation renders jsdiff's `merge()` output back to file text with
//! git-style conflict markers. jsdiff's exact multi-hunk reconciliation is not
//! reproduced byte-for-byte here — instead this is a from-scratch, deterministic
//! LCS-based diff3 that takes the same fast paths (o==t, base==o, base==t), applies
//! a change only one side made, and emits a git-style `<<<<<<< / ======= / >>>>>>>`
//! block where both sides changed the same region differently.
//!
//! It is correct (never produces a WRONG merge) and stable (a no-op regen stays
//! byte-identical), which is all `writeProject`'s opt-in `{ merge: true }` path
//! needs. On adversarial multi-hunk inputs it may conflict where jsdiff would
//! merge cleanly; merge mode is NOT used by the xyd_cli regen (merge: false), so
//! this divergence is not on the byte-parity gate.

const CONFLICT_START: &str = "<<<<<<<";
const CONFLICT_SEP: &str = "=======";
const CONFLICT_END: &str = ">>>>>>>";

/// Marker labels for a conflict block: `<<<<<<< ours` … `>>>>>>> theirs`.
#[derive(Clone)]
pub struct Merge3Labels {
    /// Left side — the user's on-disk edits. Default `"ours"`.
    pub ours: String,
    /// Right side — the freshly generated output. Default `"generated"`.
    pub theirs: String,
}

impl Default for Merge3Labels {
    fn default() -> Self {
        Merge3Labels {
            ours: "ours".to_string(),
            theirs: "generated".to_string(),
        }
    }
}

#[derive(Clone, Default)]
pub struct Merge3Options {
    pub labels: Merge3Labels,
}

pub struct Merge3Result {
    /// The merged content. When `clean` is false it carries git-style conflict
    /// blocks (`<<<<<<<` / `=======` / `>>>>>>>`) around the disagreeing regions.
    pub text: String,
    /// True when the merge produced no conflicts.
    pub clean: bool,
    /// Number of conflict regions (0 when clean).
    pub conflicts: usize,
}

/// Normalize CRLF/CR line endings to LF (SDK output is LF) so line-ending
/// differences don't surface as spurious conflicts. Mirrors the TS
/// `content.replace(/\r\n?/g, '\n')`: collapse `\r\n` pairs first, then any lone `\r`.
pub fn normalize_newlines(content: &str) -> String {
    content.replace("\r\n", "\n").replace('\r', "\n")
}

/// Cheap "is this text?" guard: a NUL byte or a high ratio of C0 control chars
/// means a line-based 3-way merge is unsafe — the caller should fall back to a
/// whole-file policy (overwrite / keep) rather than call [`merge3`].
pub fn is_probably_binary(content: &str) -> bool {
    if content.is_empty() {
        return false;
    }
    let bytes = content.as_bytes();
    let sample = if bytes.len() > 8192 {
        &bytes[..8192]
    } else {
        bytes
    };
    if sample.contains(&0) {
        return true;
    }
    let mut control = 0usize;
    for &c in sample {
        // tab (9), LF (10), CR (13) are fine; count other C0 controls.
        if c < 9 || (c > 13 && c < 32) {
            control += 1;
        }
    }
    (control as f64) / (sample.len() as f64) > 0.02
}

/// True when the text still contains unresolved git conflict markers.
pub fn has_conflict_markers(content: &str) -> bool {
    content
        .split('\n')
        .any(|l| l.starts_with(CONFLICT_START) || l == CONFLICT_SEP || l.starts_with(CONFLICT_END))
}

/// A 3-way line merge: reconcile the user's on-disk edits (`ours`) with a freshly
/// generated file (`theirs`) against their common ancestor (`base`).
pub fn merge3(base: &str, ours: &str, theirs: &str, opts: &Merge3Options) -> Merge3Result {
    let b = normalize_newlines(base);
    let o = normalize_newlines(ours);
    let t = normalize_newlines(theirs);

    // Fast paths — exact + correct, and they skip the diff for the common cases.
    if o == t {
        return Merge3Result {
            text: o,
            clean: true,
            conflicts: 0,
        };
    }
    if b == o {
        return Merge3Result {
            text: t,
            clean: true,
            conflicts: 0,
        };
    }
    if b == t {
        return Merge3Result {
            text: o,
            clean: true,
            conflicts: 0,
        };
    }

    let want_trailing = t.ends_with('\n');
    // Give every input a trailing newline for a stable line-based diff (a missing
    // final newline would make an APPEND look like it edits the last line), then
    // strip it back per the generated side's policy.
    let bb = ensure_nl(&b);
    let oo = ensure_nl(&o);
    let tt = ensure_nl(&t);
    // `.split('\n')` mirrors JS: a trailing '\n' yields a trailing "" element, so
    // rejoining reconstructs the newline structure exactly.
    let base_lines: Vec<&str> = bb.split('\n').collect();
    let ours_lines: Vec<&str> = oo.split('\n').collect();
    let theirs_lines: Vec<&str> = tt.split('\n').collect();

    let mut out: Vec<String> = Vec::new();
    let mut conflicts = 0usize;
    for chunk in diff3(&base_lines, &ours_lines, &theirs_lines) {
        match chunk {
            Chunk::Stable(lines) => {
                for l in lines {
                    out.push(l.to_string());
                }
            }
            Chunk::Unstable {
                ours: oreg,
                base: _breg,
                theirs: treg,
            } => {
                conflicts += 1;
                out.push(format!("{CONFLICT_START} {}", opts.labels.ours));
                for l in &oreg {
                    out.push(l.to_string());
                }
                out.push(CONFLICT_SEP.to_string());
                for l in &treg {
                    out.push(l.to_string());
                }
                out.push(format!("{CONFLICT_END} {}", opts.labels.theirs));
            }
        }
    }

    let mut text = out.join("\n");
    if !want_trailing && text.ends_with('\n') {
        text.pop();
    }
    Merge3Result {
        text,
        clean: conflicts == 0,
        conflicts,
    }
}

fn ensure_nl(s: &str) -> String {
    if s.ends_with('\n') {
        s.to_string()
    } else {
        format!("{s}\n")
    }
}

enum Chunk<'a> {
    Stable(Vec<&'a str>),
    Unstable {
        ours: Vec<&'a str>,
        #[allow(dead_code)]
        base: Vec<&'a str>,
        theirs: Vec<&'a str>,
    },
}

/// Classic diff3: split base/ours/theirs into stable (all agree) and unstable
/// regions using LCS matches between base↔ours and base↔theirs, then decide each
/// unstable region (one-sided change → take it; both same → take it; else conflict).
fn diff3<'a>(base: &[&'a str], ours: &[&'a str], theirs: &[&'a str]) -> Vec<Chunk<'a>> {
    // o(base index) -> a(ours index) and o -> b(theirs index) from the LCS.
    let ma = lcs_map(base, ours);
    let mb = lcs_map(base, theirs);

    let mut chunks: Vec<Chunk> = Vec::new();
    let (mut oi, mut ai, mut bi) = (0usize, 0usize, 0usize);
    let mut stable: Vec<&str> = Vec::new();

    let flush_stable = |chunks: &mut Vec<Chunk<'a>>, stable: &mut Vec<&'a str>| {
        if !stable.is_empty() {
            chunks.push(Chunk::Stable(std::mem::take(stable)));
        }
    };

    while oi < base.len() {
        if ma.get(&oi) == Some(&ai) && mb.get(&oi) == Some(&bi) {
            // Stable line: base[oi] == ours[ai] == theirs[bi], aligned.
            stable.push(base[oi]);
            oi += 1;
            ai += 1;
            bi += 1;
            continue;
        }
        // Diverged — flush any pending stable run, then find the next resync anchor:
        // the smallest o2 in (oi..base.len) matched in BOTH sides at indices
        // >= the current ours/theirs cursors.
        flush_stable(&mut chunks, &mut stable);
        let (mut o2, mut a2, mut b2) = (base.len(), ours.len(), theirs.len());
        for cand in (oi + 1)..=base.len() {
            if cand == base.len() {
                break;
            }
            if let (Some(&ca), Some(&cb)) = (ma.get(&cand), mb.get(&cand)) {
                if ca >= ai && cb >= bi {
                    o2 = cand;
                    a2 = ca;
                    b2 = cb;
                    break;
                }
            }
        }
        let oreg: Vec<&str> = ours[ai..a2].to_vec();
        let breg: Vec<&str> = base[oi..o2].to_vec();
        let treg: Vec<&str> = theirs[bi..b2].to_vec();
        if oreg == treg {
            // both sides made the same change
            for l in oreg {
                stable.push(l);
            }
        } else if oreg == breg {
            // ours unchanged, theirs changed → take theirs
            for l in treg {
                stable.push(l);
            }
        } else if treg == breg {
            // theirs unchanged, ours changed → take ours
            for l in oreg {
                stable.push(l);
            }
        } else {
            flush_stable(&mut chunks, &mut stable);
            chunks.push(Chunk::Unstable {
                ours: oreg,
                base: breg,
                theirs: treg,
            });
        }
        oi = o2;
        ai = a2;
        bi = b2;
    }
    flush_stable(&mut chunks, &mut stable);
    chunks
}

/// LCS of `x` and `y`, returned as an `x index -> y index` alignment map (both
/// strictly increasing). Straightforward DP; inputs here are file line counts.
fn lcs_map(x: &[&str], y: &[&str]) -> std::collections::HashMap<usize, usize> {
    let n = x.len();
    let m = y.len();
    // dp[i][j] = LCS length of x[i..] and y[j..].
    let mut dp = vec![vec![0u32; m + 1]; n + 1];
    for i in (0..n).rev() {
        for j in (0..m).rev() {
            dp[i][j] = if x[i] == y[j] {
                dp[i + 1][j + 1] + 1
            } else {
                dp[i + 1][j].max(dp[i][j + 1])
            };
        }
    }
    let mut map = std::collections::HashMap::new();
    let (mut i, mut j) = (0usize, 0usize);
    while i < n && j < m {
        if x[i] == y[j] {
            map.insert(i, j);
            i += 1;
            j += 1;
        } else if dp[i + 1][j] >= dp[i][j + 1] {
            i += 1;
        } else {
            j += 1;
        }
    }
    map
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn is_probably_binary_text_and_binary() {
        assert!(!is_probably_binary(""));
        assert!(!is_probably_binary("hello\nworld\n"));
        assert!(is_probably_binary("a\u{0}b"));
        // A run of C0 controls trips the ratio.
        assert!(is_probably_binary(&"\u{1}".repeat(50)));
    }

    #[test]
    fn merge3_fast_paths() {
        // both identical
        let r = merge3("base\n", "same\n", "same\n", &Merge3Options::default());
        assert!(r.clean);
        assert_eq!(r.text, "same\n");
        // ours unchanged vs base → take theirs
        let r = merge3("base\n", "base\n", "gen\n", &Merge3Options::default());
        assert!(r.clean);
        assert_eq!(r.text, "gen\n");
        // theirs unchanged vs base → keep ours
        let r = merge3("base\n", "mine\n", "base\n", &Merge3Options::default());
        assert!(r.clean);
        assert_eq!(r.text, "mine\n");
    }

    #[test]
    fn merge3_clean_one_sided_change() {
        // base has 3 lines; ONLY theirs changes the middle line. ours == base.
        let base = "a\nb\nc\n";
        let ours = "a\nb\nc\n";
        let theirs = "a\nB\nc\n";
        let r = merge3(base, ours, theirs, &Merge3Options::default());
        assert!(r.clean, "expected clean merge, got: {}", r.text);
        assert_eq!(r.text, "a\nB\nc\n");
    }

    #[test]
    fn merge3_clean_ours_change_disjoint() {
        // ours edits the first line; theirs edits the last line — disjoint, clean.
        let base = "a\nb\nc\n";
        let ours = "A\nb\nc\n";
        let theirs = "a\nb\nC\n";
        let r = merge3(base, ours, theirs, &Merge3Options::default());
        assert!(r.clean, "expected clean merge, got:\n{}", r.text);
        assert_eq!(r.text, "A\nb\nC\n");
    }

    #[test]
    fn merge3_conflict_markers() {
        // both sides change the SAME middle line differently → conflict.
        let base = "a\nb\nc\n";
        let ours = "a\nOURS\nc\n";
        let theirs = "a\nTHEIRS\nc\n";
        let r = merge3(
            base,
            ours,
            theirs,
            &Merge3Options {
                labels: Merge3Labels {
                    ours: "your edits".into(),
                    theirs: "generated".into(),
                },
            },
        );
        assert!(!r.clean);
        assert_eq!(r.conflicts, 1);
        assert!(has_conflict_markers(&r.text));
        let expected = "a\n<<<<<<< your edits\nOURS\n=======\nTHEIRS\n>>>>>>> generated\nc\n";
        assert_eq!(r.text, expected);
    }

    #[test]
    fn merge3_normalizes_crlf() {
        // CRLF on ours must not surface as a conflict against LF theirs.
        let r = merge3("a\nb\n", "a\r\nb\r\n", "a\nB\n", &Merge3Options::default());
        assert!(
            r.clean,
            "crlf normalization should keep it clean: {}",
            r.text
        );
        assert_eq!(r.text, "a\nB\n");
    }
}
