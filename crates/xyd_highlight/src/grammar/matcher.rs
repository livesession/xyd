//! Scope-selector matchers for injections — a Rust port of vscode-textmate's
//! `createMatchers` (`_matchersFromSelector`) + the default name matcher
//! (`nameMatcher`) from `vscode-textmate/index.js`.
//!
//! An injection's selector (e.g. `"L:source.js -comment"`, or html's
//! `"R:text.html - (comment.block, ...)"`) is parsed into one matcher per
//! comma-separated top-level alternative, each with a priority (`L:` = -1,
//! `R:` = 1, default 0). A matcher is a predicate over the current scope-stack's
//! flattened scope-name list; the tokenizer consults it in
//! `match_rule_or_injections`.

/// A compiled scope-selector predicate.
#[derive(Debug, Clone)]
pub struct ScopeMatcher {
    node: Node,
}

impl ScopeMatcher {
    /// Does this selector match the given scope-name stack (outermost..innermost)?
    pub fn matches(&self, scopes: &[&str]) -> bool {
        eval(&self.node, scopes)
    }
}

#[derive(Debug, Clone)]
enum Node {
    /// `a()` — every child must match.
    And(Vec<Node>),
    /// `(...)` group — some child must match.
    Or(Vec<Node>),
    /// `-X` — negation.
    Not(Box<Node>),
    /// An identifier run — an ordered subsequence match into the scope stack
    /// (the default `nameMatcher`).
    Segments(Vec<String>),
}

fn eval(node: &Node, scopes: &[&str]) -> bool {
    match node {
        Node::And(list) => list.iter().all(|n| eval(n, scopes)),
        Node::Or(list) => list.iter().any(|n| eval(n, scopes)),
        Node::Not(inner) => !eval(inner, scopes),
        Node::Segments(names) => name_matcher(names, scopes),
    }
}

/// `nameMatcher(identifiers, scopes)`: `scopes` must contain every `identifier`
/// as an ordered subsequence, each matched by [`matches_scope`].
fn name_matcher(names: &[String], scopes: &[&str]) -> bool {
    if scopes.len() < names.len() {
        return false;
    }
    let mut n = 0usize;
    names.iter().all(|name| {
        let mut s = n;
        while s < scopes.len() {
            if matches_scope(scopes[s], name) {
                n = s + 1;
                return true;
            }
            s += 1;
        }
        false
    })
}

/// `matchesScope(scope, selector)`: exact match, or `scope` starts with
/// `selector.`.
fn matches_scope(scope: &str, selector: &str) -> bool {
    if scope == selector {
        return true;
    }
    let n = selector.len();
    scope.len() > n && scope.as_bytes()[n] == b'.' && &scope[..n] == selector
}

/// Parse a selector into `(matcher, priority)` pairs (one per top-level
/// comma-separated alternative). Mirrors `createMatchers` (`r(e, ce)`).
pub fn create_matchers(selector: &str) -> Vec<(ScopeMatcher, i8)> {
    let tokens = tokenize(selector);
    let mut p = Parser { tokens, pos: 0 };
    let mut cur = p.next();
    let mut out = Vec::new();
    loop {
        let mut priority = 0i8;
        if let Some(t) = &cur {
            if t.len() == 2 && t.as_bytes()[1] == b':' {
                match t.as_bytes()[0] {
                    b'R' => priority = 1,
                    b'L' => priority = -1,
                    _ => {} // "Unknown priority" — vscode logs + ignores the prefix.
                }
                cur = p.next();
            }
        }
        let node = parse_and(&mut p, &mut cur);
        out.push((ScopeMatcher { node }, priority));
        if cur.as_deref() != Some(",") {
            break;
        }
        cur = p.next();
    }
    out
}

struct Parser {
    tokens: Vec<String>,
    pos: usize,
}

impl Parser {
    fn next(&mut self) -> Option<String> {
        if self.pos < self.tokens.len() {
            let t = self.tokens[self.pos].clone();
            self.pos += 1;
            Some(t)
        } else {
            None
        }
    }
}

/// `a()` — a conjunction of atoms; empty conjunction matches everything.
fn parse_and(p: &mut Parser, cur: &mut Option<String>) -> Node {
    let mut list = Vec::new();
    while let Some(atom) = parse_atom(p, cur) {
        list.push(atom);
    }
    Node::And(list)
}

