//! Compiled TextMate rules + the grammar compiler — a Rust port of
//! `vscode-textmate`'s `rule.ts` (`Rule`/`RuleFactory`/`RegExpSource`/
//! `RegExpSourceList`) and the `RuleFactory.getCompiledRuleId` /
//! `_compilePatterns` / `_compileCaptures` machinery.
//!
//! [`compile_grammar`] turns a [`RawGrammar`] into a flat rule registry
//! (`Vec<Rule>` indexed by [`RuleId`]) plus the root rule id. Recursion and
//! shared repository rules terminate exactly like vscode: each raw rule is
//! memoized by pointer identity (`e.id` in the reference), so a rule that
//! includes itself gets its id assigned *before* its patterns are compiled.
//!
//! The scanner is built on demand by [`super::tokenizer`] from the
//! [`RegExpSource`]s a rule contributes (`collectPatterns`), with `\A`/`\G`
//! anchors resolved per (allowA, allowG) — the `RegExpSourceList.compileAG`
//! cache in the reference.

use std::collections::HashMap;

use super::raw::{RawCaptures, RawGrammar, RawRule};

/// A compiled rule's numeric id. Positive ids index the registry; the two
/// negative sentinels mark the synthesized end/while patterns of a begin rule
/// (vscode's `RuleId.End` / `RuleId.While`).
pub type RuleId = i32;

/// The `end` pattern of a begin/end rule reports this id when it matches.
pub const END_RULE: RuleId = -1;
/// The `while` pattern of a begin/while rule reports this id.
pub const WHILE_RULE: RuleId = -2;

/// A regex source that will never match — vscode's `￿` placeholder, used
/// for a missing `end` and for anchor variants that disable `\A`/`\G`.
const NEVER: &str = "\u{FFFF}";

/// Public alias of [`NEVER`] for the tokenizer's fallback when a back-reference
/// `end`/`while` source is unexpectedly absent.
pub const NEVER_MATCH: &str = NEVER;

// ---------------------------------------------------------------------------
// RegExpSource — one pattern's source with anchor + back-reference handling.
// ---------------------------------------------------------------------------

/// Anchor-resolved variants of a source, cached like `RegExpSource._anchorCache`.
/// The two bits select whether `\A` (first-line) / `\G` (anchor-position) are
/// live in this compile.
#[derive(Debug, Clone)]
struct AnchorCache {
    a0_g0: String,
    a0_g1: String,
    a1_g0: String,
    a1_g1: String,
}

/// A single pattern source (`RegExpSource`, class `W`). Carries the rule id it
/// resolves to when matched, whether it contains `\A`/`\G` anchors (so the
/// scanner cache key needs the anchor bits) and whether it has `\N`
/// back-references (so it must be re-sourced with resolved captures).
#[derive(Debug, Clone)]
pub struct RegExpSource {
    pub source: String,
    pub rule_id: RuleId,
    pub has_anchor: bool,
    pub has_back_references: bool,
    anchor_cache: Option<AnchorCache>,
}

impl RegExpSource {
    /// Port of the `W` constructor: rewrite `\z` → `$(?!\n)(?<!\n)`, detect
    /// `\A`/`\G` anchors (kept in the source, resolved later), build the anchor
    /// cache, and flag `\N` back-references.
    pub fn new(regex: &str, rule_id: RuleId) -> RegExpSource {
        let chars: Vec<char> = regex.chars().collect();
        let len = chars.len();
        let mut has_anchor = false;
        let mut out = String::new();
        let mut last = 0usize; // start of the not-yet-copied segment
        let mut i = 0usize;
        while i < len {
            if chars[i] == '\\' && i + 1 < len {
                let c = chars[i + 1];
                if c == 'z' {
                    out.extend(&chars[last..i]);
                    out.push_str("$(?!\\n)(?<!\\n)");
                    last = i + 2;
                } else if c == 'A' || c == 'G' {
                    has_anchor = true;
                }
                i += 1; // skip the escaped char
            }
            i += 1;
        }
        let source = if last == 0 {
            regex.to_string()
        } else {
            out.extend(&chars[last..len]);
            out
        };

        let anchor_cache = if has_anchor {
            Some(build_anchor_cache(&source))
        } else {
            None
        };
        let has_back_references = has_backslash_digit(&source);

        RegExpSource {
            source,
            rule_id,
            has_anchor,
            has_back_references,
            anchor_cache,
        }
    }

