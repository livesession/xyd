//! Tests for the theme port: ColorMap id ordering, scope-selector specificity +
//! parent-scope matching, fontStyle bit resolution, `from-css` normalization,
//! `getColor`/`transparent` chains, and the github-dark / dark-plus color
//! cross-checks against the syntax0 snapshot oracle.

use super::defaults::transparent;
use super::model::{is_valid_hex, matches_scope, strarrcmp, strcmp};
use super::Theme;

use serde_json::json;
use std::cmp::Ordering;

/// Convenience: resolve a scope stack to its hex color via the color map.
fn fg(theme: &Theme, scopes: &[&str]) -> String {
    let attrs = theme.match_scopes(scopes);
    theme.color_map()[attrs.foreground_id as usize].clone()
}

fn color_map_vec(theme: &Theme) -> Vec<&str> {
    theme.color_map().iter().map(String::as_str).collect()
}

// ---------------------------------------------------------------------------
// ColorMap id ordering (the make-or-break detail)
// ---------------------------------------------------------------------------

#[test]
fn colormap_id_ordering_is_exact() {
    // No global setting → an implicit one is prepended from editor fg/bg, so the
    // default fg (#AABBCC) is interned first (id 1), then the default bg (id 2),
    // then each sorted rule's fg-before-bg. Scopes sort "" < comment < keyword
    // < string; the two #ff0000 foregrounds share one id (dedup on first-seen).
    let raw = json!({
        "name": "syn",
        "type": "dark",
        "colors": { "editor.foreground": "#AABBCC", "editor.background": "#112233" },
        "tokenColors": [
            { "scope": "keyword", "settings": { "foreground": "#ff0000" } },
            { "scope": "comment", "settings": { "foreground": "#00ff00", "background": "#000011" } },
            { "scope": "string",  "settings": { "foreground": "#ff0000" } }
        ]
    });
    let theme = Theme::from_vscode_json(&raw);

    assert_eq!(
        color_map_vec(&theme),
        vec![
            "",        // id 0 — reserved empty placeholder
            "#AABBCC", // id 1 — default foreground
            "#112233", // id 2 — default background
            "#00FF00", // id 3 — comment fg (first sorted rule)
            "#000011", // id 4 — comment bg
            "#FF0000", // id 5 — keyword fg (string reuses this id)
        ]
    );

    let keyword = theme.match_scopes(&["keyword"]);
    assert_eq!(keyword.foreground_id, 5);
    assert_eq!(keyword.background_id, 0); // unset → inherit

    let comment = theme.match_scopes(&["comment"]);
    assert_eq!(comment.foreground_id, 3);
    assert_eq!(comment.background_id, 4);

    let string = theme.match_scopes(&["string"]);
    assert_eq!(string.foreground_id, 5); // deduped with keyword

    let default = theme.match_scopes(&[]);
    assert_eq!(default.foreground_id, 1);
    assert_eq!(default.background_id, 2);
    assert_eq!(fg(&theme, &[]), "#AABBCC");

    // Within-path inheritance: keyword.control has no rule → inherits keyword.
    assert_eq!(theme.match_scopes(&["keyword.control"]).foreground_id, 5);
}

// ---------------------------------------------------------------------------
// fontStyle bit resolution
// ---------------------------------------------------------------------------

#[test]
fn font_style_bits_resolve() {
    let raw = json!({
        "name": "fs",
        "type": "dark",
        "colors": { "editor.foreground": "#ffffff", "editor.background": "#000000" },
        "tokenColors": [
            { "scope": "keyword",  "settings": { "fontStyle": "bold italic", "foreground": "#111111" } },
            { "scope": "comment",  "settings": { "fontStyle": "underline strikethrough" } },
            { "scope": "variable", "settings": { "foreground": "#222222" } }
        ]
    });
    let theme = Theme::from_vscode_json(&raw);

    // italic(1) | bold(2) = 3
    assert_eq!(theme.match_scopes(&["keyword"]).font_style.0, 3);
    // underline(4) | strikethrough(8) = 12
    assert_eq!(theme.match_scopes(&["comment"]).font_style.0, 12);
    // no fontStyle → NotSet (-1), i.e. inherit
    assert_eq!(theme.match_scopes(&["variable"]).font_style.0, -1);
    // defaults have fontStyle None(0), not NotSet
    assert_eq!(theme.defaults().font_style.0, 0);
}

// ---------------------------------------------------------------------------
// Scope-selector specificity + parent-scope matching
// ---------------------------------------------------------------------------

#[test]
fn parent_scope_selectors_match() {
    let raw = json!({
        "name": "sp",
        "type": "dark",
        "colors": { "editor.foreground": "#ffffff", "editor.background": "#000000" },
        "tokenColors": [
            { "scope": "variable",          "settings": { "foreground": "#111111" } },
            { "scope": "meta.foo variable", "settings": { "foreground": "#222222" } }
        ]
    });
    let theme = Theme::from_vscode_json(&raw);

    // Unrelated ancestor → the plain rule.
    assert_eq!(fg(&theme, &["source", "variable"]), "#111111");
    // Direct ancestor match → the parent-scoped rule.
    assert_eq!(fg(&theme, &["meta.foo", "variable"]), "#222222");
    // Ancestor selector matches a prefix (meta.foo matches meta.foo.bar).
    assert_eq!(fg(&theme, &["meta.foo.bar", "variable"]), "#222222");
    // Ancestor can be non-adjacent — the whole parent chain is walked.
    assert_eq!(fg(&theme, &["meta.foo", "other", "variable"]), "#222222");
    // But a prefix must be followed by '.', not more letters.
    assert_eq!(fg(&theme, &["meta.foobar", "variable"]), "#111111");
}

