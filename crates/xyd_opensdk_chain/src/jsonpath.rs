//! Overlay `target` evaluation — and the pre-flight that keeps it honest.
//!
//! # Why this module exists
//!
//! The TS `applyOverlay` drives **jsonpath-plus**, which is *not* RFC 9535. It adds
//! `^` (parent), `@parent` / `@path` / `@property` / `@root`, `~` (property-name
//! selector), type selectors (`@number()`), and script/filter expressions evaluated as
//! **JavaScript**. This port evaluates with `serde_json_path` (RFC 9535). The two
//! engines agree on plain paths and wildcards and disagree in ways that are *silent*:
//! `tests/jsonpath_sweep.rs` replays a corpus through both and records, for example,
//!
//! | target | jsonpath-plus | RFC 9535 |
//! |---|---|---|
//! | `$.tags[?@.x]` (no parens) | **no match** | matches |
//! | `$.tags[-1]` | **no match** | last element |
//! | `$.list.length` | the array's JS `.length` | no match |
//! | `$..*` | breadth-first order | depth-first order |
//! | `$.tags[?(@.n === 'x')]` | matches (JS `===`) | parse error |
//!
//! A silent no-match on a `remove` action is the worst failure mode available here —
//! the overlay looks applied and simply does nothing. So [`preflight`] refuses every
//! target outside a proven-equivalent subset, and [`query_located`] errors rather than
//! guessing.
//!
//! # The supported subset
//!
//! * root `$`
//! * child by name: `.name`, `['name']`, `["name"]`
//! * wildcard: `.*`, `[*]`
//! * descendant: `..name`, `..['name']`, `..[*]`  (but **not** `..*`, whose ordering
//!   differs between the engines)
//! * non-negative index `[n]` and non-negative slice `[a:b:c]`
//! * filters in jsonpath-plus's required `?( … )` form, containing only: relative
//!   existence tests (`@.a`, `@['a']`), `!`, `&&`, `||`, parentheses, and comparisons
//!   of a relative path against a string / number / `true` / `false` / `null` literal.
//!
//! Anything else — including a bare `?@…`, `===`, a function call, `^`, `~`, `@parent`,
//! a negative index, or a `length` name selector — is rejected by name.
//!
//! # Residual, data-dependent divergences (documented, not caught here)
//!
//! Two behaviours of the accepted filter subset depend on the *document*, so no
//! syntactic check can see them:
//!
//! 1. **Truthiness vs existence.** `?(@.a)` is a JS truthiness test in jsonpath-plus
//!    but an existence test in RFC 9535, so a member whose value is `0`, `false`, `""`
//!    or `null` matches here and not there.
//! 2. **Loose vs strict comparison.** JS `==`/`>` coerce across types (`"2" == 2`),
//!    RFC 9535 comparisons between different types are simply false.
//!
//! Both are called out in the sweep corpus (`__oracle__/jsonpath/sweep.json`) and in
//! `tests/jsonpath_sweep.rs`, which asserts they still behave as recorded.

use serde_json::Value;
use serde_json_path::JsonPath;

/// A matched location: the normalized path from the document root.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Located {
    /// Object keys and array indices from the root, in order. Empty == the root.
    pub path: Vec<Segment>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Segment {
    Name(String),
    Index(usize),
}

