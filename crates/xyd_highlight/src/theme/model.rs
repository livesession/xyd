//! Theme data model + the raw-theme rule parser.
//!
//! Ports the type shapes and the `parseTheme` step that vscode-textmate's
//! `Theme.createFromRawTheme` runs (bundled `index.js` class `z`,
//! `createFromRawTheme`), plus the tiny comparators/predicates it leans on:
//! `strcmp` (`p`), `strArrCmp` (`d`), `isValidHexColor` (`f`) and the
//! scope-prefix match `K`. Data types mirror `theme.ts`'s `RawTheme` /
//! `FinalTheme` / `ThemeSetting`.

use std::cmp::Ordering;
use std::collections::HashMap;

use serde::Deserialize;

/// A VS Code theme JSON as read from disk — `{name,type,colors,tokenColors}`
/// (or the legacy `settings` array). Unknown keys are ignored by serde.
#[derive(Debug, Clone, Default, Deserialize)]
pub(crate) struct RawTheme {
    pub name: Option<String>,
    #[serde(rename = "type")]
    pub ty: Option<String>,
    #[serde(rename = "tokenColors")]
    pub token_colors: Option<Vec<ThemeSetting>>,
    /// Legacy `.tmTheme`-style key; `theme.ts` reads `settings || tokenColors`.
    pub settings: Option<Vec<ThemeSetting>>,
    /// Values are kept as raw JSON: real VS Code themes allow array-valued keys
    /// (e.g. `symbolIcon.constantForeground`), which are dropped when we build
    /// the string-only `FinalTheme.colors` (those keys are never looked up).
    pub colors: Option<HashMap<String, serde_json::Value>>,
    #[serde(rename = "colorNames")]
    pub color_names: Option<HashMap<String, String>>,
}

/// One theme rule: a scope selector (string or array) + a settings body.
#[derive(Debug, Clone, Deserialize)]
pub(crate) struct ThemeSetting {
    #[allow(dead_code)]
    pub name: Option<String>,
    pub scope: Option<Scope>,
    /// `theme.ts` skips settings whose body is missing (`if (!i.settings)`).
    pub settings: Option<SettingBody>,
}

/// `scope` is either a comma-list string or an array of selectors.
#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub(crate) enum Scope {
    Str(String),
    Arr(Vec<String>),
}

/// The `{ fontStyle, foreground, background }` body of a theme rule.
#[derive(Debug, Clone, Default, Deserialize)]
pub(crate) struct SettingBody {
    #[serde(rename = "fontStyle")]
    pub font_style: Option<String>,
    pub foreground: Option<String>,
    pub background: Option<String>,
}

/// Normalized color scheme, from `getThemeType` (`theme.ts`). `hc` collapses to
/// `Dark` there, so only these three ever occur.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FinalType {
    Dark,
    Light,
    FromCss,
}

/// A `FinalTheme` (`theme.ts`): the raw theme after `toFinalTheme` normalization
/// — global fg/bg extracted, an implicit global setting prepended when absent,
/// and (for `from-css`) the `#00000N` `colorNames` remap applied.
#[derive(Debug, Clone)]
pub(crate) struct FinalTheme {
    #[allow(dead_code)]
    pub name: String,
    pub ty: FinalType,
    pub foreground: String,
    pub background: String,
    pub settings: Vec<ThemeSetting>,
    pub colors: HashMap<String, String>,
    /// Only set for `from-css` themes: original color → `#00000N` placeholder.
    pub color_names: Option<HashMap<String, String>>,
}

/// A parsed theme rule (`ParsedThemeRule`, class `H`): a single scope selector
/// split into its final segment (`scope`) + reversed ancestor selectors
/// (`parent_scopes`), carrying the setting's index and resolved style.
#[derive(Debug, Clone)]
pub(crate) struct ParsedThemeRule {
    pub scope: String,
    pub parent_scopes: Option<Vec<String>>,
    /// Index of the *setting* this rule came from (shared by comma-scopes),
    /// used as the final sort tiebreak — matches vscode's `H(...,e,...)`.
    pub index: usize,
    /// `-1` = not set; else a bitset (italic=1 bold=2 underline=4 strike=8).
    pub font_style: i32,
    pub foreground: Option<String>,
    pub background: Option<String>,
}

