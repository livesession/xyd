//! The tokenizer core — a Rust port of `vscode-textmate`'s `grammar.ts`
//! (`Grammar._tokenize` / `_tokenizeString` / `_handleCaptures`,
//! `AttributedScopeStack`, `StateStackImpl`, `LineTokens`) driving the compiled
//! rules from [`super::rule`] over [`crate::OnigScanner`], with per-token
//! metadata resolved against [`crate::theme::Theme`].
//!
//! [`Grammar::from_raw`] compiles a raw grammar; [`highlight`] threads the state
//! stack across lines and reshapes `tokenizeLine2` output into styled lines via
//! [`crate::reshape::styled_lines`] — the same pipeline as
//! `syntax0-highlight/src/tokenizer.ts::tokenize`.

use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::rc::Rc;

use crate::encode::{pack_metadata, FontStyle, StyleAttributes};
use crate::reshape::{styled_lines, StyledToken};
use crate::theme::Theme;
use crate::OnigScanner;

use super::raw::RawGrammar;
use super::rule::{
    compile_grammar, compile_grammar_set, BeginEndRule, BeginWhileRule, CaptureRule, GrammarSet,
    Injection, RegExpSource, Rule, RuleId, END_RULE, NEVER_MATCH,
};

// ---------------------------------------------------------------------------
// Compiled-scanner cache.
// ---------------------------------------------------------------------------

thread_local! {
    /// Content-addressed cache of compiled `OnigScanner`s, keyed by the resolved
    /// regex sources. vscode-textmate caches each rule's compiled scanner; the
    /// naive port instead assembled AND COMPILED the Oniguruma patterns at every
    /// match position — O(positions × grammar-size), which dominated build time
    /// (~0.6s per `tsx` code block even with the grammar structure cached).
    /// Static rules now reuse their scanner across every call; only
    /// backref-`end`/`while` rules (whose sources are substituted per match) miss.
    /// Thread-local because `OnigScanner`/`Rc` are not `Send` — each SSG worker
    /// warms its own. Output is unchanged (same scanner, just compiled once).
    static SCANNER_CACHE: RefCell<HashMap<String, Rc<OnigScanner>>> = RefCell::new(HashMap::new());
}

/// Length-prefixed join of the sources → an injective key (no source content can
/// forge a different list's key), so a cache hit is ALWAYS the exact same scanner
/// — the byte-parity guarantee is preserved.
fn scanner_key(sources: &[String]) -> String {
    let mut key = String::with_capacity(sources.iter().map(|s| s.len() + 8).sum());
    for s in sources {
        key.push_str(&s.len().to_string());
        key.push('\u{1}');
        key.push_str(s);
        key.push('\u{1}');
    }
    key
}

/// The compiled `OnigScanner` for `sources`, compiling + caching on first use.
fn cached_scanner(sources: &[String]) -> Rc<OnigScanner> {
    let key = scanner_key(sources);
    SCANNER_CACHE.with(|c| {
        if let Some(sc) = c.borrow().get(&key) {
            return sc.clone();
        }
        let sc = Rc::new(OnigScanner::new(sources));
        c.borrow_mut().insert(key, sc.clone());
        sc
    })
}

// ---------------------------------------------------------------------------
// Grammar — the compiled rule registry + scanner assembly.
// ---------------------------------------------------------------------------

/// A compiled grammar: the flat rule registry, the root rule id, the root scope
/// name (seeded into the scope stack), and the root grammar's compiled
/// injections. Cross-grammar includes are resolved at compile time into the same
/// flat registry (via [`compile_grammar_set`]), so tokenization is registry-
/// unaware. The H1 corpus (js/ts/json/bash) is self-contained → empty
/// injections → byte-identical to the H1 engine.
pub struct Grammar {
    rules: Vec<Rule>,
    root_id: RuleId,
    root_scope_name: String,
    injections: Vec<Injection>,
}

impl Grammar {
    /// Compile a single self-contained parsed raw grammar into a runnable
    /// [`Grammar`] (cross-grammar `source.*` includes resolve to inert).
    pub fn from_raw(raw: &RawGrammar) -> Grammar {
        let (rules, root_id, injections) = compile_grammar(raw);
        Grammar {
            rules,
            root_id,
            root_scope_name: raw.scope_name.clone(),
            injections,
        }
    }

    /// Compile a grammar set (the pre-loaded include closure) rooted at
    /// `top_scope`, resolving cross-grammar includes + injections. This is the
    /// registry path used by [`crate::Registry`].
    pub fn from_set(top_scope: &str, store: &GrammarSet) -> Grammar {
        let (rules, root_id, injections) = compile_grammar_set(top_scope, store);
        Grammar {
            rules,
            root_id,
            root_scope_name: top_scope.to_string(),
            injections,
        }
    }

