//! Shared JS-runtime semantics helpers for converter crates (S6+ W3).
//! These reproduce load-bearing JavaScript behaviors the JS oracles encode.
//! (xyd_openapi / xyd_openapi2opensdk carry local copies from earlier waves —
//! consolidation onto this module is a reap-time cleanup, not a blocker.)

use serde_json::{Map, Value};

/// `Object.keys()` ordering for a JSON-derived object: array-index keys
/// (canonical unsigned ints < 2^32-1) ascending FIRST, then remaining keys
/// in insertion order.
pub fn js_object_keys(map: &Map<String, Value>) -> Vec<&String> {
    let mut numeric: Vec<(&String, u32)> = Vec::new();
    let mut rest: Vec<&String> = Vec::new();
    for k in map.keys() {
        match as_array_index(k) {
            Some(n) => numeric.push((k, n)),
            None => rest.push(k),
        }
    }
    numeric.sort_by_key(|(_, n)| *n);
    numeric.into_iter().map(|(k, _)| k).chain(rest).collect()
}

fn as_array_index(key: &str) -> Option<u32> {
    if key.is_empty() || key.len() > 10 {
        return None;
    }
    if key != "0" && key.starts_with('0') {
        return None;
    }
    let n: u64 = key.parse().ok()?;
    if n < u32::MAX as u64 {
        Some(n as u32)
    } else {
        None
    }
}

/// JS truthiness for a JSON value gated with a bare `if (x)`.
pub fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64().map(|f| f != 0.0).unwrap_or(true),
        Some(_) => true, // objects and arrays (even empty) are truthy
    }
}

/// Node `path.join(a, b)` for the docs-relative paths the uniform plugins
/// build (no absolute paths, no `..` in practice): empty parts drop, segments
/// join with `/`, duplicate separators collapse, `.` segments drop.
pub fn node_path_join(parts: &[&str]) -> String {
    let mut segs: Vec<&str> = Vec::new();
    for part in parts {
        for seg in part.split('/') {
            if seg.is_empty() || seg == "." {
                continue;
            }
            segs.push(seg);
        }
    }
    if segs.is_empty() {
        // path.join("") === "." in Node; the plugin inputs never produce this
        // for real pages, but keep the semantic.
        return ".".to_string();
    }
    segs.join("/")
}

/// The character set JavaScript's `\s` regex class matches (no `u` flag).
pub fn is_js_whitespace(c: char) -> bool {
    matches!(
        c,
        '\t' | '\n' | '\u{000B}' | '\u{000C}' | '\r' | ' ' | '\u{00A0}' | '\u{1680}' | '\u{2000}'
            ..='\u{200A}'
                | '\u{2028}'
                | '\u{2029}'
                | '\u{202F}'
                | '\u{205F}'
                | '\u{3000}'
                | '\u{FEFF}'
    )
}
