//! Theme subsystem — a faithful port of how syntax0 (`@code-hike/lighter` /
//! vscode-textmate) turns a VS Code theme JSON into (a) a scope-stack → style
//! resolver and (b) the `ColorMap` `colors` array downstream code indexes by
//! foreground id.
//!
//! Ports `syntax0-highlight/src/{theme,theme-colors}.ts` (the `toFinalTheme`
//! normalization + color table) plus the core theme engine from the bundled
//! `vscode-textmate/index.js` (classes `z` Theme, `Y`/`V` trie, `X` ColorMap,
//! `U` ScopeStack, `Q`/`H` style + parsed rules). Style resolution reuses
//! `crate::encode::{StyleAttributes, FontStyle}` — the bit layout is NOT
//! redefined here.
//!
//! Public surface:
//! - [`Theme::from_vscode_json`] — parsed VS Code theme object → `Theme`.
//! - [`Theme::match_scopes`] — a scope stack (outermost..innermost) →
//!   [`StyleAttributes`] (`themeMatch`).
//! - [`Theme::color_map`] — the `colors` array, index-aligned with fg/bg ids.
//! - [`Theme::defaults`] / [`Theme::get_all_theme_colors`].

mod colormap;
mod defaults;
mod model;
mod trie;
mod vscode;

#[cfg(test)]
mod tests;

use crate::encode::{FontStyle, StyleAttributes};

use colormap::{remap_color_names, ColorMap};
use defaults::{get_color, get_color_scheme};
use model::{matches_scope, parse_theme, strarrcmp, strcmp, FinalTheme, ParsedThemeRule};
use trie::{ThemeTrieElement, ThemeTrieElementRule};

/// A resolved theme: the color map, the global default style, the scope-matching
/// trie, and the normalized `FinalTheme` (kept for CSS-variable extraction).
pub struct Theme {
    color_map: Vec<String>,
    defaults: StyleAttributes,
    root: ThemeTrieElement,
    final_theme: FinalTheme,
}

/// A scope stack (`ScopeStack`, class `U`): innermost `scope_name` + a `parent`
/// chain running outward. Built from a `[outermost, …, innermost]` slice.
struct ScopeStack {
    parent: Option<Box<ScopeStack>>,
    scope_name: String,
}

impl ScopeStack {
    /// `ScopeStack.from(...scopes)`: first element becomes the outermost node,
    /// last becomes the innermost (the returned node's `scope_name`). The slice
    /// must be non-empty.
    fn from_slice(scopes: &[&str]) -> ScopeStack {
        let mut node: Option<Box<ScopeStack>> = None;
        for &s in scopes {
            node = Some(Box::new(ScopeStack {
                parent: node,
                scope_name: s.to_string(),
            }));
        }
        *node.expect("from_slice requires a non-empty scope path")
    }
}

impl Theme {
    /// Build a theme from a parsed VS Code theme object (`{name,type,colors,
    /// tokenColors}` or a `from-css` variant). Panics on structurally invalid
    /// JSON (e.g. a non-string color value).
    pub fn from_vscode_json(raw: &serde_json::Value) -> Theme {
        let raw_theme: model::RawTheme =
            serde_json::from_value(raw.clone()).expect("valid VS Code theme JSON");
        let final_theme = vscode::to_final_theme(&raw_theme);
        Theme::from_final(final_theme)
    }

    /// Build a theme from an already-normalized [`FinalTheme`]. This is the
    /// `Theme.createFromRawTheme` → `createFromParsedTheme` path.
    fn from_final(final_theme: FinalTheme) -> Theme {
        let parsed = parse_theme(&final_theme.settings);
        let (color_map_obj, defaults, root) = create_from_parsed(parsed);

        let raw_color_map = color_map_obj.get_color_map();
        let color_map = match &final_theme.color_names {
            Some(names) => remap_color_names(raw_color_map, names),
            None => raw_color_map,
        };

        Theme {
            color_map,
            defaults,
            root,
            final_theme,
        }
    }