    /// Load a grammar from a `tm-grammars`-style JSON. The CDN bundles are JSON
    /// arrays of grammar objects; a bare object is also accepted. `scope_name`
    /// selects the entry from a bundle. Self-contained compile only (no cross-
    /// grammar include resolution) — use [`crate::Registry`] for embeds.
    pub fn load(bundle_json: &str, scope_name: &str) -> Grammar {
        let mut value: serde_json::Value =
            serde_json::from_str(bundle_json).expect("valid grammar JSON");
        normalize_grammar_json(&mut value);
        let raw: RawGrammar = match value {
            serde_json::Value::Array(entries) => {
                let entry = entries
                    .into_iter()
                    .find(|g| {
                        g.get("scopeName").and_then(serde_json::Value::as_str) == Some(scope_name)
                    })
                    .expect("bundle contains the requested scope");
                serde_json::from_value(entry).expect("valid raw grammar")
            }
            object => serde_json::from_value(object).expect("valid raw grammar"),
        };
        Grammar::from_raw(&raw)
    }

    fn get_rule(&self, id: RuleId) -> &Rule {
        &self.rules[id as usize]
    }

    /// Assemble the scanner sources + parallel rule-id list for the *current*
    /// rule (`compileAG`): a rule's own sub-patterns, plus the `end` pattern for
    /// a begin/end rule (with the resolved back-reference source when needed).
    fn build_scanner(
        &self,
        rule_id: RuleId,
        end_rule: Option<&str>,
        allow_a: bool,
        allow_g: bool,
    ) -> (Vec<String>, Vec<RuleId>) {
        let mut list: Vec<RegExpSource> = Vec::new();
        match self.get_rule(rule_id) {
            Rule::Match(m) => list.push(m.match_src.clone()),
            Rule::Include(inc) => {
                for &p in &inc.patterns {
                    self.collect_patterns(p, &mut list);
                }
            }
            Rule::BeginWhile(w) => {
                for &p in &w.patterns {
                    self.collect_patterns(p, &mut list);
                }
            }
            Rule::BeginEnd(b) => {
                for &p in &b.patterns {
                    self.collect_patterns(p, &mut list);
                }
                let end_src = if b.end_has_back_references {
                    RegExpSource::new(end_rule.unwrap_or(NEVER_MATCH), END_RULE)
                } else {
                    b.end_src.clone()
                };
                if b.apply_end_pattern_last {
                    list.push(end_src);
                } else {
                    list.insert(0, end_src);
                }
            }
            Rule::Placeholder => {}
        }
        let sources = list
            .iter()
            .map(|s| s.resolve_anchors(allow_a, allow_g))
            .collect();
        let ids = list.iter().map(|s| s.rule_id).collect();
        (sources, ids)
    }

    /// `collectPatterns`: gather the *entry* sources of a rule (its begin/match),
    /// flattening include-only rules.
    fn collect_patterns(&self, rule_id: RuleId, out: &mut Vec<RegExpSource>) {
        match self.get_rule(rule_id) {
            Rule::Match(m) => out.push(m.match_src.clone()),
            Rule::BeginEnd(b) => out.push(b.begin_src.clone()),
            Rule::BeginWhile(w) => out.push(w.begin_src.clone()),
            Rule::Include(inc) => {
                for &p in &inc.patterns {
                    self.collect_patterns(p, out);
                }
            }
            Rule::Placeholder => {}
        }
    }
}

// ---------------------------------------------------------------------------
// AttributedScopeStack (class `pe`) — scope path + accumulated metadata.
// ---------------------------------------------------------------------------

/// A scope stack node carrying the full scope path (outermost..innermost) and
/// the metadata accumulated by merging each scope's theme match across the path
/// (vscode's `AttributedScopeStack` / `mergeAttributes`).
struct AttributedScopeStack {
    scope_names: Vec<String>,
    metadata: StyleAttributes,
}

impl AttributedScopeStack {
    fn root(scope_name: &str, theme: &Theme) -> Rc<AttributedScopeStack> {
        let style = theme.match_scopes(&[scope_name]);
        let metadata = merge_attributes(theme.defaults(), style);
        Rc::new(AttributedScopeStack {
            scope_names: vec![scope_name.to_string()],
            metadata,
        })
    }

    /// `pushAttributed(scopePath, grammar)` — push each space-separated scope,
    /// merging its theme match into the accumulated metadata.
    fn push_attributed(
        current: &Rc<AttributedScopeStack>,
        scope_path: Option<&str>,
        theme: &Theme,
    ) -> Rc<AttributedScopeStack> {
        let Some(sp) = scope_path else {
            return current.clone();
        };
        if !sp.contains(' ') {
            AttributedScopeStack::push_one(current, sp, theme)
        } else {
            let mut result = current.clone();
            for scope in sp.split(' ') {
                result = AttributedScopeStack::push_one(&result, scope, theme);
            }
            result
        }
    }