    /// `resolveAnchors(allowA, allowG)` — pick the cached anchor variant (or the
    /// raw source when the pattern has no anchors).
    pub fn resolve_anchors(&self, allow_a: bool, allow_g: bool) -> String {
        if !self.has_anchor {
            return self.source.clone();
        }
        let c = self
            .anchor_cache
            .as_ref()
            .expect("anchor cache is present whenever has_anchor");
        match (allow_a, allow_g) {
            (false, false) => c.a0_g0.clone(),
            (false, true) => c.a0_g1.clone(),
            (true, false) => c.a1_g0.clone(),
            (true, true) => c.a1_g1.clone(),
        }
    }

    /// `resolveBackReferences(lineText, captureIndices)` — substitute `\N` with
    /// the (regex-escaped) captured text.
    pub fn resolve_back_references(
        &self,
        line: &str,
        captures: &[Option<(usize, usize)>],
    ) -> String {
        let group_text = |n: usize| -> String {
            match captures.get(n).copied().flatten() {
                Some((s, e)) => escape_regex(&line[s..e]),
                None => String::new(),
            }
        };
        replace_backslash_digits(&self.source, group_text)
    }
}

/// `_buildAnchorCache`: replace each `\A`/`\G` with the char selecting whether
/// the anchor is live (`A`/`G`) or disabled (`￿`) in each of the four
/// (allowA, allowG) combinations.
fn build_anchor_cache(source: &str) -> AnchorCache {
    let chars: Vec<char> = source.chars().collect();
    let len = chars.len();
    let (mut a0_g0, mut a0_g1, mut a1_g0, mut a1_g1) =
        (String::new(), String::new(), String::new(), String::new());
    let mut i = 0usize;
    while i < len {
        let ch = chars[i];
        a0_g0.push(ch);
        a0_g1.push(ch);
        a1_g0.push(ch);
        a1_g1.push(ch);
        if ch == '\\' && i + 1 < len {
            let s = chars[i + 1];
            let (r, ii, o, a) = match s {
                'A' => ('\u{FFFF}', '\u{FFFF}', 'A', 'A'),
                'G' => ('\u{FFFF}', 'G', '\u{FFFF}', 'G'),
                other => (other, other, other, other),
            };
            a0_g0.push(r);
            a0_g1.push(ii);
            a1_g0.push(o);
            a1_g1.push(a);
            i += 1;
        }
        i += 1;
    }
    AnchorCache {
        a0_g0,
        a0_g1,
        a1_g0,
        a1_g1,
    }
}

/// `E.test(source)` — does the source contain a `\` followed by a digit?
fn has_backslash_digit(source: &str) -> bool {
    let bytes = source.as_bytes();
    for i in 0..bytes.len() {
        if bytes[i] == b'\\' && i + 1 < bytes.len() && bytes[i + 1].is_ascii_digit() {
            return true;
        }
    }
    false
}

/// Replace every `\N` (N = one or more digits) with `f(N)`. Mirrors
/// `source.replace(/\\(\d+)/g, ...)`.
fn replace_backslash_digits<F: Fn(usize) -> String>(source: &str, f: F) -> String {
    let bytes = source.as_bytes();
    let mut out = String::with_capacity(source.len());
    let mut i = 0usize;
    while i < bytes.len() {
        if bytes[i] == b'\\' && i + 1 < bytes.len() && bytes[i + 1].is_ascii_digit() {
            let mut j = i + 1;
            while j < bytes.len() && bytes[j].is_ascii_digit() {
                j += 1;
            }
            let n: usize = source[i + 1..j].parse().unwrap_or(0);
            out.push_str(&f(n));
            i = j;
        } else {
            // Copy one UTF-8 char.
            let ch = source[i..].chars().next().unwrap();
            out.push(ch);
            i += ch.len_utf8();
        }
    }
    out
}

