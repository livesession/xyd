//! `xyd_highlight` native surface (S6+ M1 H4). Replaces the codehike/
//! `@code-hike/lighter` highlighting engine at the build-time call sites: takes
//! `{value, lang, meta}` + a theme and returns codehike's `HighlightedCode` JSON
//! (byte-identical to `codehike/code`'s `highlight()`), plus `getThemeColors`.
//!
//! `theme_json` is the JSON-stringified `settings.theme.coder.syntaxHighlight`,
//! which is EITHER a bundled theme NAME (a JSON string) or a resolved VS Code
//! theme OBJECT — both are handled.

use napi::bindgen_prelude::*;
use napi_derive::napi;

use xyd_highlight::Theme;

/// Highlight `value` (lang + meta) with `theme_json` → `HighlightedCode` JSON.
#[napi]
pub fn highlight(value: String, lang: String, meta: String, theme_json: String) -> Result<String> {
    let theme_val: serde_json::Value = serde_json::from_str(&theme_json)
        .map_err(|e| Error::from_reason(format!("[xyd_highlight] bad theme: {e}")))?;

    let hc = match &theme_val {
        // Bundled theme name → embedded theme (lighter throws on unknown → we
        // surface that as an error, matching codehike behavior).
        serde_json::Value::String(name) => {
            xyd_highlight::highlighted_code(&value, &lang, &meta, name)
        }
        // Resolved VS Code theme object → build the theme, echo its `name`.
        serde_json::Value::Object(_) => {
            let theme = Theme::from_vscode_json(&theme_val);
            let name = theme_val
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or("unknown");
            xyd_highlight::highlighted_code_with_theme(&value, &lang, &meta, &theme, name)
        }
        _ => {
            return Err(Error::from_reason(
                "[xyd_highlight] theme must be a bundled name string or a VS Code theme object",
            ))
        }
    };

    serde_json::to_string(&hc)
        .map_err(|e| Error::from_reason(format!("[xyd_highlight] serialize: {e}")))
}

/// The editor/UI color palette for `theme_json` (the `getThemeColors` bridge for
/// the two build/config sites). Unknown → JSON `null`.
#[napi(js_name = "getThemeColors")]
pub fn get_theme_colors(theme_json: String) -> Result<String> {
    let theme_val: serde_json::Value = serde_json::from_str(&theme_json)
        .map_err(|e| Error::from_reason(format!("[xyd_highlight] bad theme: {e}")))?;

    let colors = match &theme_val {
        serde_json::Value::String(name) => xyd_highlight::get_theme_colors(name),
        serde_json::Value::Object(_) => Theme::from_vscode_json(&theme_val).get_all_theme_colors(),
        _ => serde_json::Value::Null,
    };

    serde_json::to_string(&colors)
        .map_err(|e| Error::from_reason(format!("[xyd_highlight] serialize: {e}")))
}