/// `strcmp` (`p`): lexicographic. Scope names are ASCII in TextMate, so byte
/// ordering matches JS's UTF-16 code-unit comparison.
pub(crate) fn strcmp(a: &str, b: &str) -> Ordering {
    a.cmp(b)
}

/// `strArrCmp` (`d`): compares two optional parent-scope arrays. `None`
/// (vscode's `null`) sorts before any array; equal lengths compare elementwise,
/// otherwise the shorter sorts first.
pub(crate) fn strarrcmp(a: &Option<Vec<String>>, b: &Option<Vec<String>>) -> Ordering {
    match (a, b) {
        (None, None) => Ordering::Equal,
        (None, Some(_)) => Ordering::Less,
        (Some(_), None) => Ordering::Greater,
        (Some(av), Some(bv)) => {
            if av.len() == bv.len() {
                for (x, y) in av.iter().zip(bv.iter()) {
                    let c = strcmp(x, y);
                    if c != Ordering::Equal {
                        return c;
                    }
                }
                Ordering::Equal
            } else {
                av.len().cmp(&bv.len())
            }
        }
    }
}

/// `isValidHexColor` (`f`): `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`.
pub(crate) fn is_valid_hex(s: &str) -> bool {
    let Some(body) = s.strip_prefix('#') else {
        return false;
    };
    matches!(body.len(), 3 | 4 | 6 | 8) && body.bytes().all(|b| b.is_ascii_hexdigit())
}

/// Scope-prefix match `K`: `selector === scope` or `scope` starts with
/// `selector` followed by a `.` — e.g. selector `string` matches
/// `string.quoted` but not `strings`.
pub(crate) fn matches_scope(scope: &str, selector: &str) -> bool {
    scope == selector
        || (scope.starts_with(selector) && scope.as_bytes().get(selector.len()) == Some(&b'.'))
}

/// The `parseTheme` step inside `Theme.createFromRawTheme`: expands each theme
/// setting into one `ParsedThemeRule` per scope selector, decoding the
/// `fontStyle` words and dropping invalid colors. The rule `index` is the
/// *setting* index (comma-split scopes from one setting share it).
pub(crate) fn parse_theme(settings: &[ThemeSetting]) -> Vec<ParsedThemeRule> {
    let mut result = Vec::new();

    for (setting_index, setting) in settings.iter().enumerate() {
        let Some(body) = &setting.settings else {
            continue;
        };

        // scope → list of selector strings (mirrors the string/array/undefined
        // branches, including the leading/trailing comma strip + comma split).
        let scopes: Vec<String> = match &setting.scope {
            Some(Scope::Str(s)) => s
                .trim_matches(',')
                .split(',')
                .map(|x| x.to_string())
                .collect(),
            Some(Scope::Arr(a)) => a.clone(),
            None => vec![String::new()],
        };

        // fontStyle: -1 unless a string body is present, then a parsed bitset.
        let mut font_style = -1i32;
        if let Some(fs) = &body.font_style {
            font_style = 0;
            for part in fs.split(' ') {
                match part {
                    "italic" => font_style |= 1,
                    "bold" => font_style |= 2,
                    "underline" => font_style |= 4,
                    "strikethrough" => font_style |= 8,
                    _ => {}
                }
            }
        }

        let foreground = body
            .foreground
            .as_deref()
            .filter(|c| is_valid_hex(c))
            .map(str::to_string);
        let background = body
            .background
            .as_deref()
            .filter(|c| is_valid_hex(c))
            .map(str::to_string);

        for raw_scope in &scopes {
            let segments: Vec<&str> = raw_scope.trim().split(' ').collect();
            let scope = segments[segments.len() - 1].to_string();
            let parent_scopes = if segments.len() > 1 {
                let mut p: Vec<String> = segments[..segments.len() - 1]
                    .iter()
                    .map(|s| s.to_string())
                    .collect();
                p.reverse();
                Some(p)
            } else {
                None
            };

            result.push(ParsedThemeRule {
                scope,
                parent_scopes,
                index: setting_index,
                font_style,
                foreground: foreground.clone(),
                background: background.clone(),
            });
        }
    }

    result
}
