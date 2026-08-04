//! `@xyd-js` settings data plane native surface (S6+ W6). The docs.json config
//! path only — the shims keep docs.ts/tsx on JS (their live modules carry
//! non-serializable functions a JSON boundary would drop). JSON transport.

use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde_json::{Map, Value};

fn parse_obj(s: &str, what: &str) -> Result<Map<String, Value>> {
    let v: Value = serde_json::from_str(s)
        .map_err(|e| Error::from_reason(format!("[xyd_settings] bad {what}: {e}")))?;
    match v {
        Value::Object(m) => Ok(m),
        _ => Err(Error::from_reason(format!("[xyd_settings] {what} not an object"))),
    }
}

/// `postLoadSetup` for docs.json: replaceEnvVars + the sync presets. `env_json`
/// is a snapshot of `process.env`. The async syntax-highlight step stays JS.
#[napi]
pub fn process_settings(settings_json: String, env_json: String) -> Result<String> {
    let settings: Value = serde_json::from_str(&settings_json)
        .map_err(|e| Error::from_reason(format!("[xyd_settings] bad settings: {e}")))?;
    let env = parse_obj(&env_json, "env")?;
    let out = xyd_settings::process_settings(&settings, &env);
    serde_json::to_string(&out)
        .map_err(|e| Error::from_reason(format!("[xyd_settings] serialize: {e}")))
}

/// `mapNavigationToPagePathMapping` for one (already i18n-prefixed) navigation
/// tree, probing files under `cwd`.
#[napi]
pub fn map_navigation_to_page_path_mapping(nav_json: String, cwd: String) -> Result<String> {
    let navigation: Value = serde_json::from_str(&nav_json)
        .map_err(|e| Error::from_reason(format!("[xyd_settings] bad navigation: {e}")))?;
    let mapping = xyd_settings::pagemap::map_navigation(&navigation, std::path::Path::new(&cwd));
    serde_json::to_string(&mapping)
        .map_err(|e| Error::from_reason(format!("[xyd_settings] serialize: {e}")))
}

/// `findIndexPage()` — "" when neither index.md nor index.mdx exists under cwd.
#[napi]
pub fn find_index_page(cwd: String) -> String {
    xyd_settings::pagemap::find_index_page(std::path::Path::new(&cwd))
}

/// `buildAccessMap(pagePathMapping, metadataMap, config)`.
#[napi]
pub fn build_access_map(
    mapping_json: String,
    metadata_json: String,
    config_json: String,
) -> Result<String> {
    let mapping = parse_obj(&mapping_json, "pagePathMapping")?;
    let metadata = parse_obj(&metadata_json, "metadataMap")?;
    let config: Value = serde_json::from_str(&config_json)
        .map_err(|e| Error::from_reason(format!("[xyd_settings] bad config: {e}")))?;
    let out = xyd_settings::access::build_access_map(&mapping, &metadata, &config);
    serde_json::to_string(&out)
        .map_err(|e| Error::from_reason(format!("[xyd_settings] serialize: {e}")))
}
