//! `xyd_highlight_wasm` — the browser (WASM) syntax highlighter.
//!
//! This is the client-side counterpart to the napi server highlighter
//! (`packages/xyd-native/src/highlight.rs`). It exposes the SAME surface —
//! [`highlight`] + [`get_theme_colors`] returning codehike-shaped JSON — so the
//! client re-highlight path (theme switching / dynamic code) can run xyd's OWN
//! Rust engine instead of codehike, byte-for-byte identical to the server.
//!
//! ## How it stays byte-identical (route (a))
//!
//! `xyd_highlight`'s `onig` (Oniguruma C) dependency cannot link on wasm32
//! (no C sysroot). Instead we build it with the `js-scanner` feature and
//! register a [`ScannerBackend`] that delegates the regex primitive to
//! **onig.wasm** — the very same Oniguruma build vscode-textmate /
//! `@code-hike/lighter` already ship — through the JS binding in
//! `js/onig-binding.js`. Same engine ⇒ same match semantics ⇒ same tokens.
//! Everything else (grammar/rule/tokenizer/theme/reshape + embedded assets) is
//! the pure Rust engine, unchanged. See `.ai/client-wasm-highlighter-spike.md`.
//!
//! ## Lifecycle
//!
//! 1. JS loads onig.wasm (async) via `js/onig-binding.js`.
//! 2. JS instantiates THIS wasm module; [`start`] registers the delegating
//!    backend (a ZST — the real work lives in JS/onig.wasm).
//! 3. JS calls [`highlight`] synchronously per code block.

use wasm_bindgen::prelude::*;

use xyd_highlight::{
    get_theme_colors as core_get_theme_colors, highlighted_code, highlighted_code_with_theme,
    register_scanner_backend, ScanMatch, ScannerBackend, Theme,
};

// ---------------------------------------------------------------------------
// The onig.wasm bridge — JS-imported functions implemented in js/onig-binding.js.
// ---------------------------------------------------------------------------
//
// Marshaling is deliberately dependency-light: patterns go over as a JSON array
// string; a match comes back as a JSON string. `compile` runs once per scanner
// and `find` once per scanner (the tokenizer is compile-once/find-once), so the
// JSON overhead is not on a hot inner loop.
//
// OFFSET CONTRACT (critical for byte-parity): the Rust engine works in **UTF-8
// byte offsets**. `start` is a UTF-8 byte offset, and the returned capture spans
// MUST be UTF-8 byte offsets too. The JS binding round-trips through
// vscode-oniguruma (which speaks UTF-16 at its JS API) and converts offsets back
// to UTF-8 bytes, recovering exactly the byte offsets the native onig_sys path
// produces. See js/onig-binding.js.
#[wasm_bindgen(module = "/js/onig-binding.js")]
extern "C" {
    /// Compile a set of TextMate patterns (JSON array of strings) → an opaque
    /// numeric scanner handle. A pattern that fails to compile is inert.
    #[wasm_bindgen(js_name = xydOnigCompile)]
    fn onig_compile(patterns_json: &str) -> f64;

    /// Find the earliest match at/after the UTF-8 byte offset `start`. Returns a
    /// JSON string: `"null"` for no match, else
    /// `[patternIndex, g0Beg, g0End, g1Beg, g1End, …]` with UTF-8 byte offsets
    /// and `-1` for a non-participating group.
    #[wasm_bindgen(js_name = xydOnigFind)]
    fn onig_find(handle: f64, text: &str, start: u32) -> String;

    /// Release a scanner handle.
    #[wasm_bindgen(js_name = xydOnigFree)]
    fn onig_free(handle: f64);
}

/// The delegating backend. A ZST — all state lives in the JS binding
/// (onig.wasm scanner instances keyed by the numeric handle). Single-threaded
/// wasm makes `Send + Sync` trivially sound.
struct OnigWasmBackend;

impl ScannerBackend for OnigWasmBackend {
    fn compile(&self, patterns: &[&str]) -> u64 {
        let json = serde_json::to_string(patterns).unwrap_or_else(|_| "[]".to_string());
        onig_compile(&json) as u64
    }

