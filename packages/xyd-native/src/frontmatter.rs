//! `@xyd-js/content` frontmatter fast path native surface (S6+ W4). Batch
//! file read + YAML frontmatter parse, replacing the per-page MDX compile.
//! JSON out: `{ "<absPath>": {status: "ok"|"missing"|"throw"|"fallback",
//! frontmatter?} }`.

use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi]
pub fn frontmatter_batch(paths_json: String) -> Result<String> {
    let paths: Vec<String> = serde_json::from_str(&paths_json)
        .map_err(|e| Error::from_reason(format!("[xyd_frontmatter] bad paths: {e}")))?;
    let map = xyd_frontmatter::frontmatter_batch(&paths);
    serde_json::to_string(&map)
        .map_err(|e| Error::from_reason(format!("[xyd_frontmatter] serialize: {e}")))
}