    fn push_one(
        current: &Rc<AttributedScopeStack>,
        scope: &str,
        theme: &Theme,
    ) -> Rc<AttributedScopeStack> {
        let mut names = current.scope_names.clone();
        names.push(scope.to_string());
        let refs: Vec<&str> = names.iter().map(String::as_str).collect();
        let style = theme.match_scopes(&refs);
        let metadata = merge_attributes(current.metadata, style);
        Rc::new(AttributedScopeStack {
            scope_names: names,
            metadata,
        })
    }
}

/// `mergeAttributes` — a style field overrides the accumulated one only when it
/// is "set" (`fontStyle != NotSet`, color id `!= 0`); otherwise the parent value
/// is inherited.
fn merge_attributes(existing: StyleAttributes, style: StyleAttributes) -> StyleAttributes {
    StyleAttributes {
        font_style: if style.font_style != FontStyle::NOT_SET {
            style.font_style
        } else {
            existing.font_style
        },
        foreground_id: if style.foreground_id != 0 {
            style.foreground_id
        } else {
            existing.foreground_id
        },
        background_id: if style.background_id != 0 {
            style.background_id
        } else {
            existing.background_id
        },
    }
}

fn pack(style: StyleAttributes) -> u32 {
    pack_metadata(style.font_style, style.foreground_id, style.background_id)
}

// ---------------------------------------------------------------------------
// StateStack (class `de`) — the rule + scope stack threaded across lines.
// ---------------------------------------------------------------------------

struct StateStack {
    parent: Option<Rc<StateStack>>,
    depth: usize,
    rule_id: RuleId,
    enter_pos: Cell<i32>,
    anchor_pos: Cell<i32>,
    begin_rule_captured_eol: bool,
    /// Resolved back-reference `end`/`while` source, when the rule has one.
    end_rule: Option<String>,
    name_scopes_list: Rc<AttributedScopeStack>,
    content_name_scopes_list: Rc<AttributedScopeStack>,
}

impl StateStack {
    #[allow(clippy::too_many_arguments)]
    fn push(
        self: &Rc<Self>,
        rule_id: RuleId,
        enter_pos: i32,
        anchor_pos: i32,
        begin_rule_captured_eol: bool,
        end_rule: Option<String>,
        name_scopes_list: Rc<AttributedScopeStack>,
        content_name_scopes_list: Rc<AttributedScopeStack>,
    ) -> Rc<StateStack> {
        Rc::new(StateStack {
            parent: Some(self.clone()),
            depth: self.depth + 1,
            rule_id,
            enter_pos: Cell::new(enter_pos),
            anchor_pos: Cell::new(anchor_pos),
            begin_rule_captured_eol,
            end_rule,
            name_scopes_list,
            content_name_scopes_list,
        })
    }

    fn pop(self: &Rc<Self>) -> Rc<StateStack> {
        self.parent
            .clone()
            .expect("cannot pop the root state stack")
    }

    fn safe_pop(self: &Rc<Self>) -> Rc<StateStack> {
        self.parent.clone().unwrap_or_else(|| self.clone())
    }

    fn with_content_name_scopes_list(
        self: &Rc<Self>,
        content: Rc<AttributedScopeStack>,
    ) -> Rc<StateStack> {
        if Rc::ptr_eq(&self.content_name_scopes_list, &content) {
            return self.clone();
        }
        Rc::new(StateStack {
            parent: self.parent.clone(),
            depth: self.depth,
            rule_id: self.rule_id,
            enter_pos: Cell::new(self.enter_pos.get()),
            anchor_pos: Cell::new(self.anchor_pos.get()),
            begin_rule_captured_eol: self.begin_rule_captured_eol,
            end_rule: self.end_rule.clone(),
            name_scopes_list: self.name_scopes_list.clone(),
            content_name_scopes_list: content,
        })
    }

    fn with_end_rule(self: &Rc<Self>, end_rule: Option<String>) -> Rc<StateStack> {
        if self.end_rule == end_rule {
            return self.clone();
        }
        Rc::new(StateStack {
            parent: self.parent.clone(),
            depth: self.depth,
            rule_id: self.rule_id,
            enter_pos: Cell::new(self.enter_pos.get()),
            anchor_pos: Cell::new(self.anchor_pos.get()),
            begin_rule_captured_eol: self.begin_rule_captured_eol,
            end_rule,
            name_scopes_list: self.name_scopes_list.clone(),
            content_name_scopes_list: self.content_name_scopes_list.clone(),
        })
    }