/// `m(e)` — regex-escape the TextMate special characters.
fn escape_regex(s: &str) -> String {
    const SPECIAL: &[char] = &[
        '-', '\\', '{', '}', '*', '+', '?', '|', '^', '$', '.', ',', '[', ']', '(', ')', '#',
    ];
    let mut out = String::with_capacity(s.len());
    for ch in s.chars() {
        if SPECIAL.contains(&ch) || ch.is_whitespace() {
            out.push('\\');
        }
        out.push(ch);
    }
    out
}

/// `hasCaptures` for a name/contentName — does it reference `$N` or
/// `${N:/downcase|upcase}`?
fn has_name_captures(name: &Option<String>) -> bool {
    let Some(s) = name else { return false };
    let bytes = s.as_bytes();
    let mut i = 0usize;
    while i < bytes.len() {
        if bytes[i] == b'$' {
            // $N
            if i + 1 < bytes.len() && bytes[i + 1].is_ascii_digit() {
                return true;
            }
            // ${N:/downcase|upcase}
            if i + 1 < bytes.len() && bytes[i + 1] == b'{' {
                return true;
            }
        }
        i += 1;
    }
    false
}

/// `replaceCaptures(name, lineText, captureIndices)` — substitute `$N` and
/// `${N:/downcase|upcase}`, stripping leading dots from the captured text.
fn replace_name_captures(name: &str, line: &str, captures: &[Option<(usize, usize)>]) -> String {
    let bytes = name.as_bytes();
    let mut out = String::with_capacity(name.len());
    let mut i = 0usize;
    while i < bytes.len() {
        if bytes[i] == b'$' && i + 1 < bytes.len() && bytes[i + 1].is_ascii_digit() {
            // $N
            let mut j = i + 1;
            while j < bytes.len() && bytes[j].is_ascii_digit() {
                j += 1;
            }
            let n: usize = name[i + 1..j].parse().unwrap_or(usize::MAX);
            out.push_str(&resolve_capture_text(line, captures, n, None));
            i = j;
        } else if bytes[i] == b'$'
            && i + 1 < bytes.len()
            && bytes[i + 1] == b'{'
            && name[i..].starts_with("${")
        {
            // ${N:/command}
            if let Some(rest) = name[i + 2..].find('}') {
                let inner = &name[i + 2..i + 2 + rest];
                // inner = "N:/command"
                if let Some((num, cmd)) = parse_capture_command(inner) {
                    out.push_str(&resolve_capture_text(line, captures, num, Some(cmd)));
                    i = i + 2 + rest + 1;
                    continue;
                }
            }
            out.push('$');
            i += 1;
        } else {
            let ch = name[i..].chars().next().unwrap();
            out.push(ch);
            i += ch.len_utf8();
        }
    }
    out
}

/// Parse the `N:/downcase` or `N:/upcase` body of a `${...}` capture command.
fn parse_capture_command(inner: &str) -> Option<(usize, &str)> {
    let (num_str, cmd_part) = inner.split_once(":/")?;
    let num: usize = num_str.parse().ok()?;
    Some((num, cmd_part))
}