    /// Resolve a scope stack (`[outermost, …, innermost]`) to a [`StyleAttributes`]
    /// — vscode's `Theme.match`. An empty path returns the theme defaults
    /// (`themeMatch(null)`), the source of the default text color.
    ///
    /// Returns the innermost scope's rule (with parent-scope selectors evaluated
    /// against the stack). It does NOT cascade fg/bg across the stack — that
    /// merge (`mergeAttributes`) is the tokenizer's job, done per stack prefix.
    pub fn match_scopes(&self, scope_path: &[&str]) -> StyleAttributes {
        if scope_path.is_empty() {
            return self.defaults;
        }
        let stack = ScopeStack::from_slice(scope_path);
        self.match_stack(Some(&stack)).unwrap_or(self.defaults)
    }

    /// The color map (`getColorMap`): index-aligned with fg/bg ids so
    /// `color_map()[attrs.foreground_id]` is the hex string `getStyle` returns.
    /// Index 0 is the reserved empty placeholder.
    pub fn color_map(&self) -> &[String] {
        &self.color_map
    }

    /// The theme's default style (`getDefaults`) — global fontStyle + the fg/bg
    /// ids the tokenizer seeds a line with before any scope is pushed.
    pub fn defaults(&self) -> StyleAttributes {
        self.defaults
    }

    /// `Theme.match` for a built scope stack. Always resolves for a non-empty
    /// stack (the root's main rule matches any scope), so this returns `None`
    /// only defensively.
    fn match_stack(&self, stack: Option<&ScopeStack>) -> Option<StyleAttributes> {
        let stack = stack?;
        let rules = self.root.match_scope(&stack.scope_name);
        let found = rules
            .into_iter()
            .find(|rule| scope_path_matches_parent(stack.parent.as_deref(), &rule.parent_scopes))?;
        Some(StyleAttributes {
            font_style: FontStyle(found.font_style),
            foreground_id: found.foreground,
            background_id: found.background,
        })
    }

    /// `getAllThemeColors` / `getThemeColors`: the editor/UI color palette used
    /// for CSS variables. Returned as JSON so the shape mirrors the upstream
    /// object exactly (missing colors → `null`, i.e. JS `undefined`).
    pub fn get_all_theme_colors(&self) -> serde_json::Value {
        let c = |key: &str| self.theme_color(key);
        serde_json::json!({
            "colorScheme": c("colorScheme"),
            "foreground": c("foreground"),
            "background": c("background"),
            "lighter": { "inlineBackground": c("lighter.inlineBackground") },
            "editor": {
                "background": c("editor.background"),
                "foreground": c("editor.foreground"),
                "lineHighlightBackground": c("editor.lineHighlightBackground"),
                "rangeHighlightBackground": c("editor.rangeHighlightBackground"),
                "infoForeground": c("editor.infoForeground"),
                "selectionBackground": c("editor.selectionBackground"),
            },
            "focusBorder": c("focusBorder"),
            "tab": {
                "activeBackground": c("tab.activeBackground"),
                "activeForeground": c("tab.activeForeground"),
                "inactiveBackground": c("tab.inactiveBackground"),
                "inactiveForeground": c("tab.inactiveForeground"),
                "border": c("tab.border"),
                "activeBorder": c("tab.activeBorder"),
                "activeBorderTop": c("tab.activeBorderTop"),
            },
            "editorGroup": { "border": c("editorGroup.border") },
            "editorGroupHeader": { "tabsBackground": c("editorGroupHeader.tabsBackground") },
            "editorLineNumber": { "foreground": c("editorLineNumber.foreground") },
            "input": {
                "background": c("input.background"),
                "foreground": c("input.foreground"),
                "border": c("input.border"),
            },
            "icon": { "foreground": c("icon.foreground") },
            "sideBar": {
                "background": c("sideBar.background"),
                "foreground": c("sideBar.foreground"),
                "border": c("sideBar.border"),
            },
            "list": {
                "activeSelectionBackground": c("list.activeSelectionBackground"),
                "activeSelectionForeground": c("list.activeSelectionForeground"),
                "hoverBackground": c("list.hoverBackground"),
                "hoverForeground": c("list.hoverForeground"),
            },
        })
    }