    fn has_same_rule_as(self: &Rc<Self>, other: &Rc<StateStack>) -> bool {
        let mut node = Some(self.clone());
        while let Some(n) = node {
            if n.enter_pos.get() != other.enter_pos.get() {
                break;
            }
            if n.rule_id == other.rule_id {
                return true;
            }
            node = n.parent.clone();
        }
        false
    }

    /// `_reset` — clear per-line enter/anchor positions before reusing the stack
    /// on a new line.
    fn reset(self: &Rc<Self>) {
        let mut node = Some(self.clone());
        while let Some(n) = node {
            n.enter_pos.set(-1);
            n.anchor_pos.set(-1);
            node = n.parent.clone();
        }
    }
}

// ---------------------------------------------------------------------------
// LineTokens (class `me`) — the binary `[start, metadata, …]` accumulator.
// ---------------------------------------------------------------------------

struct LineTokens {
    binary_tokens: Vec<u32>,
    last_token_end_index: i64,
}

impl LineTokens {
    fn new() -> LineTokens {
        LineTokens {
            binary_tokens: Vec::new(),
            last_token_end_index: 0,
        }
    }

    /// `produceFromScopes` (binary path): emit a token boundary when the metadata
    /// differs from the previous, otherwise extend the previous token.
    fn emit(&mut self, metadata: u32, end_index: usize) {
        if self.last_token_end_index >= end_index as i64 {
            return;
        }
        if let Some(&last_meta) = self.binary_tokens.last() {
            if last_meta == metadata {
                self.last_token_end_index = end_index as i64;
                return;
            }
        }
        self.binary_tokens.push(self.last_token_end_index as u32);
        self.binary_tokens.push(metadata);
        self.last_token_end_index = end_index as i64;
    }
}

// ---------------------------------------------------------------------------
// Tokenizer — the stateful `_tokenizeString` machine over a single grammar.
// ---------------------------------------------------------------------------

struct MatchResult {
    rule_id: RuleId,
    captures: Vec<Option<(usize, usize)>>,
}

/// An injection's scan result + whether it is an `L:` (priority < 0) injection,
/// which wins ties at the same position against the base rule match.
struct InjectionMatch {
    result: MatchResult,
    priority_match: bool,
}

struct Tokenizer<'a> {
    grammar: &'a Grammar,
    theme: &'a Theme,
}

impl<'a> Tokenizer<'a> {
    fn create_root_stack(&self) -> Rc<StateStack> {
        let root_scopes = AttributedScopeStack::root(&self.grammar.root_scope_name, self.theme);
        Rc::new(StateStack {
            parent: None,
            depth: 1,
            rule_id: self.grammar.root_id,
            enter_pos: Cell::new(-1),
            anchor_pos: Cell::new(-1),
            begin_rule_captured_eol: false,
            end_rule: None,
            name_scopes_list: root_scopes.clone(),
            content_name_scopes_list: root_scopes,
        })
    }

    /// `tokenizeLine2` — tokenize one line (a trailing `\n` is appended exactly
    /// like `_tokenize`) into the binary `[start, metadata, …]` array.
    fn tokenize_line2(
        &self,
        line: &str,
        prev: Option<Rc<StateStack>>,
    ) -> (Vec<u32>, Rc<StateStack>) {
        let (is_first_line, stack) = match prev {
            None => (true, self.create_root_stack()),
            Some(s) => {
                s.reset();
                (false, s)
            }
        };

        let text = format!("{line}\n");
        let line_length = text.len();
        let mut tokens = LineTokens::new();
        let stack = self.tokenize_string(&text, is_first_line, 0, stack, &mut tokens, true);
        let binary = self.finalize_binary(&mut tokens, &stack, line_length);
        (binary, stack)
    }

    /// `getBinaryResult` — drop the trailing `\n` token and guarantee at least
    /// one token, then hand back the `[start, metadata, …]` array.
    fn finalize_binary(
        &self,
        tokens: &mut LineTokens,
        stack: &Rc<StateStack>,
        line_length: usize,
    ) -> Vec<u32> {
        let len = tokens.binary_tokens.len();
        if len > 0 && tokens.binary_tokens[len - 2] == (line_length - 1) as u32 {
            tokens.binary_tokens.pop();
            tokens.binary_tokens.pop();
        }
        if tokens.binary_tokens.is_empty() {
            tokens.last_token_end_index = -1;
            self.produce(tokens, stack, line_length);
            let n = tokens.binary_tokens.len();
            tokens.binary_tokens[n - 2] = 0;
        }
        tokens.binary_tokens.clone()
    }

    fn produce(&self, tokens: &mut LineTokens, stack: &StateStack, end: usize) {
        let metadata = pack(stack.content_name_scopes_list.metadata);
        tokens.emit(metadata, end);
    }

    fn produce_from_scopes(
        &self,
        tokens: &mut LineTokens,
        scopes: &Rc<AttributedScopeStack>,
        end: usize,
    ) {
        tokens.emit(pack(scopes.metadata), end);
    }

