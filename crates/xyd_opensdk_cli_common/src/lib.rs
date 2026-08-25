//! Shared x-cli contract layer for the CLI-mode OpenSDK emitters.
//!
//! A CLI-mode spec (produced by `xyd_opencli2opensdk`) carries a root `x-cli`
//! block and per-method `x-cli` argv bindings instead of HTTP bindings. This
//! crate owns the CONSUME side of that contract — `is_cli_spec()` detection,
//! `CliRoot` parsing, and `CliPlan::for_method()` (the CLI analog of the
//! emitters' HTTP `plan_operation`) — so the seven emitters never re-parse
//! `from:` strings and cannot drift on the contract. Code generation stays
//! per-emitter.

pub mod plan;
pub mod testkit;

use serde_json::Value;

pub use plan::{CliArg, CliOpt, CliPlan, Encoding};

/// A spec is CLI-mode iff it carries a root `x-cli` object.
pub fn is_cli_spec(spec: &Value) -> bool {
    spec.get("x-cli").map(|v| v.is_object()).unwrap_or(false)
}

/// The parsed root `x-cli` block.
#[derive(Debug, Clone)]
pub struct CliRoot {
    /// Binary name (resolved via PATH unless overridden).
    pub bin: String,
    /// Env var checked first for an absolute binary path.
    pub env_var: String,
    /// `" "` (default): flag and value as SEPARATE argv tokens; `"="`: joined.
    pub option_separator: String,
}

impl CliRoot {
    pub fn parse(spec: &Value) -> Result<CliRoot, String> {
        let root = spec
            .get("x-cli")
            .and_then(|v| v.as_object())
            .ok_or_else(|| "spec has no root x-cli object (not a CLI-mode spec)".to_string())?;
        let bin = root
            .get("bin")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())
            .ok_or_else(|| "x-cli.bin is missing or empty".to_string())?
            .to_string();
        let env_var = root
            .get("envVar")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())
            .ok_or_else(|| "x-cli.envVar is missing or empty".to_string())?
            .to_string();
        let option_separator = root
            .get("conventions")
            .and_then(|c| c.get("optionSeparator"))
            .and_then(|s| s.as_str())
            .unwrap_or(" ")
            .to_string();
        Ok(CliRoot {
            bin,
            env_var,
            option_separator,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn detects_cli_specs() {
        assert!(is_cli_spec(
            &json!({ "x-cli": { "bin": "xyd", "envVar": "XYD_BIN" } })
        ));
        assert!(!is_cli_spec(&json!({ "opensdk": "1.0.0" })));
        assert!(!is_cli_spec(&json!({ "x-cli": "nope" })));
    }

    #[test]
    fn parses_root_with_defaults() {
        let root = CliRoot::parse(&json!({ "x-cli": { "bin": "xyd", "envVar": "XYD_BIN" } }))
            .expect("parse");
        assert_eq!(root.bin, "xyd");
        assert_eq!(root.env_var, "XYD_BIN");
        assert_eq!(root.option_separator, " ");
    }

    #[test]
    fn parses_option_separator_convention() {
        let root = CliRoot::parse(&json!({ "x-cli": {
            "bin": "b", "envVar": "B_BIN",
            "conventions": { "optionSeparator": "=" }
        }}))
        .expect("parse");
        assert_eq!(root.option_separator, "=");
    }

    #[test]
    fn missing_bin_is_an_error() {
        let err = CliRoot::parse(&json!({ "x-cli": { "envVar": "X" } })).unwrap_err();
        assert!(err.contains("x-cli.bin"), "{err}");
    }
}
