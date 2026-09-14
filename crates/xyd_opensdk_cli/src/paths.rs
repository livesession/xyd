//! Node `node:path` semantics, because the ported code's observable strings are
//! built from them.
//!
//! `path.join` / `path.resolve` NORMALISE lexically (`./sdk` + `go` → `sdk/go`,
//! `a/../b` → `b`) while `std::path::Path::join` does not. Output directories
//! built this way are echoed in `Generated N files in <output>` and are compared
//! against the TypeScript's, so the normalisation has to match.

use std::path::{Path, PathBuf};

/// Lexically normalise a slash path the way Node's `path.normalize` does:
/// collapse `//`, drop `.`, resolve `..` against the accumulated stack (a
/// leading `..` survives in a RELATIVE path, never in an absolute one), and
/// preserve a trailing-slash-free form. An empty relative result is `.`.
fn normalize(input: &str, absolute: bool) -> String {
    let mut out: Vec<&str> = Vec::new();
    for seg in input.split('/') {
        match seg {
            "" | "." => {}
            ".." => match out.last() {
                Some(&last) if last != ".." => {
                    out.pop();
                }
                _ => {
                    // An absolute path cannot escape its root: `/..` === `/`.
                    if !absolute {
                        out.push("..");
                    }
                }
            },
            other => out.push(other),
        }
    }
    let joined = out.join("/");
    if absolute {
        format!("/{joined}")
    } else if joined.is_empty() {
        ".".to_string()
    } else {
        joined
    }
}

/// `path.isAbsolute`.
pub fn is_absolute(p: &str) -> bool {
    p.starts_with('/')
}

/// `path.join(a, b)`.
pub fn join(a: &str, b: &str) -> String {
    if a.is_empty() {
        return join_all(&[b]);
    }
    join_all(&[a, b])
}

/// `path.join(...parts)`.
pub fn join_all(parts: &[&str]) -> String {
    let joined = parts
        .iter()
        .filter(|p| !p.is_empty())
        .copied()
        .collect::<Vec<_>>()
        .join("/");
    if joined.is_empty() {
        return ".".to_string();
    }
    normalize(&joined, joined.starts_with('/'))
}

/// `path.resolve(cwd, p)` — `p` wins when absolute, else it is joined onto
/// `cwd`; the result is always absolute and normalised.
pub fn resolve(cwd: &Path, p: &str) -> PathBuf {
    if is_absolute(p) {
        return PathBuf::from(normalize(p, true));
    }
    let base = cwd.to_string_lossy().to_string();
    let joined = if base.is_empty() {
        p.to_string()
    } else {
        format!("{base}/{p}")
    };
    PathBuf::from(normalize(&joined, joined.starts_with('/')))
}

/// [`resolve`] returning the `String` form the TypeScript compares/prints.
pub fn resolve_str(cwd: &Path, p: &str) -> String {
    resolve(cwd, p).to_string_lossy().to_string()
}

/// `path.dirname`.
pub fn dirname(p: &str) -> String {
    match p.rfind('/') {
        None => ".".to_string(),
        Some(0) => "/".to_string(),
        Some(i) => p[..i].to_string(),
    }
}

/// `path.basename`.
pub fn basename(p: &str) -> String {
    let trimmed = p.trim_end_matches('/');
    match trimmed.rfind('/') {
        None => trimmed.to_string(),
        Some(i) => trimmed[i + 1..].to_string(),
    }
}

/// `path.extname` — the last `.` of the basename, empty when it leads the name.
pub fn extname(p: &str) -> String {
    let base = basename(p);
    match base.rfind('.') {
        None | Some(0) => String::new(),
        Some(i) => base[i..].to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn join_matches_node() {
        assert_eq!(join("./sdk", "go"), "sdk/go");
        assert_eq!(join("sdk", "go"), "sdk/go");
        assert_eq!(join("/tmp/x", "go"), "/tmp/x/go");
        assert_eq!(join("a/b", "../c"), "a/c");
        assert_eq!(join(".", "."), ".");
        assert_eq!(join("..", "x"), "../x");
    }

    #[test]
    fn resolve_matches_node() {
        let cwd = Path::new("/tmp/work");
        assert_eq!(resolve_str(cwd, "./out/x.json"), "/tmp/work/out/x.json");
        assert_eq!(resolve_str(cwd, "a/../b"), "/tmp/work/b");
        assert_eq!(resolve_str(cwd, "/abs/path"), "/abs/path");
        // An absolute path cannot climb above its root.
        assert_eq!(resolve_str(cwd, "/../../x"), "/x");
    }

    #[test]
    fn dirname_basename_extname_match_node() {
        assert_eq!(dirname("/a/b/c.json"), "/a/b");
        assert_eq!(dirname("c.json"), ".");
        assert_eq!(dirname("/c.json"), "/");
        assert_eq!(basename("/a/b/c.json"), "c.json");
        assert_eq!(extname("/a/b/c.json"), ".json");
        assert_eq!(extname("/a/b/c"), "");
        // A dotfile has no extension in Node.
        assert_eq!(extname("/a/.npmrc"), "");
        assert_eq!(extname("opensdk.config.mjs"), ".mjs");
    }
}