fn resolve_capture_text(
    line: &str,
    captures: &[Option<(usize, usize)>],
    n: usize,
    command: Option<&str>,
) -> String {
    match captures.get(n).copied().flatten() {
        Some((s, e)) => {
            let mut text = &line[s..e];
            // Strip leading dots.
            while let Some(stripped) = text.strip_prefix('.') {
                text = stripped;
            }
            match command {
                Some("downcase") => text.to_lowercase(),
                Some("upcase") => text.to_uppercase(),
                _ => text.to_string(),
            }
        }
        // Non-participating group → leave the original token in place. The
        // caller only reaches this for `$N`; returning empty here would diverge,
        // so we return the literal so behavior matches the reference (`return e`).
        None => match command {
            Some(cmd) => format!("${{{n}:/{cmd}}}"),
            None => format!("${n}"),
        },
    }
}

// ---------------------------------------------------------------------------
// Compiled rule model.
// ---------------------------------------------------------------------------

/// A capture-group rule (`CaptureRule`, class `$`). Assigns a scope name (and
/// optionally re-tokenizes the captured text with `retokenize_rule_id`).
#[derive(Debug, Clone)]
pub struct CaptureRule {
    pub name: Option<String>,
    pub name_is_capturing: bool,
    pub content_name: Option<String>,
    pub content_name_is_capturing: bool,
    /// `0` means "no sub-tokenization" (vscode's falsy id).
    pub retokenize_rule_id: RuleId,
}

impl CaptureRule {
    /// `getName(lineText, captureIndices)` for a capture rule.
    pub fn get_name(
        &self,
        line: Option<&str>,
        captures: Option<&[Option<(usize, usize)>]>,
    ) -> Option<String> {
        resolve_name(&self.name, self.name_is_capturing, line, captures)
    }

    /// `getContentName(lineText, captureIndices)` for a capture rule.
    pub fn get_content_name(
        &self,
        line: Option<&str>,
        captures: Option<&[Option<(usize, usize)>]>,
    ) -> Option<String> {
        resolve_name(
            &self.content_name,
            self.content_name_is_capturing,
            line,
            captures,
        )
    }
}

#[derive(Debug, Clone)]
pub struct MatchRule {
    pub name: Option<String>,
    pub name_is_capturing: bool,
    pub match_src: RegExpSource,
    pub captures: Vec<Option<CaptureRule>>,
}

#[derive(Debug, Clone)]
pub struct IncludeOnlyRule {
    pub name: Option<String>,
    pub name_is_capturing: bool,
    pub content_name: Option<String>,
    pub content_name_is_capturing: bool,
    pub patterns: Vec<RuleId>,
    pub has_missing_patterns: bool,
}

#[derive(Debug, Clone)]
pub struct BeginEndRule {
    pub name: Option<String>,
    pub name_is_capturing: bool,
    pub content_name: Option<String>,
    pub content_name_is_capturing: bool,
    pub begin_src: RegExpSource,
    pub begin_captures: Vec<Option<CaptureRule>>,
    pub end_src: RegExpSource,
    pub end_has_back_references: bool,
    pub end_captures: Vec<Option<CaptureRule>>,
    pub apply_end_pattern_last: bool,
    pub patterns: Vec<RuleId>,
    pub has_missing_patterns: bool,
}

#[derive(Debug, Clone)]
pub struct BeginWhileRule {
    pub name: Option<String>,
    pub name_is_capturing: bool,
    pub content_name: Option<String>,
    pub content_name_is_capturing: bool,
    pub begin_src: RegExpSource,
    pub begin_captures: Vec<Option<CaptureRule>>,
    pub while_src: RegExpSource,
    pub while_has_back_references: bool,
    pub while_captures: Vec<Option<CaptureRule>>,
    pub patterns: Vec<RuleId>,
    pub has_missing_patterns: bool,
}

/// A compiled rule (`Rule` subclasses). The registry stores one per id.
///
/// Capture rules (`CaptureRule`) are *not* registry entries — they live inline
/// in each rule's flattened `captures` vectors. A capture that re-tokenizes its
/// text carries a separate `retokenize_rule_id` pointing at a real registry rule
/// (Match/Include/BeginEnd/BeginWhile).
#[derive(Debug, Clone)]
pub enum Rule {
    Match(MatchRule),
    Include(IncludeOnlyRule),
    BeginEnd(BeginEndRule),
    BeginWhile(BeginWhileRule),
    /// Placeholder for id 0 (`_ruleId2desc = [null]`); never scanned.
    Placeholder,
}