    fn theme_color(&self, key: &str) -> serde_json::Value {
        let resolved = match key {
            "colorScheme" => Some(get_color_scheme(&self.final_theme)),
            "foreground" => Some(self.final_theme.foreground.clone()),
            "background" => Some(self.final_theme.background.clone()),
            _ => get_color(&self.final_theme, key),
        };
        match resolved {
            Some(s) => serde_json::Value::String(s),
            None => serde_json::Value::Null,
        }
    }
}

/// The inner matcher of `Theme.match`: does `rule.parent_scopes` match the scope
/// stack's ancestry? `None` (no parent selectors) always matches; otherwise each
/// selector must be found, in order, walking outward from `parent`.
fn scope_path_matches_parent(mut node: Option<&ScopeStack>, parents: &Option<Vec<String>>) -> bool {
    let parents = match parents {
        None => return true,
        Some(p) => p,
    };
    // vscode indexes `t[0]` unconditionally; parent scopes are never empty in
    // practice, but guard so a degenerate rule can't panic (and can't match).
    if parents.is_empty() {
        return false;
    }
    let mut idx = 0usize;
    while let Some(n) = node {
        if matches_scope(&n.scope_name, &parents[idx]) {
            idx += 1;
            if idx == parents.len() {
                return true;
            }
        }
        node = n.parent.as_deref();
    }
    false
}

/// `createFromParsedTheme`: sort the parsed rules, fold the empty-scope rules
/// into the global default, then intern colors (default fg/bg first, then each
/// rule's fg-before-bg in sorted order) while inserting into the trie.
///
/// The color-interning order here is load-bearing — it must match vscode's
/// `ColorMap.getId` call order exactly.
fn create_from_parsed(
    mut rules: Vec<ParsedThemeRule>,
) -> (ColorMap, StyleAttributes, ThemeTrieElement) {
    rules.sort_by(|a, b| {
        let c = strcmp(&a.scope, &b.scope);
        if c != std::cmp::Ordering::Equal {
            return c;
        }
        let c = strarrcmp(&a.parent_scopes, &b.parent_scopes);
        if c != std::cmp::Ordering::Equal {
            return c;
        }
        a.index.cmp(&b.index)
    });

    // Fold leading empty-scope rules into the defaults.
    let mut font_style = 0i32;
    let mut foreground = "#000000".to_string();
    let mut background = "#ffffff".to_string();
    let mut skip = 0usize;
    while skip < rules.len() && rules[skip].scope.is_empty() {
        let r = &rules[skip];
        if r.font_style != -1 {
            font_style = r.font_style;
        }
        if let Some(fg) = &r.foreground {
            foreground = fg.clone();
        }
        if let Some(bg) = &r.background {
            background = bg.clone();
        }
        skip += 1;
    }

    let mut color_map = ColorMap::new();
    let default_fg = color_map.get_id(Some(&foreground));
    let default_bg = color_map.get_id(Some(&background));
    let theme_defaults = StyleAttributes {
        font_style: FontStyle(font_style),
        foreground_id: default_fg,
        background_id: default_bg,
    };

    let mut root = ThemeTrieElement::new(ThemeTrieElementRule::new(0, None, -1, 0, 0));
    for rule in &rules[skip..] {
        // Left-to-right argument evaluation: fg is interned before bg.
        let fg = color_map.get_id(rule.foreground.as_deref());
        let bg = color_map.get_id(rule.background.as_deref());
        root.insert(
            0,
            &rule.scope,
            rule.parent_scopes.clone(),
            rule.font_style,
            fg,
            bg,
        );
    }

    (color_map, theme_defaults, root)
}
