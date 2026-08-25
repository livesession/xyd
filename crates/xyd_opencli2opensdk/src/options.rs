//! Converter options — deserialized from the JSON options bag (napi-ready,
//! same convention as the sibling converters).

use serde::Deserialize;
use serde_json::Value;

/// Root options that are never materialized as per-method inherited params:
/// they short-circuit execution (and are covered by opt-methods instead).
pub const DEFAULT_INHERITED_OPTION_EXCLUDES: [&str; 2] = ["help", "version"];

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct Options {
    /// Client name override; default `slug(info.title)`.
    pub sdk_name: Option<String>,
    /// Binary name; default = the resolved sdk name.
    pub bin: Option<String>,
    /// Default `info.version`, else "0.0.0".
    pub version: Option<String>,
    /// Binary-path override env var; default `{SCREAMING_SNAKE(bin)}_BIN`.
    pub env_var: Option<String>,
    /// Default false: skip hidden commands/options/arguments.
    pub include_hidden: Option<bool>,
    /// Default true: emit opt-X root methods for root options that are not
    /// materialized as inherited params.
    pub root_option_methods: Option<bool>,
    /// Default ["help","version"].
    pub inherited_option_excludes: Option<Vec<String>>,
    /// Deep-merged over `default_cli_behavior()`.
    pub sdk_behavior: Option<Value>,
}

impl Options {
    pub fn include_hidden(&self) -> bool {
        self.include_hidden == Some(true)
    }

    pub fn root_option_methods(&self) -> bool {
        self.root_option_methods != Some(false)
    }

    pub fn inherited_option_excludes(&self) -> Vec<String> {
        self.inherited_option_excludes.clone().unwrap_or_else(|| {
            DEFAULT_INHERITED_OPTION_EXCLUDES
                .iter()
                .map(|s| s.to_string())
                .collect()
        })
    }
}