impl Rule {
    /// `getName(lineText, captureIndices)`.
    pub fn get_name(
        &self,
        line: Option<&str>,
        captures: Option<&[Option<(usize, usize)>]>,
    ) -> Option<String> {
        let (name, capturing) = match self {
            Rule::Match(r) => (&r.name, r.name_is_capturing),
            Rule::Include(r) => (&r.name, r.name_is_capturing),
            Rule::BeginEnd(r) => (&r.name, r.name_is_capturing),
            Rule::BeginWhile(r) => (&r.name, r.name_is_capturing),
            Rule::Placeholder => (&None, false),
        };
        resolve_name(name, capturing, line, captures)
    }

    /// `getContentName(lineText, captureIndices)`.
    pub fn get_content_name(
        &self,
        line: Option<&str>,
        captures: Option<&[Option<(usize, usize)>]>,
    ) -> Option<String> {
        let (name, capturing) = match self {
            Rule::Include(r) => (&r.content_name, r.content_name_is_capturing),
            Rule::BeginEnd(r) => (&r.content_name, r.content_name_is_capturing),
            Rule::BeginWhile(r) => (&r.content_name, r.content_name_is_capturing),
            Rule::Match(_) | Rule::Placeholder => (&None, false),
        };
        resolve_name(name, capturing, line, captures)
    }
}

fn resolve_name(
    name: &Option<String>,
    capturing: bool,
    line: Option<&str>,
    captures: Option<&[Option<(usize, usize)>]>,
) -> Option<String> {
    match name {
        Some(n) if capturing => match (line, captures) {
            (Some(l), Some(c)) => Some(replace_name_captures(n, l, c)),
            _ => Some(n.clone()),
        },
        Some(n) => Some(n.clone()),
        None => None,
    }
}

// ---------------------------------------------------------------------------
// Grammar compiler (RuleFactory).
// ---------------------------------------------------------------------------

/// A parsed `include` reference (`v(e)` in the reference).
enum IncludeRef<'a> {
    Base,
    Self_,
    LocalName(&'a str),
    /// `source.x` or `source.x#name` — cross-grammar. Not resolved for H1.
    External,
}

fn parse_include(include: &str) -> IncludeRef<'_> {
    if include == "$base" {
        return IncludeRef::Base;
    }
    if include == "$self" {
        return IncludeRef::Self_;
    }
    match include.find('#') {
        None => IncludeRef::External,                    // "source.x"
        Some(0) => IncludeRef::LocalName(&include[1..]), // "#name"
        Some(_) => IncludeRef::External,                 // "source.x#name"
    }
}

/// Repository stack for name resolution. Later entries (rule-local repositories)
/// override earlier ones, mirroring `Object.assign({}, base, local)`.
type Repo<'a> = Vec<&'a HashMap<String, RawRule>>;

fn repo_lookup<'a>(repo: &Repo<'a>, name: &str) -> Option<&'a RawRule> {
    for m in repo.iter().rev() {
        if let Some(r) = m.get(name) {
            return Some(r);
        }
    }
    None
}

struct Compiler<'a> {
    rules: Vec<Rule>,
    id_by_ptr: HashMap<usize, RuleId>,
    next_id: RuleId,
    root_id: RuleId,
    /// Ties the compiler to the borrowed raw grammar the `&'a RawRule` pointers
    /// come from (raw rules are never stored, only memoized by address).
    _marker: std::marker::PhantomData<&'a RawGrammar>,
}

impl<'a> Compiler<'a> {
    fn reserve_id(&mut self) -> RuleId {
        let id = self.next_id;
        self.next_id += 1;
        while self.rules.len() <= id as usize {
            self.rules.push(Rule::Placeholder);
        }
        id
    }