/// Reject any target outside the proven-equivalent subset.
///
/// Returns the reason on rejection, in the form used by the overlay error message.
pub fn preflight(target: &str) -> Result<(), String> {
    let bytes: Vec<char> = target.chars().collect();
    if bytes.is_empty() {
        return Err("empty target".into());
    }
    if bytes[0] != '$' {
        return Err("target must start with `$`".into());
    }

    // Named jsonpath-plus extensions, checked before the structural walk so the error
    // names the construct instead of a character offset.
    for (needle, what) in [
        ("@parent", "`@parent`"),
        ("@path", "`@path`"),
        ("@property", "`@property`"),
        ("@parentProperty", "`@parentProperty`"),
        ("@root", "`@root`"),
        ("@number()", "a type selector"),
        ("@string()", "a type selector"),
        ("@boolean()", "a type selector"),
        ("@null()", "a type selector"),
        ("@object()", "a type selector"),
        ("@array()", "a type selector"),
        ("@integer()", "a type selector"),
        ("@scalar()", "a type selector"),
        ("@other()", "a type selector"),
        ("===", "JS strict equality"),
        ("!==", "JS strict inequality"),
        (
            "$..*",
            "`$..*` (the engines disagree on descendant ordering)",
        ),
        ("..*", "`..*` (the engines disagree on descendant ordering)"),
    ] {
        if target.contains(needle) {
            return Err(format!("{what} is a jsonpath-plus extension"));
        }
    }
    if target.contains('^') {
        return Err("`^` (the parent operator) is a jsonpath-plus extension".into());
    }
    if target.contains('~') {
        return Err("`~` (the property-name selector) is a jsonpath-plus extension".into());
    }

    let mut i = 1usize;
    while i < bytes.len() {
        match bytes[i] {
            '.' => {
                i += 1;
                if i < bytes.len() && bytes[i] == '.' {
                    i += 1; // descendant `..`
                }
                if i < bytes.len() && bytes[i] == '[' {
                    continue; // `..[` handled by the bracket arm
                }
                if i < bytes.len() && bytes[i] == '*' {
                    i += 1;
                    continue;
                }
                let start = i;
                while i < bytes.len()
                    && (bytes[i].is_alphanumeric() || bytes[i] == '_' || bytes[i] == '-')
                {
                    i += 1;
                }
                if i == start {
                    return Err(format!("unparseable name selector at offset {start}"));
                }
                let name: String = bytes[start..i].iter().collect();
                if name == "length" {
                    return Err(
                        "the name selector `length` is ambiguous (jsonpath-plus resolves a JS array's `.length`)"
                            .into(),
                    );
                }
            }
            '[' => {
                let close = matching_bracket(&bytes, i)
                    .ok_or_else(|| format!("unbalanced `[` at offset {i}"))?;
                let inner: String = bytes[i + 1..close].iter().collect();
                check_bracket(inner.trim())?;
                i = close + 1;
            }
            c => return Err(format!("unexpected `{c}` at offset {i}")),
        }
    }
    Ok(())
}

/// Index of the `]` closing the `[` at `open`, honouring quoted strings.
fn matching_bracket(chars: &[char], open: usize) -> Option<usize> {
    let mut depth = 0usize;
    let mut quote: Option<char> = None;
    let mut i = open;
    while i < chars.len() {
        let c = chars[i];
        match quote {
            Some(q) => {
                if c == '\\' {
                    i += 1;
                } else if c == q {
                    quote = None;
                }
            }
            None => match c {
                '\'' | '"' => quote = Some(c),
                '[' => depth += 1,
                ']' => {
                    depth -= 1;
                    if depth == 0 {
                        return Some(i);
                    }
                }
                _ => {}
            },
        }
        i += 1;
    }
    None
}

fn check_bracket(inner: &str) -> Result<(), String> {
    if inner == "*" {
        return Ok(());
    }
    if let Some(rest) = inner.strip_prefix('?') {
        return check_filter(rest);
    }
    if (inner.starts_with('\'') && inner.ends_with('\'') && inner.len() >= 2)
        || (inner.starts_with('"') && inner.ends_with('"') && inner.len() >= 2)
    {
        let quote = inner.chars().next().expect("checked non-empty");
        let body = &inner[1..inner.len() - 1];
        if quote == '"' && body.contains('\'') {
            // jsonpath-plus fails to match `$["a'b"]` (see the sweep); RFC 9535 matches.
            return Err(
                "a double-quoted name containing `'` is handled differently by jsonpath-plus"
                    .into(),
            );
        }
        if body == "length" {
            return Err(
                "the name selector `length` is ambiguous (jsonpath-plus resolves a JS array's `.length`)"
                    .into(),
            );
        }
        return Ok(());
    }
    if inner.contains(':') {
        // slice
        for part in inner.split(':') {
            let part = part.trim();
            if part.is_empty() {
                continue;
            }
            if part.starts_with('-') {
                return Err("negative slice bounds are unsupported by jsonpath-plus".into());
            }
            if part.parse::<usize>().is_err() {
                return Err(format!("unparseable slice bound `{part}`"));
            }
        }
        return Ok(());
    }
    if inner.starts_with('-') {
        return Err("negative indices are unsupported by jsonpath-plus".into());
    }
    if inner.parse::<usize>().is_ok() {
        return Ok(());
    }
    Err(format!("unsupported bracket selector `[{inner}]`"))
}

