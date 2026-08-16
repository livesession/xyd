//! The grammar/theme registry — the runtime that resolves a language + theme to
//! a compiled grammar and styled output, backed by the embedded [`crate::store`].
//!
//! Mirrors `@syntax0/highlight`'s file-system loader (`highlighter.ts` +
//! `grammars.ts` + `language.ts`): a language alias resolves to a scope, the
//! scope's grammar id resolves to a bundle, and the bundle's MAIN entry is the
//! grammar. Cross-grammar `source.x` includes resolve the same way — via the
//! `language-data` map to the referenced language's OWN bundle (NOT a bundle's
//! inlined embed copy), which is what keeps output byte-identical to the
//! reference engine's tm-grammars resolution.
//!
//! Compilation is registry-aware: [`Registry::grammar_for_scope`] first loads
//! the transitive include closure (BFS over external include scopes), then
//! compiles the whole set into one shared rule registry with injections
//! ([`Grammar::from_set`]).

use std::cell::RefCell;
use std::collections::{BTreeSet, HashMap};
use std::rc::Rc;

use crate::grammar::raw::{RawGrammar, RawRule};
use crate::grammar::rule::GrammarSet;
use crate::grammar::tokenizer::{highlight, normalize_grammar_json, Grammar};
use crate::reshape::StyledToken;
use crate::store;
use crate::theme::Theme;

/// Owns the lazily-decompressed grammar bundles, resolved per-scope grammars,
/// compiled grammars, and parsed themes. Cheap to construct; caches populate on
/// first use. Single-threaded (interior `RefCell`s) — one per worker.
#[derive(Default)]
pub struct Registry {
    /// Parsed grammar bundles by grammar id (decompressed + normalized).
    bundles: RefCell<HashMap<String, Rc<Vec<RawGrammar>>>>,
    /// The MAIN raw grammar per scope (canonical bundle entry for the scope).
    main_by_scope: RefCell<HashMap<String, Option<Rc<RawGrammar>>>>,
    /// Compiled grammars keyed by root scope.
    grammars: RefCell<HashMap<String, Rc<Grammar>>>,
    /// Parsed themes keyed by name.
    themes: RefCell<HashMap<String, Rc<Theme>>>,
}

impl Registry {
    pub fn new() -> Registry {
        Registry::default()
    }

    /// Highlight `code` for a language alias (`"js"`, `"bash"`, …) under a theme
    /// name (`"github-dark"`). Returns `None` if the language or theme is
    /// unknown / not embedded. This is the shape the napi layer (H4) calls.
    pub fn highlight_lang(
        &self,
        code: &str,
        lang: &str,
        theme_name: &str,
    ) -> Option<Vec<Vec<StyledToken>>> {
        let (grammar, _scope) = self.grammar_for_lang(lang)?;
        let theme = self.theme(theme_name)?;
        Some(highlight(code, &grammar, &theme))
    }

    /// Resolve a language alias to `(grammar, scope)` — `aliasToLangData` +
    /// grammar compilation.
    pub fn grammar_for_lang(&self, lang: &str) -> Option<(Rc<Grammar>, String)> {
        let scope = store::alias_to_scope(lang)?;
        let grammar = self.grammar_for_scope(scope)?;
        Some((grammar, scope.to_string()))
    }

    /// The compiled grammar rooted at `scope`, resolving cross-grammar includes
    /// + injections. Cached after first compile.
    pub fn grammar_for_scope(&self, scope: &str) -> Option<Rc<Grammar>> {
        if let Some(g) = self.grammars.borrow().get(scope) {
            return Some(g.clone());
        }
        let closure = self.build_closure(scope)?;
        let grammar = Rc::new(Grammar::from_set(scope, &closure));
        self.grammars
            .borrow_mut()
            .insert(scope.to_string(), grammar.clone());
        Some(grammar)
    }

    /// The parsed theme for a name. Cached after first parse.
    pub fn theme(&self, name: &str) -> Option<Rc<Theme>> {
        if let Some(t) = self.themes.borrow().get(name) {
            return Some(t.clone());
        }
        let json = store::theme_json(name)?;
        let value: serde_json::Value = serde_json::from_str(json).expect("valid theme JSON");
        let theme = Rc::new(Theme::from_vscode_json(&value));
        self.themes
            .borrow_mut()
            .insert(name.to_string(), theme.clone());
        Some(theme)
    }