/// `o()` — a single atom: negation, group, or an identifier run.
fn parse_atom(p: &mut Parser, cur: &mut Option<String>) -> Option<Node> {
    match cur.as_deref() {
        Some("-") => {
            *cur = p.next();
            // `a()`/`o()` always yields a matcher; a bare trailing `-` negates an
            // empty (always-true) conjunction, matching vscode's `!!e && !e(t)`
            // where a missing inner matcher makes the negation always false.
            match parse_atom(p, cur) {
                Some(inner) => Some(Node::Not(Box::new(inner))),
                None => Some(Node::Not(Box::new(Node::Or(Vec::new())))), // never matches → Not = always
            }
        }
        Some("(") => {
            *cur = p.next();
            let group = parse_group(p, cur);
            if cur.as_deref() == Some(")") {
                *cur = p.next();
            }
            Some(Node::Or(group))
        }
        Some(tok) if is_identifier(tok) => {
            let mut names = Vec::new();
            while let Some(t) = cur.as_deref() {
                if is_identifier(t) {
                    names.push(t.to_string());
                    *cur = p.next();
                } else {
                    break;
                }
            }
            Some(Node::Segments(names))
        }
        _ => None,
    }
}

/// The `(...)` body — `a()`s separated by `|`/`,`, combined with `some`.
fn parse_group(p: &mut Parser, cur: &mut Option<String>) -> Vec<Node> {
    let mut group = Vec::new();
    loop {
        group.push(parse_and(p, cur)); // a() always returns a matcher
        if matches!(cur.as_deref(), Some("|") | Some(",")) {
            while matches!(cur.as_deref(), Some("|") | Some(",")) {
                *cur = p.next();
            }
        } else {
            break;
        }
    }
    group
}

/// `i(e)` — a token is an identifier if it contains any `[\w.:]` char.
fn is_identifier(token: &str) -> bool {
    token
        .bytes()
        .any(|c| c.is_ascii_alphanumeric() || c == b'_' || c == b'.' || c == b':')
}

/// Port of the selector tokenizer regex
/// `/([LR]:|[\w.:][\w.:\-]*|[,|\-()])/g` run globally: emit each match, skipping
/// unmatched chars (whitespace, `*`, …). Selectors are ASCII, so bytes == chars.
fn tokenize(s: &str) -> Vec<String> {
    let b = s.as_bytes();
    let mut i = 0usize;
    let mut out = Vec::new();
    while i < b.len() {
        // `[LR]:` (ordered-alternation first, like the regex).
        if (b[i] == b'L' || b[i] == b'R') && i + 1 < b.len() && b[i + 1] == b':' {
            out.push(s[i..i + 2].to_string());
            i += 2;
            continue;
        }
        // `[\w.:][\w.:\-]*`
        if is_ident_start(b[i]) {
            let start = i;
            i += 1;
            while i < b.len() && is_ident_cont(b[i]) {
                i += 1;
            }
            out.push(s[start..i].to_string());
            continue;
        }
        // `[,|\-()]`
        if matches!(b[i], b',' | b'|' | b'-' | b'(' | b')') {
            out.push((b[i] as char).to_string());
            i += 1;
            continue;
        }
        i += 1; // skip unmatched
    }
    out
}

fn is_ident_start(c: u8) -> bool {
    c.is_ascii_alphanumeric() || c == b'_' || c == b'.' || c == b':'
}

fn is_ident_cont(c: u8) -> bool {
    is_ident_start(c) || c == b'-'
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn priority_prefixes() {
        let m = create_matchers("R:source.js");
        assert_eq!(m.len(), 1);
        assert_eq!(m[0].1, 1);
        assert!(m[0].0.matches(&["source.js", "meta.foo"]));
        assert!(!m[0].0.matches(&["source.css"]));

        assert_eq!(create_matchers("L:foo")[0].1, -1);
        assert_eq!(create_matchers("foo")[0].1, 0);
    }

    #[test]
    fn subsequence_and_prefix() {
        // "a b" — ordered subsequence, prefix-matched.
        let m = &create_matchers("text.html source.js")[0].0;
        assert!(m.matches(&["text.html.basic", "meta.x", "source.js"]));
        assert!(!m.matches(&["source.js", "text.html.basic"])); // wrong order
    }

    #[test]
    fn negation_and_group() {
        let m = &create_matchers("text.html - (comment, string)")[0].0;
        assert!(m.matches(&["text.html.basic", "meta.tag"]));
        assert!(!m.matches(&["text.html.basic", "comment.block"]));
        assert!(!m.matches(&["text.html.basic", "string.quoted"]));
    }

    #[test]
    fn comma_splits_alternatives() {
        let ms = create_matchers("source.js, source.ts");
        assert_eq!(ms.len(), 2);
    }
}