    /// `_tokenizeString` — the scan loop: match the current rule (or its `end`),
    /// push/pop scopes, handle captures, and advance, with vscode's
    /// endless-loop guards.
    fn tokenize_string(
        &self,
        text: &str,
        mut is_first_line: bool,
        mut line_pos: usize,
        mut stack: Rc<StateStack>,
        tokens: &mut LineTokens,
        check_while: bool,
    ) -> Rc<StateStack> {
        let line_length = text.len();
        let mut anchor_position: i32 = -1;

        if check_while {
            let r = self.check_while_conditions(text, is_first_line, line_pos, stack, tokens);
            stack = r.0;
            line_pos = r.1;
            is_first_line = r.2;
            anchor_position = r.3;
        }

        'scan: loop {
            let matched = self.match_rule_or_injections(
                text,
                is_first_line,
                line_pos,
                &stack,
                anchor_position,
            );
            let Some(m) = matched else {
                self.produce(tokens, &stack, line_length);
                break 'scan;
            };
            let captures = m.captures;
            let matched_rule_id = m.rule_id;
            let (c0_start, c0_end) = captures[0].expect("whole match present");
            let advanced = c0_end > line_pos;

            if matched_rule_id == END_RULE {
                let cur_rule_id = stack.rule_id;
                self.produce(tokens, &stack, c0_start);
                stack = stack.with_content_name_scopes_list(stack.name_scopes_list.clone());
                if let Rule::BeginEnd(b) = self.grammar.get_rule(cur_rule_id) {
                    self.handle_captures(
                        text,
                        is_first_line,
                        &stack,
                        tokens,
                        &b.end_captures,
                        &captures,
                    );
                }
                self.produce(tokens, &stack, c0_end);
                let popped = stack.clone();
                stack = stack.pop();
                anchor_position = popped.anchor_pos.get();
                if !advanced && popped.enter_pos.get() == line_pos as i32 {
                    // Grammar pushed & popped without advancing — bail.
                    stack = popped;
                    self.produce(tokens, &stack, line_length);
                    break 'scan;
                }
            } else {
                let rule_id = matched_rule_id;
                self.produce(tokens, &stack, c0_start);
                let before = stack.clone();
                let name = self
                    .grammar
                    .get_rule(rule_id)
                    .get_name(Some(text), Some(&captures));
                let content_name = self
                    .grammar
                    .get_rule(rule_id)
                    .get_content_name(Some(text), Some(&captures));
                let name_scopes = AttributedScopeStack::push_attributed(
                    &stack.content_name_scopes_list,
                    name.as_deref(),
                    self.theme,
                );
                stack = stack.push(
                    rule_id,
                    line_pos as i32,
                    anchor_position,
                    c0_end == line_length,
                    None,
                    name_scopes.clone(),
                    name_scopes.clone(),
                );

                match self.grammar.get_rule(rule_id) {
                    Rule::BeginEnd(b) => {
                        if self.push_begin_end(
                            text,
                            is_first_line,
                            &mut stack,
                            tokens,
                            b,
                            &name_scopes,
                            content_name,
                            &captures,
                            c0_end,
                            advanced,
                            &before,
                            line_length,
                        ) {
                            break 'scan;
                        }
                        anchor_position = c0_end as i32;
                    }
                    Rule::BeginWhile(w) => {
                        if self.push_begin_while(
                            text,
                            is_first_line,
                            &mut stack,
                            tokens,
                            w,
                            &name_scopes,
                            content_name,
                            &captures,
                            c0_end,
                            advanced,
                            &before,
                            line_length,
                        ) {
                            break 'scan;
                        }
                        anchor_position = c0_end as i32;
                    }
                    _ => {
                        // MatchRule: emit captures, then pop immediately.
                        let captures_rules = match self.grammar.get_rule(rule_id) {
                            Rule::Match(mr) => &mr.captures,
                            _ => unreachable!("only match rules reach here"),
                        };
                        self.handle_captures(
                            text,
                            is_first_line,
                            &stack,
                            tokens,
                            captures_rules,
                            &captures,
                        );
                        self.produce(tokens, &stack, c0_end);
                        stack = stack.pop();
                        if !advanced {
                            stack = stack.safe_pop();
                            self.produce(tokens, &stack, line_length);
                            break 'scan;
                        }
                    }
                }
            }

            if c0_end > line_pos {
                line_pos = c0_end;
                is_first_line = false;
            }
        }