    /// `getCompiledRuleId` — memoize a raw rule by pointer identity, assigning
    /// its id before compiling so recursion terminates.
    fn get_compiled_rule_id(&mut self, rule: &'a RawRule, repo: &Repo<'a>) -> RuleId {
        let key = rule as *const RawRule as usize;
        if let Some(&id) = self.id_by_ptr.get(&key) {
            return id;
        }
        let id = self.reserve_id();
        self.id_by_ptr.insert(key, id);
        let compiled = self.build_rule(rule, id, repo);
        self.rules[id as usize] = compiled;
        id
    }

    fn build_rule(&mut self, e: &'a RawRule, id: RuleId, repo: &Repo<'a>) -> Rule {
        if let Some(m) = &e.match_ {
            let captures = self.compile_captures(e.captures.as_ref(), repo);
            return Rule::Match(MatchRule {
                name: e.name.clone(),
                name_is_capturing: has_name_captures(&e.name),
                match_src: RegExpSource::new(m, id),
                captures,
            });
        }

        if e.begin.is_none() {
            // Include-only. Merge the rule's own repository (local overrides).
            let mut child_repo = repo.clone();
            if let Some(local) = &e.repository {
                child_repo.push(local);
            }
            // patterns ?? (include ? [{include}] : [])
            let (patterns, has_missing) = match &e.patterns {
                Some(ps) => self.compile_patterns(Some(ps), &child_repo),
                None => match &e.include {
                    // A lone `include` compiles as a single synthetic
                    // `[{include}]` pattern — resolve it directly (the synthetic
                    // wrapper is never memoized).
                    Some(inc) => {
                        let rid = self.resolve_include_ref(inc, &child_repo);
                        let mut patterns = Vec::new();
                        if rid != -1 && !self.is_empty_missing(rid) {
                            patterns.push(rid);
                        }
                        let has_missing = patterns.len() != 1;
                        (patterns, has_missing)
                    }
                    None => (Vec::new(), false),
                },
            };
            return Rule::Include(IncludeOnlyRule {
                name: e.name.clone(),
                name_is_capturing: has_name_captures(&e.name),
                content_name: e.content_name.clone(),
                content_name_is_capturing: has_name_captures(&e.content_name),
                patterns,
                has_missing_patterns: has_missing,
            });
        }

        if let Some(w) = &e.while_ {
            let begin_captures =
                self.compile_captures(e.begin_captures.as_ref().or(e.captures.as_ref()), repo);
            let while_captures =
                self.compile_captures(e.while_captures.as_ref().or(e.captures.as_ref()), repo);
            let (patterns, has_missing) = self.compile_patterns(e.patterns.as_deref(), repo);
            let while_src = RegExpSource::new(w, WHILE_RULE);
            let while_has_back_references = while_src.has_back_references;
            return Rule::BeginWhile(BeginWhileRule {
                name: e.name.clone(),
                name_is_capturing: has_name_captures(&e.name),
                content_name: e.content_name.clone(),
                content_name_is_capturing: has_name_captures(&e.content_name),
                begin_src: RegExpSource::new(e.begin.as_deref().unwrap(), id),
                begin_captures,
                while_src,
                while_has_back_references,
                while_captures,
                patterns,
                has_missing_patterns: has_missing,
            });
        }

        // Begin/end.
        let begin_captures =
            self.compile_captures(e.begin_captures.as_ref().or(e.captures.as_ref()), repo);
        let end_captures =
            self.compile_captures(e.end_captures.as_ref().or(e.captures.as_ref()), repo);
        let (patterns, has_missing) = self.compile_patterns(e.patterns.as_deref(), repo);
        let end_str = match &e.end {
            Some(s) if !s.is_empty() => s.as_str(),
            _ => NEVER,
        };
        let end_src = RegExpSource::new(end_str, END_RULE);
        let end_has_back_references = end_src.has_back_references;
        Rule::BeginEnd(BeginEndRule {
            name: e.name.clone(),
            name_is_capturing: has_name_captures(&e.name),
            content_name: e.content_name.clone(),
            content_name_is_capturing: has_name_captures(&e.content_name),
            begin_src: RegExpSource::new(e.begin.as_deref().unwrap(), id),
            begin_captures,
            end_src,
            end_has_back_references,
            end_captures,
            apply_end_pattern_last: e.apply_end_pattern_last.unwrap_or(false),
            patterns,
            has_missing_patterns: has_missing,
        })
    }