/// Filters must use jsonpath-plus's parenthesised `?( … )` form — a bare `?@.a` is
/// valid RFC 9535 but matches **nothing** in jsonpath-plus (proven by the sweep).
fn check_filter(rest: &str) -> Result<(), String> {
    let rest = rest.trim();
    if !(rest.starts_with('(') && rest.ends_with(')')) {
        return Err(
            "a filter must be written `?( … )`; jsonpath-plus does not support the bare `?@…` form"
                .into(),
        );
    }
    let body = &rest[1..rest.len() - 1];
    if body.contains('(') || body.contains(')') {
        // Nested parens are legal RFC 9535 but are also how jsonpath-plus spells script
        // expressions and JS calls; refuse rather than guess.
        return Err("nested parentheses / calls in a filter are unsupported".into());
    }
    if !body.contains('@') {
        return Err("a filter must test a relative path (`@…`)".into());
    }
    for c in body.chars() {
        let ok = c.is_alphanumeric()
            || matches!(
                c,
                '@' | '.'
                    | '['
                    | ']'
                    | '\''
                    | '"'
                    | '_'
                    | '-'
                    | ' '
                    | '!'
                    | '&'
                    | '|'
                    | '='
                    | '<'
                    | '>'
                    | '+'
                    | '/'
                    | '{'
                    | '}'
                    | '#'
                    | ':'
                    | ','
                    | '$'
                    | '%'
                    | '~'
            );
        if !ok {
            return Err(format!("unsupported character `{c}` in a filter"));
        }
    }
    Ok(())
}

/// Rewrite bare existence tests into RFC 9535 that means **JS truthiness**.
///
/// `?(@.v)` is the single most common overlay idiom, and it is where the two engines
/// disagree most loudly: jsonpath-plus evaluates `@.v` as a JS truthiness test, RFC 9535
/// as an existence test. The sweep's `falsy` document pins it — for six items whose `v`
/// is `0 / false / "" / null / 1 / absent`, jsonpath-plus matches **one** and RFC 9535
/// matches **five**. On a `remove` action that is four endpoints deleted by mistake.
///
/// JS truthiness is expressible in RFC 9535, so instead of documenting the divergence we
/// close it: each bare test-expr `T` becomes
/// `(T && T != 0 && T != false && T != '' && T != null)`. The leading `T` keeps absent
/// members out (RFC compares `Nothing != 0` as *true*, so the existence test is load
/// bearing), and the four inequalities strip exactly JS's falsy JSON values (`-0`
/// compares equal to `0`; `NaN` has no JSON literal).
///
/// Comparison terms (`@.count > 1`) are left alone — see `EXPECTED_DIVERGENT` in
/// `tests/jsonpath_sweep.rs` for the JS coercion divergence that remains there.
fn truthy_rewrite(target: &str) -> String {
    let mut out = String::with_capacity(target.len());
    let mut rest = target;
    while let Some(at) = rest.find("[?") {
        out.push_str(&rest[..at]);
        let tail = &rest[at..];
        // `preflight` has already guaranteed the `[?( … )]` shape with no nested parens.
        let Some(open) = tail.find('(') else {
            out.push_str(tail);
            return out;
        };
        let Some(close) = tail[open..].find(')').map(|i| i + open) else {
            out.push_str(tail);
            return out;
        };
        out.push_str(&tail[..=open]);
        out.push_str(&rewrite_filter_body(&tail[open + 1..close]));
        out.push(')');
        rest = &tail[close + 1..];
    }
    out.push_str(rest);
    out
}

fn rewrite_filter_body(body: &str) -> String {
    let mut out = String::new();
    let mut term = String::new();
    let mut chars = body.chars().peekable();
    while let Some(c) = chars.next() {
        let joiner = match (c, chars.peek()) {
            ('&', Some('&')) => Some("&&"),
            ('|', Some('|')) => Some("||"),
            _ => None,
        };
        match joiner {
            Some(j) => {
                chars.next();
                out.push_str(&rewrite_term(&term));
                out.push_str(j);
                term.clear();
            }
            None => term.push(c),
        }
    }
    out.push_str(&rewrite_term(&term));
    out
}

const COMPARISON_OPS: [&str; 6] = ["==", "!=", "<=", ">=", "<", ">"];

fn rewrite_term(term: &str) -> String {
    let lead = term.len() - term.trim_start().len();
    let (prefix, body) = term.split_at(lead);
    let trail_at = body.trim_end().len();
    let (body, suffix) = body.split_at(trail_at);

    let bangs = body.chars().take_while(|c| *c == '!').count();
    let expr = &body[bangs..];
    // A comparison already has RFC semantics close enough to JS for the accepted subset;
    // only a *bare* path test is truthiness.
    if expr.is_empty()
        || !expr.starts_with('@')
        || COMPARISON_OPS.iter().any(|op| expr.contains(op))
    {
        return term.to_string();
    }
    format!(
        "{prefix}{}({expr} && {expr} != 0 && {expr} != false && {expr} != '' && {expr} != null){suffix}",
        "!".repeat(bangs)
    )
}

