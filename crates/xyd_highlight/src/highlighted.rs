//! H3 — the codehike `HighlightedCode` shape.
//!
//! The xyd call sites import `highlight` from `codehike/code`, which runs
//! `@code-hike/lighter`'s tokenization and then applies codehike's own token
//! reshape (`joinLines` / `joinTokens` / `splitWhitespace` / `joinWhitespace`).
//! This module is a byte-for-byte Rust port of that reshape (verbatim from
//! `packages/xyd-components/src/coder/Code/highlight.ts`, itself identical to
//! codehike's internal `dist/code/highlight.js`), producing the exact
//! `HighlightedCode` object the sites consume.
//!
//! ## Which lines feed the reshape (the H3 pivot)
//!
//! The task brief assumed `@code-hike/lighter`'s `lines` are the RAW
//! metadata-boundary slices (no whitespace-join) and that a new `raw_styled_lines`
//! accessor was needed. That is NOT true for `@code-hike/lighter@1.0.1` (bundled
//! with `codehike@1.0.7`): its `scopes:false` path (`KB` → `hB` with no
//! `preserveWhitespace`) applies the SAME whitespace-join as `@syntax0/highlight`
//! (blank-glue + same-`STYLE_MASK` merge). Verified empirically: lighter's
//! `.lines` == the engine's existing [`crate::highlight`] output (`styled_lines`)
//! for all 46 H1/H2 corpus cells. So H3 feeds the EXISTING joined `styled_lines`
//! into codehike's reshape — a raw no-join accessor would produce WRONG codehike
//! output. The engine output is therefore left completely untouched.

use serde::ser::{SerializeSeq, Serializer};
use serde::Serialize;

use crate::store;
use crate::theme::Theme;
use crate::{highlight, Registry, Style, StyledToken};

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

/// The `{fontStyle?, fontWeight?, textDecoration?}` object codehike appends as a
/// token's 3rd array slot (the token style minus `color`). Absent keys are
/// omitted (never `null`), matching the JS `{color, ...rest}` destructure.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct CssProps {
    #[serde(skip_serializing_if = "Option::is_none", rename = "fontStyle")]
    pub font_style: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "fontWeight")]
    pub font_weight: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "textDecoration")]
    pub text_decoration: Option<&'static str>,
}

impl CssProps {
    fn from_style(style: &Style) -> CssProps {
        CssProps {
            font_style: style.font_style,
            font_weight: style.font_weight,
            text_decoration: style.text_decoration,
        }
    }

    /// `Object.keys(rest).length === 0` — the 3rd slot is pushed only when this
    /// is non-empty.
    fn is_empty(&self) -> bool {
        self.font_style.is_none() && self.font_weight.is_none() && self.text_decoration.is_none()
    }
}

/// A codehike token — the heterogeneous array `[content, color, cssProps?]`.
///
/// Serialized as a JSON array, NOT an object: `content` and `color` are always
/// present (`color` is `null` when unset, exactly like `joinTokens`' unconditional
/// `t.push(color)`), and `css_props` occupies the 3rd slot only when non-empty.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Token {
    pub content: String,
    pub color: Option<String>,
    pub css_props: Option<CssProps>,
}

impl Serialize for Token {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let len = if self.css_props.is_some() { 3 } else { 2 };
        let mut seq = serializer.serialize_seq(Some(len))?;
        seq.serialize_element(&self.content)?;
        // `t.push(color)` is unconditional — Some → string, None → JSON null.
        seq.serialize_element(&self.color)?;
        if let Some(css) = &self.css_props {
            seq.serialize_element(css)?;
        }
        seq.end()
    }
}

/// One entry in the `tokens` stream: a [`Token`] array or a bare `Whitespace`
/// string (`"\n"`, `"  "`, …). Mirrors codehike's `AnyToken = Token | Whitespace`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AnyToken {
    Token(Token),
    Whitespace(String),
}

impl Serialize for AnyToken {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        match self {
            AnyToken::Token(t) => t.serialize(serializer),
            AnyToken::Whitespace(w) => serializer.serialize_str(w),
        }
    }
}

/// The block-level `style` object lighter returns: `{color, background,
/// colorScheme}`. All three are always present (codehike emits them verbatim).
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct BlockStyle {
    pub color: String,
    pub background: String,
    #[serde(rename = "colorScheme")]
    pub color_scheme: String,
}

