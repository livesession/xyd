//! `CliPlan` — the CLI analog of the emitters' HTTP `plan_operation`: parse a
//! method's `x-cli` binding once, resolve every `from: "param:<name>"` against
//! `pathParams`/`queryParams`, and hand emitters indices + encodings so their
//! generated method bodies assemble argv without re-interpreting strings.

use serde_json::Value;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Encoding {
    String,
    Number,
    Integer,
    Boolean,
    Json,
}

impl Encoding {
    pub fn parse(s: &str) -> Result<Encoding, String> {
        match s {
            "string" => Ok(Encoding::String),
            "number" => Ok(Encoding::Number),
            "integer" => Ok(Encoding::Integer),
            "boolean" => Ok(Encoding::Boolean),
            "json" => Ok(Encoding::Json),
            other => Err(format!("unknown x-cli encoding {other:?}")),
        }
    }
}

/// One positional binding, resolved against `pathParams`.
#[derive(Debug, Clone)]
pub struct CliArg {
    /// Param name (== `pathParams[param_index].name`).
    pub param: String,
    pub param_index: usize,
    pub encoding: Encoding,
    pub required: bool,
    /// Array-typed param whose items spread as consecutive argv tokens.
    pub variadic: bool,
}

/// One flag binding, resolved against `queryParams`. `param: None` is a
/// constant flag, always appended (how `optVersion()` binds `--version`).
#[derive(Debug, Clone)]
pub struct CliOpt {
    /// The literal argv token including dashes (`--model`, `-x`).
    pub flag: String,
    pub param: Option<String>,
    pub param_index: Option<usize>,
    pub encoding: Encoding,
    /// Array-typed param: repeat the flag per item.
    pub repeat: bool,
}

#[derive(Debug, Clone)]
pub struct CliPlan {
    /// Literal subcommand tokens after the binary (may be empty).
    pub command: Vec<String>,
    pub args: Vec<CliArg>,
    pub opts: Vec<CliOpt>,
    pub interactive: bool,
}

fn param_index(method: &Value, params_key: &str, name: &str) -> Option<usize> {
    method
        .get(params_key)
        .and_then(|p| p.as_array())?
        .iter()
        .position(|p| p.get("name").and_then(|n| n.as_str()) == Some(name))
}

/// `"param:<name>"` → `<name>`.
fn parse_from(from: &str) -> Result<&str, String> {
    from.strip_prefix("param:")
        .filter(|n| !n.is_empty())
        .ok_or_else(|| format!("bad x-cli from token {from:?} (expected \"param:<name>\")"))
}