        stack
    }

    /// The begin/end push tail. Returns `true` when the endless-loop guard fires
    /// (caller must stop).
    #[allow(clippy::too_many_arguments)]
    fn push_begin_end(
        &self,
        text: &str,
        is_first_line: bool,
        stack: &mut Rc<StateStack>,
        tokens: &mut LineTokens,
        rule: &BeginEndRule,
        name_scopes: &Rc<AttributedScopeStack>,
        content_name: Option<String>,
        captures: &[Option<(usize, usize)>],
        c0_end: usize,
        advanced: bool,
        before: &Rc<StateStack>,
        line_length: usize,
    ) -> bool {
        self.handle_captures(
            text,
            is_first_line,
            stack,
            tokens,
            &rule.begin_captures,
            captures,
        );
        self.produce(tokens, stack, c0_end);
        let content_scopes =
            AttributedScopeStack::push_attributed(name_scopes, content_name.as_deref(), self.theme);
        *stack = stack.with_content_name_scopes_list(content_scopes);
        if rule.end_has_back_references {
            let resolved = rule.end_src.resolve_back_references(text, captures);
            *stack = stack.with_end_rule(Some(resolved));
        }
        if !advanced && before.has_same_rule_as(stack) {
            *stack = stack.pop();
            self.produce(tokens, stack, line_length);
            return true;
        }
        false
    }

    /// The begin/while push tail. Returns `true` on the endless-loop guard.
    #[allow(clippy::too_many_arguments)]
    fn push_begin_while(
        &self,
        text: &str,
        is_first_line: bool,
        stack: &mut Rc<StateStack>,
        tokens: &mut LineTokens,
        rule: &BeginWhileRule,
        name_scopes: &Rc<AttributedScopeStack>,
        content_name: Option<String>,
        captures: &[Option<(usize, usize)>],
        c0_end: usize,
        advanced: bool,
        before: &Rc<StateStack>,
        line_length: usize,
    ) -> bool {
        self.handle_captures(
            text,
            is_first_line,
            stack,
            tokens,
            &rule.begin_captures,
            captures,
        );
        self.produce(tokens, stack, c0_end);
        let content_scopes =
            AttributedScopeStack::push_attributed(name_scopes, content_name.as_deref(), self.theme);
        *stack = stack.with_content_name_scopes_list(content_scopes);
        if rule.while_has_back_references {
            let resolved = rule.while_src.resolve_back_references(text, captures);
            *stack = stack.with_end_rule(Some(resolved));
        }
        if !advanced && before.has_same_rule_as(stack) {
            *stack = stack.pop();
            self.produce(tokens, stack, line_length);
            return true;
        }
        false
    }

    /// `matchRule`: scan the current rule's assembled patterns and return the
    /// matched rule id + spans.
    fn match_rule(
        &self,
        text: &str,
        is_first_line: bool,
        line_pos: usize,
        stack: &StateStack,
        anchor_pos: i32,
    ) -> Option<MatchResult> {
        let allow_a = is_first_line;
        let allow_g = line_pos as i32 == anchor_pos;
        let (sources, ids) =
            self.grammar
                .build_scanner(stack.rule_id, stack.end_rule.as_deref(), allow_a, allow_g);
        if sources.is_empty() {
            return None;
        }
        let scanner = cached_scanner(&sources);
        let m = scanner.find_next_match(text, line_pos)?;
        Some(MatchResult {
            rule_id: ids[m.pattern_index],
            captures: m.captures,
        })
    }

    /// `matchRuleOrInjections` — combine the current rule's match with the
    /// grammar's injections (those whose selector matches the current scope
    /// stack). An injection wins if it matches strictly earlier, or at the same
    /// position when it is an `L:` (priority < 0) injection. With no injections
    /// this is exactly [`Self::match_rule`] (so the H1 corpus is unchanged).
    fn match_rule_or_injections(
        &self,
        text: &str,
        is_first_line: bool,
        line_pos: usize,
        stack: &StateStack,
        anchor_pos: i32,
    ) -> Option<MatchResult> {
        let rule_match = self.match_rule(text, is_first_line, line_pos, stack, anchor_pos);
        if self.grammar.injections.is_empty() {
            return rule_match;
        }
        let inj = self.match_injections(text, is_first_line, line_pos, stack, anchor_pos);
        match (rule_match, inj) {
            (a, None) => a,
            (None, Some(i)) => Some(i.result),
            (Some(a), Some(i)) => {
                let a_start = a.captures[0].expect("whole match present").0;
                let i_start = i.result.captures[0].expect("whole match present").0;
                if i_start < a_start || (i.priority_match && i_start == a_start) {
                    Some(i.result)
                } else {
                    Some(a)
                }
            }
        }
    }

    /// `matchInjections` — the earliest injection match whose selector matches
    /// the current content scope stack (ties at `line_pos` short-circuit, like
    /// vscode-oniguruma's scanner). `priority_match` marks an `L:` injection.
    fn match_injections(
        &self,
        text: &str,
        is_first_line: bool,
        line_pos: usize,
        stack: &StateStack,
        anchor_pos: i32,
    ) -> Option<InjectionMatch> {
        let scope_names: Vec<&str> = stack
            .content_name_scopes_list
            .scope_names
            .iter()
            .map(String::as_str)
            .collect();
        let allow_a = is_first_line;
        let allow_g = line_pos as i32 == anchor_pos;

        let mut best_start = usize::MAX;
        let mut best: Option<InjectionMatch> = None;
        for inj in &self.grammar.injections {
            if !inj.matcher.matches(&scope_names) {
                continue;
            }
            let (sources, ids) = self
                .grammar
                .build_scanner(inj.rule_id, None, allow_a, allow_g);
            if sources.is_empty() {
                continue;
            }
            let scanner = cached_scanner(&sources);
            let Some(m) = scanner.find_next_match(text, line_pos) else {
                continue;
            };
            let start = m.captures[0].expect("whole match present").0;
            if start >= best_start {
                continue;
            }
            best_start = start;
            best = Some(InjectionMatch {
                result: MatchResult {
                    rule_id: ids[m.pattern_index],
                    captures: m.captures,
                },
                priority_match: inj.priority < 0,
            });
            if start == line_pos {
                break;
            }
        }
        best
    }

    /// `_checkWhileConditions` — before scanning a line, verify each active
    /// begin/while rule's `while` still matches; pop the block when it fails.
    fn check_while_conditions(
        &self,
        text: &str,
        mut is_first_line: bool,
        mut line_pos: usize,
        mut stack: Rc<StateStack>,
        tokens: &mut LineTokens,
    ) -> (Rc<StateStack>, usize, bool, i32) {
        let mut anchor_position: i32 = if stack.begin_rule_captured_eol { 0 } else { -1 };

        // Collect active begin/while rules, innermost first.
        let mut while_rules: Vec<Rc<StateStack>> = Vec::new();
        {
            let mut node = Some(stack.clone());
            while let Some(n) = node {
                if let Rule::BeginWhile(_) = self.grammar.get_rule(n.rule_id) {
                    while_rules.push(n.clone());
                }
                node = n.parent.clone();
            }
        }

        // Process outermost first.
        for elt in while_rules.into_iter().rev() {
            let Rule::BeginWhile(rule) = self.grammar.get_rule(elt.rule_id) else {
                unreachable!("collected only begin/while rules");
            };
            let while_src = if rule.while_has_back_references {
                RegExpSource::new(
                    elt.end_rule.as_deref().unwrap_or(NEVER_MATCH),
                    super::rule::WHILE_RULE,
                )
            } else {
                rule.while_src.clone()
            };
            let allow_a = is_first_line;
            let allow_g = line_pos as i32 == anchor_position;
            let source = while_src.resolve_anchors(allow_a, allow_g);
            let scanner = cached_scanner(&[source]);
            match scanner.find_next_match(text, line_pos) {
                None => {
                    stack = elt.pop();
                    break;
                }
                Some(m) => {
                    let (cs, ce) = m.captures[0].expect("whole match present");
                    self.produce(tokens, &elt, cs);
                    self.handle_captures(
                        text,
                        is_first_line,
                        &elt,
                        tokens,
                        &rule.while_captures,
                        &m.captures,
                    );
                    self.produce(tokens, &elt, ce);
                    anchor_position = ce as i32;
                    if ce > line_pos {
                        line_pos = ce;
                        is_first_line = false;
                    }
                }
            }
        }

        (stack, line_pos, is_first_line, anchor_position)
    }

    /// `_handleCaptures` — apply per-group capture rules, producing nested scope
    /// spans (and re-tokenizing captures that carry their own patterns).
    fn handle_captures(
        &self,
        text: &str,
        is_first_line: bool,
        stack: &Rc<StateStack>,
        tokens: &mut LineTokens,
        capture_rules: &[Option<CaptureRule>],
        capture_indices: &[Option<(usize, usize)>],
    ) {
        if capture_rules.is_empty() {
            return;
        }
        let len = capture_rules.len().min(capture_indices.len());
        let max_end = capture_indices[0].expect("whole match present").1;

        // (scopes, endPos) local stack of open capture scopes.
        let mut local_stack: Vec<(Rc<AttributedScopeStack>, usize)> = Vec::new();

        for t in 0..len {
            let Some(cap_rule) = &capture_rules[t] else {
                continue;
            };
            let (p_start, p_end) = match capture_indices[t] {
                Some((s, e)) if e > s => (s, e),
                _ => continue, // non-participating or zero-length
            };
            if p_start > max_end {
                break;
            }

            // Close capture scopes that end at/before this capture's start.
            while let Some((scopes, end_pos)) = local_stack.last().cloned() {
                if end_pos <= p_start {
                    self.produce_from_scopes(tokens, &scopes, end_pos);
                    local_stack.pop();
                } else {
                    break;
                }
            }

            // Emit up to this capture's start.
            if let Some((scopes, _)) = local_stack.last().cloned() {
                self.produce_from_scopes(tokens, &scopes, p_start);
            } else {
                self.produce(tokens, stack, p_start);
            }

            if cap_rule.retokenize_rule_id != 0 {
                // Re-tokenize the captured text with the capture's own patterns.
                let name = cap_rule.get_name(Some(text), Some(capture_indices));
                let name_scopes = AttributedScopeStack::push_attributed(
                    &stack.content_name_scopes_list,
                    name.as_deref(),
                    self.theme,
                );
                let content_name = cap_rule.get_content_name(Some(text), Some(capture_indices));
                let content_scopes = AttributedScopeStack::push_attributed(
                    &name_scopes,
                    content_name.as_deref(),
                    self.theme,
                );
                let sub_stack = stack.push(
                    cap_rule.retokenize_rule_id,
                    p_start as i32,
                    -1,
                    false,
                    None,
                    name_scopes,
                    content_scopes,
                );
                let sub_text = &text[..p_end];
                self.tokenize_string(
                    sub_text,
                    is_first_line && p_start == 0,
                    p_start,
                    sub_stack,
                    tokens,
                    false,
                );
                continue;
            }

            if let Some(name) = cap_rule.get_name(Some(text), Some(capture_indices)) {
                let base = local_stack
                    .last()
                    .map(|(s, _)| s.clone())
                    .unwrap_or_else(|| stack.content_name_scopes_list.clone());
                let pushed = AttributedScopeStack::push_attributed(&base, Some(&name), self.theme);
                local_stack.push((pushed, p_end));
            }
        }

        while let Some((scopes, end_pos)) = local_stack.last().cloned() {
            self.produce_from_scopes(tokens, &scopes, end_pos);
            local_stack.pop();
        }
    }
}

