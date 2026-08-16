//! The settings data plane (S6+ W6) — Rust port of xyd's config-processing
//! logic for the **docs.json** path (docs.ts/tsx stay JS: their live modules
//! carry non-serializable functions/React components a JSON boundary drops).
//!
//! Pure transforms, each a drop-in for its JS call site:
//! - `env` — `replaceEnvVars` (`$VAR` substitution; env passed in from JS)
//! - `presets` — the SYNC presets (ensureNavigation/head/basename/diagrams;
//!   syntax highlight stays JS, it's async fetch/fs)
//! - `pagemap` — `mapNavigationToPagePathMapping` (the batched nav→file walk)
//! - `access` — `buildAccessMap` (glob rules)
//! - `plugins` — `integrationsToPlugins`/`accessControlToPlugins` (the pure
//!   config→plugin-specifier maps that seed `appInit`'s plugin list)
//!
//! The `appInit` contribution merge (utils.ts ~456-577) that CONSUMES those
//! plugin specifiers is deliberately NOT here: it operates on live JS module
//! values (React components, remark/rehype/hook functions) that a JSON boundary
//! would drop, so it stays JS.
//!
//! This is architectural-completeness work: the per-invocation cost is
//! one-shot (appInit), so the value is a publishable, complete Rust settings
//! foundation — not a hot-path speedup. Parity is the priority; the fixture
//! suite is the drift alarm.

pub mod access;
pub mod env;
pub mod pagemap;
pub mod plugins;
pub mod presets;

use serde_json::{Map, Value};
use std::path::Path;

/// The fused `postLoadSetup` for docs.json: env substitution then the sync
/// presets. `env` is the JS-supplied `process.env` snapshot. Returns the
/// processed settings; the shim runs the async `handleSyntaxHighlight`
/// afterward if `theme.coder.syntaxHighlight` is a string.
pub fn process_settings(settings: &Value, env: &Map<String, Value>) -> Value {
    let mut processed = env::replace_env_vars(settings, env, false);
    presets::presets(&mut processed);
    processed
}

/// Convenience: run the nav walk for a single tree against `cwd`.
pub fn page_path_mapping(navigation: &Value, cwd: &Path) -> Map<String, Value> {
    pagemap::map_navigation(navigation, cwd)
}
