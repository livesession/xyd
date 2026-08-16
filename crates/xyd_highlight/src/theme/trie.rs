//! The theme trie: `ThemeTrieElement` (class `Y`) + `ThemeTrieElementRule`
//! (class `V`). Rules are inserted scope-segment by scope-segment; each node
//! carries a `main_rule` (parent-less rule for that scope path) and
//! `rules_with_parent_scopes` (rules gated on ancestor selectors). Matching a
//! scope walks the trie and returns the node's rules sorted by specificity.

use std::cmp::Ordering;
use std::collections::HashMap;

use super::model::strarrcmp;

/// A resolved rule at a trie node (`V`). `font_style` is `-1` when unset; color
/// ids `0` mean "inherit". `scope_depth` and `parent_scopes` drive specificity.
#[derive(Debug, Clone)]
pub(crate) struct ThemeTrieElementRule {
    pub scope_depth: i32,
    pub parent_scopes: Option<Vec<String>>,
    pub font_style: i32,
    pub foreground: u32,
    pub background: u32,
}

impl ThemeTrieElementRule {
    pub(crate) fn new(
        scope_depth: i32,
        parent_scopes: Option<Vec<String>>,
        font_style: i32,
        foreground: u32,
        background: u32,
    ) -> Self {
        Self {
            scope_depth,
            parent_scopes,
            font_style,
            foreground,
            background,
        }
    }

    /// `acceptOverwrite`: bump `scope_depth` (never lower it) and overwrite each
    /// style field only when the incoming value is "set" (`fontStyle != -1`,
    /// color id `!= 0`).
    fn accept_overwrite(
        &mut self,
        scope_depth: i32,
        font_style: i32,
        foreground: u32,
        background: u32,
    ) {
        if self.scope_depth <= scope_depth {
            self.scope_depth = scope_depth;
        }
        if font_style != -1 {
            self.font_style = font_style;
        }
        if foreground != 0 {
            self.foreground = foreground;
        }
        if background != 0 {
            self.background = background;
        }
    }
}

/// A trie node (`Y`). `children` is keyed by the next scope segment.
#[derive(Debug, Clone)]
pub(crate) struct ThemeTrieElement {
    main_rule: ThemeTrieElementRule,
    rules_with_parent_scopes: Vec<ThemeTrieElementRule>,
    children: HashMap<String, ThemeTrieElement>,
}

impl ThemeTrieElement {
    pub(crate) fn new(main_rule: ThemeTrieElementRule) -> Self {
        Self {
            main_rule,
            rules_with_parent_scopes: Vec::new(),
            children: HashMap::new(),
        }
    }

    fn new_with(
        main_rule: ThemeTrieElementRule,
        rules_with_parent_scopes: Vec<ThemeTrieElementRule>,
    ) -> Self {
        Self {
            main_rule,
            rules_with_parent_scopes,
            children: HashMap::new(),
        }
    }

    /// `insert(scopeDepth, scope, parentScopes, fontStyle, fg, bg)`: descend the
    /// trie by scope segments (cloning the current node's rules into freshly
    /// created children so within-path inheritance is captured), then insert the
    /// rule at the leaf node.
    pub(crate) fn insert(
        &mut self,
        scope_depth: i32,
        scope: &str,
        parent_scopes: Option<Vec<String>>,
        font_style: i32,
        foreground: u32,
        background: u32,
    ) {
        if scope.is_empty() {
            self.do_insert_here(
                scope_depth,
                parent_scopes,
                font_style,
                foreground,
                background,
            );
            return;
        }

        let (head, tail) = match scope.find('.') {
            Some(idx) => (&scope[..idx], &scope[idx + 1..]),
            None => (scope, ""),
        };

        if !self.children.contains_key(head) {
            let child = ThemeTrieElement::new_with(
                self.main_rule.clone(),
                self.rules_with_parent_scopes.clone(),
            );
            self.children.insert(head.to_string(), child);
        }
        let child = self.children.get_mut(head).expect("child just ensured");
        child.insert(
            scope_depth + 1,
            tail,
            parent_scopes,
            font_style,
            foreground,
            background,
        );
    }