    /// Resolve an `include` string to a compiled rule id (`-1` when unresolved).
    fn resolve_include_ref(&mut self, include: &str, repo: &Repo<'a>) -> RuleId {
        match parse_include(include) {
            IncludeRef::Base | IncludeRef::Self_ => self.root_id,
            IncludeRef::LocalName(name) => match repo_lookup(repo, name) {
                Some(r) => self.get_compiled_rule_id(r, repo),
                None => -1,
            },
            // Cross-grammar includes are out of scope for the H1 set (none of
            // js/ts/json/bash reference an external `source.*`).
            IncludeRef::External => -1,
        }
    }

    /// `_compilePatterns` — resolve each pattern (include or inline) to a rule
    /// id, dropping include-only rules that resolved to nothing.
    fn compile_patterns(
        &mut self,
        patterns: Option<&'a [RawRule]>,
        repo: &Repo<'a>,
    ) -> (Vec<RuleId>, bool) {
        let mut out: Vec<RuleId> = Vec::new();
        let input = patterns.unwrap_or(&[]);
        for item in input {
            let rid: RuleId = if let Some(inc) = &item.include {
                self.resolve_include_ref(inc, repo)
            } else {
                self.get_compiled_rule_id(item, repo)
            };

            if rid == -1 {
                continue;
            }
            // Drop include/begin-end/begin-while rules that ended up empty.
            if self.is_empty_missing(rid) {
                continue;
            }
            out.push(rid);
        }
        let has_missing = input.len() != out.len();
        (out, has_missing)
    }

    fn is_empty_missing(&self, rid: RuleId) -> bool {
        match &self.rules[rid as usize] {
            Rule::Include(r) => r.has_missing_patterns && r.patterns.is_empty(),
            Rule::BeginEnd(r) => r.has_missing_patterns && r.patterns.is_empty(),
            Rule::BeginWhile(r) => r.has_missing_patterns && r.patterns.is_empty(),
            _ => false,
        }
    }

    /// `_compileCaptures` — flatten a captures map into a `Vec<Option<CaptureRule>>`
    /// indexed by group number.
    fn compile_captures(
        &mut self,
        captures: Option<&'a RawCaptures>,
        repo: &Repo<'a>,
    ) -> Vec<Option<CaptureRule>> {
        let Some(caps) = captures else {
            return Vec::new();
        };
        // Highest numeric group key.
        let mut max = 0usize;
        let mut any = false;
        for k in caps.0.keys() {
            if k == "$vscodeTextmateLocation" {
                continue;
            }
            if let Ok(n) = k.parse::<usize>() {
                any = true;
                if n > max {
                    max = n;
                }
            }
        }
        if !any {
            return Vec::new();
        }
        let mut result: Vec<Option<CaptureRule>> = vec![None; max + 1];
        for (k, rule) in &caps.0 {
            if k == "$vscodeTextmateLocation" {
                continue;
            }
            let Ok(idx) = k.parse::<usize>() else {
                continue;
            };
            // A capture rule with its own patterns re-tokenizes the capture.
            let retokenize = if rule.patterns.is_some() {
                self.get_compiled_rule_id(rule, repo)
            } else {
                0
            };
            result[idx] = Some(CaptureRule {
                name: rule.name.clone(),
                name_is_capturing: has_name_captures(&rule.name),
                content_name: rule.content_name.clone(),
                content_name_is_capturing: has_name_captures(&rule.content_name),
                retokenize_rule_id: retokenize,
            });
        }
        result
    }
}