// ---------------------------------------------------------------------------
// Public entry — highlight.
// ---------------------------------------------------------------------------

/// Tokenize + style `code` with `grammar` under `theme`, returning the styled
/// lines that match `syntax0`'s `highlight(...).lines`. Mirrors
/// `tokenizer.ts::tokenize`: split on `\r?\n|\r`, thread the state stack across
/// lines, feed each line's `tokenizeLine2` output through
/// [`crate::reshape::styled_lines`] with the theme color map.
pub fn highlight(code: &str, grammar: &Grammar, theme: &Theme) -> Vec<Vec<StyledToken>> {
    let tok = Tokenizer { grammar, theme };
    let lines = split_lines(code);

    let mut per_line_tokens: Vec<Vec<u32>> = Vec::with_capacity(lines.len());
    let mut stack: Option<Rc<StateStack>> = None;
    for line in &lines {
        let (binary, next) = tok.tokenize_line2(line, stack.take());
        per_line_tokens.push(binary);
        stack = Some(next);
    }

    let line_refs: Vec<&str> = lines.iter().map(String::as_str).collect();
    styled_lines(&line_refs, &per_line_tokens, theme.color_map())
}

/// Coerce JS-truthy grammar fields that some `tm-grammars` JSONs encode as
/// numbers (e.g. shellscript's `"applyEndPatternLast": 1`) into the booleans the
/// raw model expects. Recurses through objects and arrays.
pub(crate) fn normalize_grammar_json(value: &mut serde_json::Value) {
    match value {
        serde_json::Value::Object(map) => {
            if let Some(v @ serde_json::Value::Number(_)) = map.get_mut("applyEndPatternLast") {
                let truthy = v.as_i64().map(|n| n != 0).unwrap_or(true);
                *v = serde_json::Value::Bool(truthy);
            }
            for (_, child) in map.iter_mut() {
                normalize_grammar_json(child);
            }
        }
        serde_json::Value::Array(items) => {
            for item in items.iter_mut() {
                normalize_grammar_json(item);
            }
        }
        _ => {}
    }
}

/// Split like `code.split(/\r?\n|\r/g)`: on `\r\n`, `\n`, or a bare `\r`.
fn split_lines(code: &str) -> Vec<String> {
    let mut lines = Vec::new();
    let bytes = code.as_bytes();
    let mut start = 0usize;
    let mut i = 0usize;
    while i < bytes.len() {
        match bytes[i] {
            b'\n' => {
                lines.push(code[start..i].to_string());
                i += 1;
                start = i;
            }
            b'\r' => {
                lines.push(code[start..i].to_string());
                if i + 1 < bytes.len() && bytes[i + 1] == b'\n' {
                    i += 2;
                } else {
                    i += 1;
                }
                start = i;
            }
            _ => i += 1,
        }
    }
    lines.push(code[start..].to_string());
    lines
}