    fn do_insert_here(
        &mut self,
        scope_depth: i32,
        parent_scopes: Option<Vec<String>>,
        mut font_style: i32,
        mut foreground: u32,
        mut background: u32,
    ) {
        match parent_scopes {
            Some(parents) => {
                // If a rule with identical parent scopes already exists, merge.
                for rule in &mut self.rules_with_parent_scopes {
                    if strarrcmp(&rule.parent_scopes, &Some(parents.clone())) == Ordering::Equal {
                        rule.accept_overwrite(scope_depth, font_style, foreground, background);
                        return;
                    }
                }
                // Otherwise inherit unset fields from the node's main rule.
                if font_style == -1 {
                    font_style = self.main_rule.font_style;
                }
                if foreground == 0 {
                    foreground = self.main_rule.foreground;
                }
                if background == 0 {
                    background = self.main_rule.background;
                }
                self.rules_with_parent_scopes
                    .push(ThemeTrieElementRule::new(
                        scope_depth,
                        Some(parents),
                        font_style,
                        foreground,
                        background,
                    ));
            }
            None => {
                self.main_rule
                    .accept_overwrite(scope_depth, font_style, foreground, background);
            }
        }
    }

    /// `match(scope)`: descend by scope segments; at the deepest reachable node
    /// return `[main_rule, ...rules_with_parent_scopes]` sorted by specificity.
    pub(crate) fn match_scope(&self, scope: &str) -> Vec<ThemeTrieElementRule> {
        if scope.is_empty() {
            return Self::sort_by_specificity(self.collect_rules());
        }
        let (head, tail) = match scope.find('.') {
            Some(idx) => (&scope[..idx], &scope[idx + 1..]),
            None => (scope, ""),
        };
        match self.children.get(head) {
            Some(child) => child.match_scope(tail),
            None => Self::sort_by_specificity(self.collect_rules()),
        }
    }

    fn collect_rules(&self) -> Vec<ThemeTrieElementRule> {
        let mut rules = Vec::with_capacity(1 + self.rules_with_parent_scopes.len());
        rules.push(self.main_rule.clone());
        rules.extend(self.rules_with_parent_scopes.iter().cloned());
        rules
    }

    fn sort_by_specificity(mut rules: Vec<ThemeTrieElementRule>) -> Vec<ThemeTrieElementRule> {
        if rules.len() == 1 {
            return rules;
        }
        // Stable sort — matches JS `Array.sort` so equal-specificity rules keep
        // their (parse-order) insertion order.
        rules.sort_by(Self::cmp_by_specificity);
        rules
    }

    /// `_cmpBySpecificity`: deeper scope first; then more parent scopes first;
    /// then, per parent selector, the longer (more specific) selector first.
    fn cmp_by_specificity(a: &ThemeTrieElementRule, b: &ThemeTrieElementRule) -> Ordering {
        if a.scope_depth == b.scope_depth {
            let r = a.parent_scopes.as_ref().map_or(0, Vec::len);
            let i = b.parent_scopes.as_ref().map_or(0, Vec::len);
            if r == i {
                for idx in 0..r {
                    let a_len = a.parent_scopes.as_ref().expect("len r > 0")[idx].len();
                    let b_len = b.parent_scopes.as_ref().expect("len i > 0")[idx].len();
                    if a_len != b_len {
                        // JS `return r2 - t2` (b's len − a's len): longer a first.
                        return b_len.cmp(&a_len);
                    }
                }
            }
            // JS `return i - r`: more parent scopes (larger r) first.
            return i.cmp(&r);
        }
        // JS `return t.scopeDepth - e.scopeDepth`: larger depth first.
        b.scope_depth.cmp(&a.scope_depth)
    }
}