/// Evaluate `target` against `doc`, returning the matched locations in query order.
///
/// Errors (never silently returns an empty match set) when the target is outside the
/// supported subset or `serde_json_path` cannot parse it.
pub fn query_located(target: &str, doc: &Value) -> Result<Vec<Located>, String> {
    preflight(target)?;
    let rewritten = truthy_rewrite(target);
    let path = JsonPath::parse(&rewritten).map_err(|e| format!("invalid JSONPath: {e}"))?;
    Ok(path
        .query_located(doc)
        .into_iter()
        .map(|entry| Located {
            path: entry
                .location()
                .iter()
                .map(|el| match el.as_name() {
                    Some(name) => Segment::Name(name.to_string()),
                    None => {
                        Segment::Index(el.as_index().expect("a path element is a name or an index"))
                    }
                })
                .collect(),
        })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_the_supported_subset() {
        for t in [
            "$",
            "$.info",
            "$.info.title",
            "$['info']['title']",
            "$.paths['/pets'].get",
            "$.paths['/pets/{id}']",
            "$.paths[*][*]",
            "$.paths.*.*",
            "$..get",
            "$..['x-internal']",
            "$.tags[0]",
            "$.tags[0:2]",
            "$.tags[::2]",
            "$.tags[?(@[\"x-internal\"])]",
            "$.tags[?(@.name == 'drop')]",
            "$.tags[?(!@['x-internal'])]",
            "$.tags[?(@.count >= 2 && @.name == 'drop')]",
            "$.paths['/pets'].get.responses['200']",
        ] {
            preflight(t)
                .unwrap_or_else(|e| panic!("preflight rejected supported target {t:?}: {e}"));
        }
    }

    #[test]
    fn rewrites_only_bare_existence_tests() {
        const TRUTHY: &str = "(@.v && @.v != 0 && @.v != false && @.v != '' && @.v != null)";
        assert_eq!(
            truthy_rewrite("$.items[?(@.v)]"),
            format!("$.items[?({TRUTHY})]")
        );
        assert_eq!(
            truthy_rewrite("$.items[?(!@.v)]"),
            format!("$.items[?(!{TRUTHY})]")
        );
        assert_eq!(
            truthy_rewrite("$.items[?(@.v && @.w)]"),
            format!(
                "$.items[?({TRUTHY} && (@.w && @.w != 0 && @.w != false && @.w != '' && @.w != null))]"
            )
        );
        // Comparisons keep RFC semantics and are NOT rewritten.
        for unchanged in [
            "$.tags[?(@.count > 1)]",
            "$.tags[?(@.name == 'drop')]",
            "$.tags[?(@.count >= 2 && @.name == 'drop')]",
            "$.info",
            "$.paths[*][*]",
        ] {
            assert_eq!(
                truthy_rewrite(unchanged),
                unchanged,
                "{unchanged} must be untouched"
            );
        }
    }

    #[test]
    fn truthiness_matches_javascript() {
        let doc: Value = serde_json::from_str(
            r#"{"items":[{"v":0},{"v":false},{"v":""},{"v":null},{"v":1},{},{"v":{}},{"v":[]}]}"#,
        )
        .unwrap();
        // JS: only 1, {} and [] are truthy (an empty object/array is truthy in JS).
        let hit = |t: &str| -> Vec<usize> {
            query_located(t, &doc)
                .expect("supported target")
                .into_iter()
                .map(|l| match l.path.last() {
                    Some(Segment::Index(i)) => *i,
                    other => panic!("unexpected path tail {other:?}"),
                })
                .collect()
        };
        assert_eq!(hit("$.items[?(@.v)]"), vec![4, 6, 7]);
        assert_eq!(hit("$.items[?(!@.v)]"), vec![0, 1, 2, 3, 5]);
    }

    #[test]
    fn rejects_jsonpath_plus_extensions() {
        for t in [
            "$.paths['/pets'].get^",
            "$.tags[?(@parent.openapi)]",
            "$.paths[?(@property === 'get')]",
            "$..[?(@path.indexOf('pets') > -1)]",
            "$.tags[(@.length-1)]",
            "$.tags[?(@.name.match(/dr/))]",
            "$.tags[?(@.name === 'drop')]",
            "$.tags[?(@number())]",
            "$.info~",
            "$.tags[-1]",
            "$.tags[?@['x-internal']]",
            "$.list.length",
            "$..*",
            "$[\"quote'key\"]",
        ] {
            assert!(
                preflight(t).is_err(),
                "preflight accepted unsupported target {t:?}"
            );
        }
    }
}