/// The full `HighlightedCode` object codehike's `highlight()` returns. Field
/// order matches the JS object-key order exactly (`{...data}` seeds `value,
/// lang, meta`; `lang` is then overwritten in place with the resolved lighter
/// lang): `value, lang, meta, code, tokens, annotations, themeName, style`.
#[derive(Debug, Clone, Serialize)]
pub struct HighlightedCode {
    pub value: String,
    /// The RESOLVED lighter language id (e.g. `"javascript"` for `"js"`,
    /// `"shellscript"` for `"bash"`; unknown → `"txt"`).
    pub lang: String,
    pub meta: String,
    /// `code` after `splitAnnotationsAndCode(value, lang, "!")`. The real xyd
    /// corpus has zero `!` annotations, so `code === value`.
    pub code: String,
    pub tokens: Vec<AnyToken>,
    /// Always empty — codehike's `compatAnnotations([])` (no `!` annotations).
    pub annotations: Vec<serde_json::Value>,
    #[serde(rename = "themeName")]
    pub theme_name: String,
    pub style: BlockStyle,
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

thread_local! {
    /// One [`Registry`] per thread, reused across every highlight/theme call.
    ///
    /// The `Registry` lazily decompresses + compiles a grammar (and parses a
    /// theme) on first use and caches it. Constructing a FRESH `Registry` per
    /// call therefore threw that cache away and re-compiled the whole grammar
    /// (zstd-decompress + JSON-parse + rule/include/injection build) on EVERY
    /// code block — ~1.2s per `tsx` block, the entire native-vs-JS build
    /// regression. `Registry` holds `RefCell`/`Rc` (not `Send`/`Sync`), so the
    /// cache is thread-local; each SSG worker warms its own on first use and
    /// reuses it thereafter. Output is unchanged — same code, just cached.
    static REGISTRY: Registry = Registry::new();
}

/// Produce the codehike `HighlightedCode` for `value` in `lang` under
/// `theme_name`, byte-identical to `codehike/code`'s `highlight({value, lang,
/// meta}, theme_name)`.
///
/// `lang` is resolved through the H2 [`Registry`]; an unknown language falls
/// back to `"txt"` (codehike's `LANG_NAMES` guard). `theme_name` must be an
/// embedded theme (lighter throws on an unknown theme — we mirror that).
pub fn highlighted_code(value: &str, lang: &str, meta: &str, theme_name: &str) -> HighlightedCode {
    REGISTRY.with(|reg| {
        let theme = reg
            .theme(theme_name)
            .expect("embedded theme name (lighter throws on an unknown theme)");
        build_highlighted(reg, value, lang, meta, &theme, theme_name)
    })
}

/// Like [`highlighted_code`] but with a caller-supplied [`Theme`] (e.g. one built
/// from a user's custom VS Code theme JSON via [`Theme::from_vscode_json`]) — the
/// call sites pass `settings.theme.coder.syntaxHighlight` which is EITHER an
/// embedded theme name OR a resolved theme object. `theme_name` is the value
/// echoed into `HighlightedCode.themeName`.
pub fn highlighted_code_with_theme(
    value: &str,
    lang: &str,
    meta: &str,
    theme: &Theme,
    theme_name: &str,
) -> HighlightedCode {
    REGISTRY.with(|reg| build_highlighted(reg, value, lang, meta, theme, theme_name))
}

/// The shared body — resolves the grammar via the thread-local (cached)
/// registry and reshapes into `HighlightedCode`.
fn build_highlighted(
    reg: &Registry,
    value: &str,
    lang: &str,
    meta: &str,
    theme: &Theme,
    theme_name: &str,
) -> HighlightedCode {
    // codehike: `if (!LANG_NAMES.includes(lang)) lang = "txt"`. Our alias table
    // (`aliasOrIdToScope`) is the ported `LANG_NAMES` source, so an unresolvable
    // alias is the "unknown language" case.
    let effective_lang = if store::alias_to_scope(lang).is_some() {
        lang
    } else {
        "txt"
    };

    let (grammar, scope) = reg
        .grammar_for_lang(effective_lang)
        .expect("resolvable language (txt is always embedded)");
    // lighter's `kB(alias).langId` == the grammar id for the alias' scope.
    let lang_id = store::scope_lang(&scope)
        .map(|e| e.id.clone())
        .unwrap_or_else(|| effective_lang.to_string());

    // The engine's styled lines == `@code-hike/lighter`'s `.lines` (proven
    // byte-identical across the H1/H2 corpus). Feed them straight into the
    // codehike reshape.
    let styled_lines = highlight(value, &grammar, theme);
    let tokens = reshape_tokens(&styled_lines);

    HighlightedCode {
        value: value.to_string(),
        lang: lang_id,
        meta: meta.to_string(),
        code: value.to_string(),
        tokens,
        annotations: Vec::new(),
        theme_name: theme_name.to_string(),
        style: block_style(theme),
    }
}

/// Expose [`Theme::get_all_theme_colors`] for the build/config call sites (the
/// `getThemeColors` bridge). Unknown theme name → JSON `null`.
pub fn get_theme_colors(theme_name: &str) -> serde_json::Value {
    REGISTRY.with(|reg| {
        reg.theme(theme_name)
            .map(|t| t.get_all_theme_colors())
            .unwrap_or(serde_json::Value::Null)
    })
}

fn block_style(theme: &Theme) -> BlockStyle {
    BlockStyle {
        color: theme.foreground().to_string(),
        background: theme.background().to_string(),
        color_scheme: theme.color_scheme(),
    }
}

// ---------------------------------------------------------------------------
// The reshape — a verbatim port of codehike's highlight.ts helpers.
// ---------------------------------------------------------------------------

/// `joinLines` → `splitWhitespace` → `joinWhitespace`, applied to the engine's
/// styled lines (= `@code-hike/lighter`'s `lines`).
fn reshape_tokens(lines: &[Vec<StyledToken>]) -> Vec<AnyToken> {
    join_whitespace(split_whitespace(join_lines(lines)))
}

/// `joinLines`: flatten every line's `joinTokens` output into one stream,
/// pushing a `"\n"` whitespace string between (not after) lines.
fn join_lines(lines: &[Vec<StyledToken>]) -> Vec<AnyToken> {
    let mut out: Vec<AnyToken> = Vec::new();
    let n = lines.len();
    for (i, line) in lines.iter().enumerate() {
        for tok in join_tokens(line) {
            out.push(tok);
        }
        if i < n - 1 {
            out.push(AnyToken::Whitespace("\n".to_string()));
        }
    }
    out
}

/// `joinTokens`: `{content, style:{color, ...rest}}` → `[content, color, rest?]`.
/// `color` is kept unconditionally; `rest` (the css props) only when non-empty.
fn join_tokens(line: &[StyledToken]) -> Vec<AnyToken> {
    line.iter()
        .map(|st| {
            let css = CssProps::from_style(&st.style);
            AnyToken::Token(Token {
                content: st.content.clone(),
                color: st.style.color.clone(),
                css_props: if css.is_empty() { None } else { Some(css) },
            })
        })
        .collect()
}

/// `splitWhitespace`: eject each token's leading/trailing whitespace into
/// standalone whitespace strings, keeping the trimmed middle as a token (styled
/// identically). Whitespace entries pass through untouched.
fn split_whitespace(tokens: Vec<AnyToken>) -> Vec<AnyToken> {
    let mut out: Vec<AnyToken> = Vec::new();
    for item in tokens {
        match item {
            AnyToken::Whitespace(_) => out.push(item),
            AnyToken::Token(tok) => {
                let (before, mid, after) = split_surrounding_whitespace(&tok.content);
                if !before.is_empty() {
                    out.push(AnyToken::Whitespace(before.to_string()));
                }
                if !mid.is_empty() {
                    out.push(AnyToken::Token(Token {
                        content: mid.to_string(),
                        color: tok.color.clone(),
                        css_props: tok.css_props.clone(),
                    }));
                }
                if !after.is_empty() {
                    out.push(AnyToken::Whitespace(after.to_string()));
                }
            }
        }
    }
    out
}

/// `joinWhitespace`: merge consecutive whitespace strings, drop empty whitespace
/// and empty-content tokens.
fn join_whitespace(tokens: Vec<AnyToken>) -> Vec<AnyToken> {
    let mut out: Vec<AnyToken> = Vec::new();
    for item in tokens {
        match item {
            AnyToken::Whitespace(w) => {
                if let Some(AnyToken::Whitespace(last)) = out.last_mut() {
                    last.push_str(&w);
                } else if !w.is_empty() {
                    out.push(AnyToken::Whitespace(w));
                }
            }
            AnyToken::Token(tok) => {
                if !tok.content.is_empty() {
                    out.push(AnyToken::Token(tok));
                }
            }
        }
    }
    out
}

/// `splitSurroundingWhitespace`: `" \t foo bar \n"` → `(" \t ", "foo bar", " \n")`.
/// Returns byte-slice offsets so this is a verbatim `slice(0, indexOf(trimmed))`
/// / `slice(indexOf(trimmed)+trimmed.length)` — an all-whitespace string yields
/// `("", "", <whole>)` (JS `indexOf("") === 0`).
fn split_surrounding_whitespace(content: &str) -> (&str, &str, &str) {
    let (start, end) = js_trim_bounds(content);
    (&content[..start], &content[start..end], &content[end..])
}

/// Byte bounds of `content.trim()` using the ECMAScript whitespace set (so the
/// split matches JS `String.prototype.trim` exactly, not Rust's Unicode
/// `White_Space` which differs on U+0085/U+FEFF). All-whitespace → `(0, 0)`.
fn js_trim_bounds(content: &str) -> (usize, usize) {
    let Some(start) = content
        .char_indices()
        .find(|(_, c)| !is_js_whitespace(*c))
        .map(|(i, _)| i)
    else {
        return (0, 0); // all whitespace: JS trim → "", slices give ("", "", whole)
    };
    let mut end = start;
    for (i, c) in content.char_indices() {
        if !is_js_whitespace(c) {
            end = i + c.len_utf8();
        }
    }
    (start, end)
}

/// The ECMAScript `WhiteSpace` + `LineTerminator` set that `String.prototype.trim`
/// strips.
fn is_js_whitespace(c: char) -> bool {
    matches!(
        c,
        '\u{0009}'
            | '\u{000A}'
            | '\u{000B}'
            | '\u{000C}'
            | '\u{000D}'
            | '\u{0020}'
            | '\u{00A0}'
            | '\u{1680}'
            | '\u{2000}'
            ..='\u{200A}'
                | '\u{2028}'
                | '\u{2029}'
                | '\u{202F}'
                | '\u{205F}'
                | '\u{3000}'
                | '\u{FEFF}'
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn resolves_alias_to_lighter_lang_id() {
        // js → javascript, bash → shellscript (langId == grammar id).
        assert_eq!(
            highlighted_code("const x=1", "js", "", "github-dark").lang,
            "javascript"
        );
        assert_eq!(
            highlighted_code("echo hi", "bash", "", "github-dark").lang,
            "shellscript"
        );
    }

    #[test]
    fn unknown_language_falls_back_to_txt() {
        let hc = highlighted_code("plain text\nsecond", "no-such-lang", "", "github-dark");
        assert_eq!(hc.lang, "txt");
        // txt tokenizes to default-foreground tokens (not lighter's empty-style
        // `text` path).
        let v = serde_json::to_value(&hc.tokens).unwrap();
        assert_eq!(
            v,
            json!([["plain text", "#C9D1D9"], "\n", ["second", "#C9D1D9"]])
        );
    }

    #[test]
    fn split_surrounding_whitespace_matches_js() {
        assert_eq!(
            split_surrounding_whitespace(" \t foo bar \n"),
            (" \t ", "foo bar", " \n")
        );
        assert_eq!(split_surrounding_whitespace("foo bar"), ("", "foo bar", ""));
        assert_eq!(split_surrounding_whitespace("() "), ("", "()", " "));
        assert_eq!(split_surrounding_whitespace("  }"), ("  ", "}", ""));
        // all whitespace → ("", "", whole) like JS indexOf("") === 0
        assert_eq!(split_surrounding_whitespace("   "), ("", "", "   "));
        assert_eq!(split_surrounding_whitespace(""), ("", "", ""));
    }

    #[test]
    fn block_style_and_annotations_shape() {
        let hc = highlighted_code("const x=1", "js", "m=1", "github-dark");
        assert_eq!(hc.meta, "m=1");
        assert_eq!(hc.code, hc.value);
        assert!(hc.annotations.is_empty());
        assert_eq!(hc.theme_name, "github-dark");
        assert_eq!(
            serde_json::to_value(&hc.style).unwrap(),
            json!({ "color": "#c9d1d9", "background": "#0d1117", "colorScheme": "dark" })
        );
    }

    #[test]
    fn output_key_order_is_exact() {
        let hc = highlighted_code("const x=1", "js", "", "github-dark");
        let s = serde_json::to_string(&hc).unwrap();
        let keys: Vec<&str> = [
            "value",
            "lang",
            "meta",
            "code",
            "tokens",
            "annotations",
            "themeName",
            "style",
        ]
        .into_iter()
        .filter(|k| s.contains(&format!("\"{k}\":")))
        .collect();
        // All present, and in serialized order.
        let mut last = 0;
        for k in &keys {
            let pos = s.find(&format!("\"{k}\":")).unwrap();
            assert!(pos >= last, "key {k} out of order");
            last = pos;
        }
        assert_eq!(keys.len(), 8);
    }

    #[test]
    fn get_theme_colors_exposed() {
        let colors = get_theme_colors("github-dark");
        assert_eq!(colors["foreground"], json!("#c9d1d9"));
        assert_eq!(colors["colorScheme"], json!("dark"));
        assert_eq!(get_theme_colors("no-such-theme"), serde_json::Value::Null);
    }
}