#[test]
fn more_specific_parent_selector_wins() {
    // Both "meta …" and "meta.foo …" match a "meta.foo" ancestor; the longer
    // (more specific) parent selector must win.
    let raw = json!({
        "name": "spec",
        "type": "dark",
        "colors": { "editor.foreground": "#ffffff", "editor.background": "#000000" },
        "tokenColors": [
            { "scope": "meta variable",     "settings": { "foreground": "#111111" } },
            { "scope": "meta.foo variable", "settings": { "foreground": "#222222" } }
        ]
    });
    let theme = Theme::from_vscode_json(&raw);

    assert_eq!(fg(&theme, &["meta.foo", "variable"]), "#222222"); // more specific
    assert_eq!(fg(&theme, &["meta.bar", "variable"]), "#111111"); // only "meta" matches
}

#[test]
fn later_rule_on_same_scope_overwrites() {
    // Two parent-less rules on the same scope: the one from the later setting
    // (higher index) wins via acceptOverwrite. Mirrors dark-plus keyword.control.
    let raw = json!({
        "name": "ov",
        "type": "dark",
        "colors": { "editor.foreground": "#ffffff", "editor.background": "#000000" },
        "tokenColors": [
            { "scope": "keyword.control", "settings": { "foreground": "#569cd6" } },
            { "scope": "keyword.control", "settings": { "foreground": "#c586c0" } }
        ]
    });
    let theme = Theme::from_vscode_json(&raw);
    assert_eq!(fg(&theme, &["keyword.control"]), "#C586C0");
}

// ---------------------------------------------------------------------------
// from-css normalization + color-name remap
// ---------------------------------------------------------------------------

#[test]
fn from_css_colors_remap_back_to_vars() {
    let raw = json!({
        "name": "fc",
        "type": "from-css",
        "colors": { "editor.foreground": "var(--ch-4)", "editor.background": "var(--ch-16)" },
        "tokenColors": [
            { "settings": { "foreground": "var(--ch-4)", "background": "var(--ch-16)" } },
            { "scope": "keyword", "settings": { "foreground": "var(--ch-9)" } },
            { "scope": "comment", "settings": { "foreground": "var(--ch-7)", "fontStyle": "italic" } }
        ]
    });
    let theme = Theme::from_vscode_json(&raw);

    // The interned #00000N placeholders are mapped back to the original vars.
    assert_eq!(fg(&theme, &["keyword"]), "var(--ch-9)");
    assert_eq!(fg(&theme, &["comment"]), "var(--ch-7)");
    assert_eq!(theme.match_scopes(&["comment"]).font_style.0, 1);
    assert_eq!(fg(&theme, &[]), "var(--ch-4)");

    // colorScheme for from-css is the CSS variable.
    assert_eq!(
        theme.get_all_theme_colors()["colorScheme"],
        json!("var(--ch-0)")
    );
}

// ---------------------------------------------------------------------------
// getColor / transparent / defaults chains (empty-theme snapshot oracle)
// ---------------------------------------------------------------------------

#[test]
fn empty_theme_all_colors_match_oracle() {
    // Oracle: colors.test.ts.snap `get theme colors from empty theme`.
    let theme = Theme::from_vscode_json(&json!({}));
    let colors = theme.get_all_theme_colors();

    assert_eq!(colors["background"], json!("#1E1E1E"));
    assert_eq!(colors["foreground"], json!("#bbbbbb"));
    assert_eq!(colors["colorScheme"], json!("dark"));
    assert_eq!(colors["editor"]["foreground"], json!("#bbbbbb"));
    assert_eq!(colors["editor"]["infoForeground"], json!("#3794FF"));
    // transparent(editor.background, 0.9)
    assert_eq!(colors["lighter"]["inlineBackground"], json!("#1e1e1ee6"));
    // transparent(tab.activeForeground, 0.5)
    assert_eq!(colors["tab"]["inactiveForeground"], json!("#ffffff80"));
    // empty-object defaults → undefined (JSON null)
    assert_eq!(colors["editor"]["lineHighlightBackground"], json!(null));
    assert_eq!(colors["list"]["hoverForeground"], json!(null));
}

#[test]
fn transparent_matches_color_ts() {
    assert_eq!(transparent("#1E1E1E", 0.9).as_deref(), Some("#1e1e1ee6"));
    assert_eq!(transparent("#ffffff", 0.5).as_deref(), Some("#ffffff80"));
    assert_eq!(transparent("#000000", 1.0).as_deref(), Some("#000000ff"));
    assert_eq!(transparent("not-a-color", 0.5), None);
}