impl CliPlan {
    /// Parse and resolve one method's `x-cli` binding. `action` appears only
    /// in error messages.
    pub fn for_method(method: &Value) -> Result<CliPlan, String> {
        let action = method
            .get("action")
            .and_then(|a| a.as_str())
            .unwrap_or("<unknown>");
        let x_cli = method
            .get("x-cli")
            .and_then(|v| v.as_object())
            .ok_or_else(|| format!("method {action:?} has no x-cli binding in CLI-mode spec"))?;

        let command: Vec<String> = x_cli
            .get("command")
            .and_then(|c| c.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|t| t.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();

        let mut args: Vec<CliArg> = Vec::new();
        if let Some(raw_args) = x_cli.get("args").and_then(|a| a.as_array()) {
            for (i, raw) in raw_args.iter().enumerate() {
                let from = raw
                    .get("from")
                    .and_then(|f| f.as_str())
                    .ok_or_else(|| format!("method {action:?}: x-cli.args[{i}] has no from"))?;
                let name = parse_from(from).map_err(|e| format!("method {action:?}: {e}"))?;
                let idx = param_index(method, "pathParams", name).ok_or_else(|| {
                    format!(
                        "method {action:?}: x-cli.args[{i}] references unknown pathParam {name:?}"
                    )
                })?;
                let encoding = raw
                    .get("encoding")
                    .and_then(|e| e.as_str())
                    .map(Encoding::parse)
                    .transpose()
                    .map_err(|e| format!("method {action:?}: x-cli.args[{i}]: {e}"))?
                    .unwrap_or(Encoding::String);
                let variadic = raw.get("variadic").and_then(|v| v.as_bool()) == Some(true);
                if variadic && i + 1 != raw_args.len() {
                    return Err(format!(
                        "method {action:?}: variadic x-cli.args[{i}] must be the last positional"
                    ));
                }
                args.push(CliArg {
                    param: name.to_string(),
                    param_index: idx,
                    encoding,
                    required: raw.get("required").and_then(|r| r.as_bool()) == Some(true),
                    variadic,
                });
            }
        }

        let mut opts: Vec<CliOpt> = Vec::new();
        if let Some(raw_opts) = x_cli.get("options").and_then(|o| o.as_array()) {
            for (i, raw) in raw_opts.iter().enumerate() {
                let flag = raw
                    .get("flag")
                    .and_then(|f| f.as_str())
                    .filter(|f| f.starts_with('-'))
                    .ok_or_else(|| {
                        format!("method {action:?}: x-cli.options[{i}] has no dashed flag token")
                    })?
                    .to_string();
                let (param, param_index, encoding) = match raw.get("from").and_then(|f| f.as_str())
                {
                    None => (None, None, Encoding::Boolean), // constant flag
                    Some(from) => {
                        let name =
                            parse_from(from).map_err(|e| format!("method {action:?}: {e}"))?;
                        let idx = param_index(method, "queryParams", name).ok_or_else(|| {
                            format!(
                                "method {action:?}: x-cli.options[{i}] references unknown queryParam {name:?}"
                            )
                        })?;
                        let encoding = raw
                            .get("encoding")
                            .and_then(|e| e.as_str())
                            .map(Encoding::parse)
                            .transpose()
                            .map_err(|e| format!("method {action:?}: x-cli.options[{i}]: {e}"))?
                            .unwrap_or(Encoding::String);
                        (Some(name.to_string()), Some(idx), encoding)
                    }
                };
                opts.push(CliOpt {
                    flag,
                    param,
                    param_index,
                    encoding,
                    repeat: raw.get("repeat").and_then(|r| r.as_bool()) == Some(true),
                });
            }
        }

        Ok(CliPlan {
            command,
            args,
            opts,
            interactive: x_cli.get("interactive").and_then(|i| i.as_bool()) == Some(true),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn method() -> Value {
        json!({
            "action": "create",
            "pathParams": [ { "name": "component", "type": {"kind":"scalar","scalar":"string"}, "required": true } ],
            "queryParams": [
                { "name": "model", "type": {"kind":"scalar","scalar":"string"}, "required": true },
                { "name": "tags", "type": {"kind":"array"}, "required": false }
            ],
            "x-cli": {
                "command": ["chat", "create"],
                "args": [ { "from": "param:component", "encoding": "string", "required": true } ],
                "options": [
                    { "flag": "--model", "from": "param:model", "encoding": "string" },
                    { "flag": "--tag", "from": "param:tags", "encoding": "string", "repeat": true },
                    { "flag": "--version" }
                ],
                "interactive": true
            }
        })
    }

    #[test]
    fn resolves_full_binding() {
        let plan = CliPlan::for_method(&method()).expect("plan");
        assert_eq!(plan.command, vec!["chat", "create"]);
        assert!(plan.interactive);
        assert_eq!(plan.args.len(), 1);
        assert_eq!(plan.args[0].param, "component");
        assert_eq!(plan.args[0].param_index, 0);
        assert!(plan.args[0].required);
        assert_eq!(plan.opts.len(), 3);
        assert_eq!(plan.opts[0].param_index, Some(0));
        assert!(plan.opts[1].repeat);
        assert_eq!(plan.opts[1].param.as_deref(), Some("tags"));
        assert!(plan.opts[2].param.is_none()); // constant flag
        assert_eq!(plan.opts[2].flag, "--version");
    }

    #[test]
    fn missing_x_cli_is_an_error() {
        let err = CliPlan::for_method(&json!({ "action": "list" })).unwrap_err();
        assert!(err.contains("no x-cli binding"), "{err}");
    }

    #[test]
    fn bad_from_token_is_an_error() {
        let mut m = method();
        m["x-cli"]["args"][0]["from"] = json!("arg:component");
        let err = CliPlan::for_method(&m).unwrap_err();
        assert!(err.contains("bad x-cli from token"), "{err}");
    }

    #[test]
    fn unknown_param_is_an_error() {
        let mut m = method();
        m["x-cli"]["options"][0]["from"] = json!("param:nope");
        let err = CliPlan::for_method(&m).unwrap_err();
        assert!(err.contains("unknown queryParam \"nope\""), "{err}");
    }

    #[test]
    fn unknown_encoding_is_an_error() {
        let mut m = method();
        m["x-cli"]["options"][0]["encoding"] = json!("base64");
        let err = CliPlan::for_method(&m).unwrap_err();
        assert!(err.contains("unknown x-cli encoding"), "{err}");
    }

    #[test]
    fn non_terminal_variadic_is_an_error() {
        let mut m = method();
        m["pathParams"] = json!([
            { "name": "files", "type": {"kind":"array"} },
            { "name": "dest", "type": {"kind":"scalar","scalar":"string"} }
        ]);
        m["x-cli"]["args"] = json!([
            { "from": "param:files", "encoding": "string", "variadic": true },
            { "from": "param:dest", "encoding": "string" }
        ]);
        let err = CliPlan::for_method(&m).unwrap_err();
        assert!(err.contains("must be the last positional"), "{err}");
    }
}