/// Compile a raw grammar into a flat rule registry + the root rule id. The root
/// rule is the grammar's `$self` (an include-only rule over the top-level
/// `patterns`, named with the grammar's scope). `$self`/`$base` includes resolve
/// to it directly (they coincide for a root grammar).
///
/// Every field of the raw model is consumed here (name/contentName, match,
/// begin/end/while + their captures, patterns, repository, applyEndPatternLast),
/// plus the grammar-level `injections`/`injection_selector`/`name` which are
/// surfaced for H2's cross-grammar injections and otherwise inert for H1.
pub fn compile_grammar(raw: &RawGrammar) -> (Vec<Rule>, RuleId) {
    let mut c = Compiler {
        rules: vec![Rule::Placeholder], // id 0 unused
        id_by_ptr: HashMap::new(),
        next_id: 1,
        root_id: 0,
        _marker: std::marker::PhantomData,
    };

    // Reserve the root ($self) id first so recursive `$self`/`$base` includes
    // resolve without recompiling.
    let root_id = c.reserve_id();
    c.root_id = root_id;

    let root_repo: Repo = vec![&raw.repository];
    let (patterns, has_missing) = c.compile_patterns(Some(&raw.patterns), &root_repo);
    c.rules[root_id as usize] = Rule::Include(IncludeOnlyRule {
        name: Some(raw.scope_name.clone()),
        name_is_capturing: false,
        content_name: None,
        content_name_is_capturing: false,
        patterns,
        has_missing_patterns: has_missing,
    });

    // Touch the H2-facing grammar fields so they participate in the build (they
    // are inert for the H1 corpus, which has no injections).
    let _injection_count = raw.injections.len();
    let _injection_selector = raw.injection_selector.as_deref();
    let _display_name = raw.name.as_deref();

    (c.rules, root_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn regexp_source_detects_anchors_and_backrefs() {
        let g = RegExpSource::new(r"\G(foo)\1", 1);
        assert!(g.has_anchor);
        assert!(g.has_back_references);
        // \G disabled → ￿; enabled → G kept.
        assert!(g.resolve_anchors(false, false).contains('\u{FFFF}'));
        assert!(g.resolve_anchors(false, true).contains("\\G"));

        let plain = RegExpSource::new(r"foo", 1);
        assert!(!plain.has_anchor);
        assert_eq!(plain.resolve_anchors(true, true), "foo");
    }

    #[test]
    fn z_anchor_rewrite() {
        let s = RegExpSource::new(r"abc\z", 1);
        assert_eq!(s.source, r"abc$(?!\n)(?<!\n)");
    }

    #[test]
    fn back_reference_resolution_escapes() {
        let s = RegExpSource::new(r"\1", 1);
        // capture 1 = "a.b" → escaped "a\.b" (dot escaped).
        let out = s.resolve_back_references("xa.b", &[Some((0, 4)), Some((1, 4))]);
        assert_eq!(out, r"a\.b");
    }

    #[test]
    fn compiles_minimal_grammar() {
        let raw = RawGrammar::from_json(
            r##"{
                "scopeName": "source.demo",
                "patterns": [{ "include": "#kw" }, { "match": "\\d+", "name": "constant.numeric" }],
                "repository": {
                    "kw": { "match": "\\b(if|else)\\b", "name": "keyword.control" }
                }
            }"##,
        )
        .unwrap();
        let (rules, root) = compile_grammar(&raw);
        assert_eq!(root, 1);
        match &rules[root as usize] {
            Rule::Include(inc) => assert_eq!(inc.patterns.len(), 2),
            _ => panic!("root must be include-only"),
        }
    }
}