    /// Build the transitive include closure for `top_scope`: a scope → main raw
    /// grammar map covering the root plus every grammar reachable through
    /// external `source.x` includes. Each entry is a fresh owned clone so its
    /// rules have distinct pointers (vscode `initGrammar` clones per external
    /// grammar; sharing would cross-contaminate `$self` memoization).
    fn build_closure(&self, top_scope: &str) -> Option<GrammarSet> {
        let mut map = GrammarSet::new();
        let mut queue = vec![top_scope.to_string()];
        while let Some(scope) = queue.pop() {
            if map.contains_key(&scope) {
                continue;
            }
            let Some(raw_rc) = self.main_raw(&scope) else {
                continue; // unresolvable external → inert (matches vscode)
            };
            let raw: RawGrammar = (*raw_rc).clone();
            let refs = collect_external_scopes(&raw);
            map.insert(scope, raw);
            for r in refs {
                if !map.contains_key(&r) {
                    queue.push(r);
                }
            }
        }
        // The root must have loaded, otherwise there's nothing to compile.
        if map.contains_key(top_scope) {
            Some(map)
        } else {
            None
        }
    }

    /// The MAIN raw grammar registered for `scope` — the canonical bundle entry
    /// (`scopeToLanguageData[scope].id` → bundle → the entry whose scopeName is
    /// `scope`, else the bundle's main `[0]`). Mirrors `loadGrammarByScope`.
    fn main_raw(&self, scope: &str) -> Option<Rc<RawGrammar>> {
        if let Some(cached) = self.main_by_scope.borrow().get(scope) {
            return cached.clone();
        }
        let resolved = (|| {
            let ld = store::scope_lang(scope)?;
            let bundle = self.bundle(&ld.id)?;
            let entry = bundle
                .iter()
                .find(|g| g.scope_name == scope)
                .or_else(|| bundle.first())?;
            Some(Rc::new(entry.clone()))
        })();
        self.main_by_scope
            .borrow_mut()
            .insert(scope.to_string(), resolved.clone());
        resolved
    }

    /// The parsed grammar bundle for a grammar id — decompress + normalize +
    /// parse (array of grammar objects; a bare object is wrapped). Cached.
    fn bundle(&self, id: &str) -> Option<Rc<Vec<RawGrammar>>> {
        if let Some(b) = self.bundles.borrow().get(id) {
            return Some(b.clone());
        }
        let bytes = store::grammar_bytes(id)?;
        let json = store::decompress(bytes);
        let mut value: serde_json::Value =
            serde_json::from_slice(&json).expect("valid grammar bundle JSON");
        normalize_grammar_json(&mut value);
        let grammars: Vec<RawGrammar> = match value {
            serde_json::Value::Array(_) => {
                serde_json::from_value(value).expect("valid grammar array")
            }
            object => vec![serde_json::from_value(object).expect("valid grammar object")],
        };
        let rc = Rc::new(grammars);
        self.bundles.borrow_mut().insert(id.to_string(), rc.clone());
        Some(rc)
    }
}

/// Collect every external `source.x` / `source.x#name` include scope referenced
/// anywhere in a grammar (patterns, repository, injections, and nested rules).
/// `$self` / `$base` / `#local` are not external.
fn collect_external_scopes(raw: &RawGrammar) -> Vec<String> {
    let mut set = BTreeSet::new();
    for p in &raw.patterns {
        walk_rule(p, &mut set);
    }
    for r in raw.repository.values() {
        walk_rule(r, &mut set);
    }
    for r in raw.injections.values() {
        walk_rule(r, &mut set);
    }
    set.into_iter().collect()
}

fn walk_rule(r: &RawRule, set: &mut BTreeSet<String>) {
    if let Some(inc) = &r.include {
        if inc != "$self" && inc != "$base" && !inc.starts_with('#') {
            let scope = inc.split('#').next().unwrap_or("");
            if !scope.is_empty() {
                set.insert(scope.to_string());
            }
        }
    }
    if let Some(ps) = &r.patterns {
        for p in ps {
            walk_rule(p, set);
        }
    }
    if let Some(repo) = &r.repository {
        for v in repo.values() {
            walk_rule(v, set);
        }
    }
    for caps in [
        &r.captures,
        &r.begin_captures,
        &r.end_captures,
        &r.while_captures,
    ]
    .into_iter()
    .flatten()
    {
        for v in caps.0.values() {
            walk_rule(v, set);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn highlights_a_self_contained_lang() {
        let reg = Registry::new();
        let lines = reg
            .highlight_lang("const x = 1;", "js", "github-dark")
            .expect("js/github-dark available");
        // First token is the `const` keyword in github-dark red.
        assert_eq!(lines[0][0].content, "const ");
        assert_eq!(lines[0][0].style.color.as_deref(), Some("#FF7B72"));
    }

    #[test]
    fn resolves_cross_grammar_closure_for_html() {
        let reg = Registry::new();
        // html embeds source.js + source.css — the closure must load them.
        assert!(reg.grammar_for_scope("text.html.basic").is_some());
    }
}
