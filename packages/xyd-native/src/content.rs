//! Content-compile napi surface. Thin adapter over `xyd_mdx` — all logic lives
//! in the pure crate (`crates/xyd_mdx`).

use napi::bindgen_prelude::*;
use napi_derive::napi;

/// Compile an MDX source to xyd's `outputFormat:'function-body'` string
/// (Track C: prose + directives + `@include`/`@changelog`).
///
/// `settings_json` is xyd's settings object as JSON (only
/// `theme.coder.syntaxHighlight` is read today). `base_dir` is the page file's
/// directory — it resolves relative `@include` / `@changelog` paths; pass
/// `undefined`/omit when there is none (those pages then fall back). Returns JSON:
/// `{ "compiled": string, "capability": "full" | "fallback", "reason"?: string }`.
/// `capability: "fallback"` (empty `compiled`) tells the JS caller to run the
/// `ContentFS.compileContent` pipeline unchanged.
#[napi]
pub fn compile_mdx(
    source: String,
    settings_json: String,
    base_dir: Option<String>,
) -> Result<String> {
    let out = xyd_mdx::compile_mdx(&source, &settings_json, base_dir.as_deref().unwrap_or(""));
    serde_json::to_string(&out).map_err(|e| Error::from_reason(format!("[xyd_mdx] serialize: {e}")))
}