// ---------------------------------------------------------------------------
// github-dark cross-check (tokens.test.ts.snap oracle)
// ---------------------------------------------------------------------------

#[test]
fn github_dark_scope_colors() {
    let raw: serde_json::Value =
        serde_json::from_str(include_str!("fixtures/github-dark.json")).unwrap();
    let theme = Theme::from_vscode_json(&raw);

    assert_eq!(fg(&theme, &["keyword"]), "#FF7B72");
    assert_eq!(fg(&theme, &["keyword.control"]), "#FF7B72"); // inherits keyword
    assert_eq!(fg(&theme, &["entity.name.function"]), "#D2A8FF");
    assert_eq!(fg(&theme, &["entity.name"]), "#FFA657");
    assert_eq!(fg(&theme, &["comment"]), "#8B949E");
    assert_eq!(fg(&theme, &["comment.line"]), "#8B949E"); // inherits comment
    assert_eq!(fg(&theme, &["string"]), "#A5D6FF");
    // bare default = editor.foreground
    assert_eq!(fg(&theme, &[]), "#C9D1D9");
}

#[test]
fn github_dark_ui_colors_match_oracle() {
    // Oracle: colors.test.ts.snap `get theme colors from theme name` (github-dark).
    let raw: serde_json::Value =
        serde_json::from_str(include_str!("fixtures/github-dark.json")).unwrap();
    let theme = Theme::from_vscode_json(&raw);
    let colors = theme.get_all_theme_colors();

    assert_eq!(colors["background"], json!("#0d1117"));
    assert_eq!(colors["foreground"], json!("#c9d1d9"));
    assert_eq!(colors["colorScheme"], json!("dark"));
    assert_eq!(colors["editor"]["foreground"], json!("#c9d1d9"));
    assert_eq!(colors["editor"]["background"], json!("#0d1117"));
    assert_eq!(colors["editor"]["infoForeground"], json!("#3794FF")); // default fallback
    assert_eq!(
        colors["editor"]["lineHighlightBackground"],
        json!("#6e76811a")
    );
    assert_eq!(colors["focusBorder"], json!("#1f6feb"));
    assert_eq!(colors["icon"]["foreground"], json!("#8b949e"));
}

// ---------------------------------------------------------------------------
// dark-plus cross-check
// ---------------------------------------------------------------------------

#[test]
fn dark_plus_scope_colors() {
    let raw: serde_json::Value =
        serde_json::from_str(include_str!("fixtures/dark-plus.json")).unwrap();
    let theme = Theme::from_vscode_json(&raw);

    assert_eq!(fg(&theme, &["comment"]), "#6A9955");
    // keyword.control has two parent-less rules; the later setting wins.
    assert_eq!(fg(&theme, &["keyword.control"]), "#C586C0");
    assert_eq!(fg(&theme, &["entity.name.function"]), "#DCDCAA");
    assert_eq!(fg(&theme, &["string"]), "#CE9178");
    assert_eq!(fg(&theme, &["variable"]), "#9CDCFE");
    assert_eq!(fg(&theme, &["constant.numeric"]), "#B5CEA8");
    // dark-plus declares a global foreground.
    assert_eq!(fg(&theme, &[]), "#D4D4D4");
}

// ---------------------------------------------------------------------------
// Low-level helper predicates/comparators
// ---------------------------------------------------------------------------

#[test]
fn is_valid_hex_matches_upstream() {
    assert!(is_valid_hex("#abc"));
    assert!(is_valid_hex("#abcd"));
    assert!(is_valid_hex("#aabbcc"));
    assert!(is_valid_hex("#aabbccdd"));
    assert!(is_valid_hex("#FF7B72"));
    assert!(!is_valid_hex("#ab"));
    assert!(!is_valid_hex("#abcde")); // length 5 rejected
    assert!(!is_valid_hex("aabbcc")); // no '#'
    assert!(!is_valid_hex("#gggggg")); // non-hex
}

#[test]
fn matches_scope_is_prefix_dot_aware() {
    assert!(matches_scope("string", "string"));
    assert!(matches_scope("string.quoted", "string"));
    assert!(!matches_scope("strings", "string"));
    assert!(!matches_scope("string", "string.quoted"));
}

#[test]
fn comparators_order_like_js() {
    assert_eq!(strcmp("a", "b"), Ordering::Less);
    assert_eq!(strcmp("b", "a"), Ordering::Greater);
    assert_eq!(strcmp("a", "a"), Ordering::Equal);

    let none: Option<Vec<String>> = None;
    let a = Some(vec!["meta".to_string()]);
    let b = Some(vec!["source".to_string()]);
    let longer = Some(vec!["meta".to_string(), "x".to_string()]);

    assert_eq!(strarrcmp(&none, &none), Ordering::Equal);
    assert_eq!(strarrcmp(&none, &a), Ordering::Less); // null sorts first
    assert_eq!(strarrcmp(&a, &none), Ordering::Greater);
    assert_eq!(strarrcmp(&a, &b), Ordering::Less); // "meta" < "source"
    assert_eq!(strarrcmp(&a, &longer), Ordering::Less); // shorter first
}