    fn find(&self, handle: u64, text: &str, start: usize) -> Option<ScanMatch> {
        let out = onig_find(handle as f64, text, start as u32);
        parse_match(&out)
    }

    fn free(&self, handle: u64) {
        onig_free(handle as f64);
    }
}

/// Parse the JS binding's JSON reply into a [`ScanMatch`]. `"null"` (or any
/// non-array) → `None`. The array is `[patternIndex, pairs…]`; each `(beg, end)`
/// pair with `beg == -1` is a non-participating group.
fn parse_match(json: &str) -> Option<ScanMatch> {
    let v: serde_json::Value = serde_json::from_str(json).ok()?;
    let arr = v.as_array()?;
    if arr.is_empty() {
        return None;
    }
    let pattern_index = arr[0].as_i64()? as usize;
    let mut captures = Vec::new();
    let mut i = 1;
    while i + 1 < arr.len() {
        let beg = arr[i].as_i64()?;
        let end = arr[i + 1].as_i64()?;
        captures.push(if beg < 0 {
            None
        } else {
            Some((beg as usize, end as usize))
        });
        i += 2;
    }
    Some(ScanMatch {
        pattern_index,
        captures,
    })
}

/// Install the delegating scanner backend. Runs automatically on module init
/// (`wasm-bindgen(start)`); idempotent, so a manual call is harmless.
#[wasm_bindgen(start)]
pub fn start() {
    #[cfg(feature = "debug-panic")]
    console_error_panic_hook::set_once();
    register_scanner_backend(Box::new(OnigWasmBackend));
}

// ---------------------------------------------------------------------------
// Public surface — mirrors packages/xyd-native/src/highlight.rs exactly.
// ---------------------------------------------------------------------------

/// Highlight `value` (`lang` + `meta`) with `theme_json` → codehike
/// `HighlightedCode` JSON. `theme_json` is the JSON-stringified
/// `settings.theme.coder.syntaxHighlight`: EITHER a bundled theme NAME (a JSON
/// string) OR a resolved VS Code theme OBJECT — both handled, exactly like the
/// napi binding.
#[wasm_bindgen]
pub fn highlight(value: &str, lang: &str, meta: &str, theme_json: &str) -> Result<String, JsError> {
    let theme_val: serde_json::Value = serde_json::from_str(theme_json)
        .map_err(|e| JsError::new(&format!("[xyd_highlight_wasm] bad theme: {e}")))?;

    let hc = match &theme_val {
        serde_json::Value::String(name) => highlighted_code(value, lang, meta, name),
        serde_json::Value::Object(_) => {
            let theme = Theme::from_vscode_json(&theme_val);
            let name = theme_val
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or("unknown");
            highlighted_code_with_theme(value, lang, meta, &theme, name)
        }
        _ => return Err(JsError::new(
            "[xyd_highlight_wasm] theme must be a bundled name string or a VS Code theme object",
        )),
    };

    serde_json::to_string(&hc)
        .map_err(|e| JsError::new(&format!("[xyd_highlight_wasm] serialize: {e}")))
}

/// The editor/UI color palette for `theme_json` (the `getThemeColors` bridge).
/// Unknown → JSON `null`. Mirrors the napi `getThemeColors`.
#[wasm_bindgen(js_name = getThemeColors)]
pub fn get_theme_colors(theme_json: &str) -> Result<String, JsError> {
    let theme_val: serde_json::Value = serde_json::from_str(theme_json)
        .map_err(|e| JsError::new(&format!("[xyd_highlight_wasm] bad theme: {e}")))?;

    let colors = match &theme_val {
        serde_json::Value::String(name) => core_get_theme_colors(name),
        serde_json::Value::Object(_) => Theme::from_vscode_json(&theme_val).get_all_theme_colors(),
        _ => serde_json::Value::Null,
    };

    serde_json::to_string(&colors)
        .map_err(|e| JsError::new(&format!("[xyd_highlight_wasm] serialize: {e}")))
}
