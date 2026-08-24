//! x-openapi → request-model normalization — port of model.ts.

use serde_json::Value;

use crate::naming::snake_case;

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum FlagType {
    String,
    Int,
    Float,
    Bool,
    Slice,
    Json,
    File,
}

pub struct PathArg {
    pub var_name: String,
    pub arg_name: String,
    pub wire_name: String,
    #[allow(dead_code)]
    pub idx: usize,
}

pub struct FlagModel {
    pub flag_name: String,
    pub wire_name: String,
    pub location: String, // query | header | cookie | body
    pub flag_type: FlagType,
    pub required: bool,
    pub hidden: bool,
    pub aliases: Vec<String>,
    pub description: Option<String>,
    /// Non-API only: fixed accepted values (`.value_parser([...])`). NEVER set by
    /// `build_leaf_model`, so x-openapi flags stay byte-identical.
    pub accepted_values: Option<Vec<String>>,
    /// Non-API only: value arity (`.num_args(...)`). NEVER set by `build_leaf_model`.
    pub arity: Option<ArityModel>,
}

pub struct ArityModel {
    pub minimum: Option<i64>,
    pub maximum: Option<i64>,
}

pub struct LeafModel {
    pub method: String, // uppercase HTTP method
    pub path: String,
    pub path_args: Vec<PathArg>,
    pub flags: Vec<FlagModel>,
    pub has_body: bool,
    pub body_style: Option<String>,
    pub body_json_option: Option<String>,
}

/// `from` = "option:<name>" | "argument:<name>" → the name when `kind` matches.
fn from_token(from: Option<&str>, kind: &str) -> Option<String> {
    let from = from?;
    let (k, rest) = from.split_once(':')?;
    if k == kind {
        Some(rest.to_string())
    } else {
        None
    }
}

fn encoding_to_flag_type(encoding: Option<&str>) -> Option<FlagType> {
    match encoding {
        Some("integer") => Some(FlagType::Int),
        Some("number") => Some(FlagType::Float),
        Some("boolean") => Some(FlagType::Bool),
        Some("array") => Some(FlagType::Slice),
        Some("json") => Some(FlagType::Json),
        Some("file") => Some(FlagType::File),
        Some("string") => Some(FlagType::String),
        _ => None,
    }
}

fn option_flag_type(opt: &Value, encoding: Option<&str>) -> FlagType {
    let args = opt.get("arguments").and_then(|a| a.as_array());
    match args {
        None => return FlagType::Bool,
        Some(a) if a.is_empty() => return FlagType::Bool,
        _ => {}
    }
    if let Some(t) = encoding_to_flag_type(encoding) {
        return t;
    }
    let arg = &opt["arguments"][0];
    if arg.get("arity").is_some() {
        return FlagType::Slice;
    }
    match arg.get("name").and_then(|n| n.as_str()) {
        Some("integer") => FlagType::Int,
        Some("number") => FlagType::Float,
        Some("boolean") => FlagType::Bool,
        Some("json") => FlagType::Json,
        _ => FlagType::String,
    }
}

fn str_field(v: &Value, key: &str) -> Option<String> {
    v.get(key).and_then(|s| s.as_str()).map(|s| s.to_string())
}

/// Build the normalized request model for a leaf command from its x-openapi binding.
pub fn build_leaf_model(command: &Value) -> LeafModel {
    let x = command.get("x-openapi").cloned().unwrap_or(Value::Null);
    let empty: Vec<Value> = Vec::new();
    let params = x.get("params").and_then(|p| p.as_array()).unwrap_or(&empty);
    let body = x.get("body");

    let cmd_args = command
        .get("arguments")
        .and_then(|a| a.as_array())
        .unwrap_or(&empty);
    let path_args: Vec<PathArg> = cmd_args
        .iter()
        .enumerate()
        .map(|(idx, arg)| {
            let arg_name = arg
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or("")
                .to_string();
            let param = params.iter().find(|p| {
                p.get("in").and_then(|i| i.as_str()) == Some("path")
                    && from_token(p.get("from").and_then(|f| f.as_str()), "argument").as_deref()
                        == Some(&arg_name)
            });
            let wire_name = param
                .and_then(|p| str_field(p, "name"))
                .unwrap_or_else(|| arg_name.clone());
            PathArg {
                var_name: snake_case(&arg_name),
                arg_name,
                wire_name,
                idx,
            }
        })
        .collect();

    // body prop maps (flag -> encoding, flag -> wire)
    let mut body_prop_enc: Vec<(String, String)> = Vec::new(); // flag -> encoding
    let mut body_wire: Vec<(String, String)> = Vec::new(); // flag -> wire
    if let Some(props) = body
        .and_then(|b| b.get("properties"))
        .and_then(|p| p.as_array())
    {
        for prop in props {
            if let Some(flag) = from_token(prop.get("from").and_then(|f| f.as_str()), "option") {
                let enc = str_field(prop, "encoding").unwrap_or_else(|| "string".to_string());
                if !body_prop_enc.iter().any(|(k, _)| k == &flag) {
                    body_prop_enc.push((flag.clone(), enc));
                    body_wire.push((
                        flag.clone(),
                        str_field(prop, "name").unwrap_or_else(|| flag.clone()),
                    ));
                } else {
                    // Map.set overwrites; mirror last-write-wins.
                    for e in body_prop_enc.iter_mut() {
                        if e.0 == flag {
                            e.1 = enc.clone();
                        }
                    }
                    for w in body_wire.iter_mut() {
                        if w.0 == flag {
                            w.1 = str_field(prop, "name").unwrap_or_else(|| flag.clone());
                        }
                    }
                }
            }
        }
    }
    let get_enc = |flag: &str| {
        body_prop_enc
            .iter()
            .find(|(k, _)| k == flag)
            .map(|(_, v)| v.clone())
    };
    let get_wire = |flag: &str| {
        body_wire
            .iter()
            .find(|(k, _)| k == flag)
            .map(|(_, v)| v.clone())
    };

    let cmd_opts = command
        .get("options")
        .and_then(|o| o.as_array())
        .unwrap_or(&empty);
    let mut flags: Vec<FlagModel> = Vec::new();
    for opt in cmd_opts {
        let opt_name = opt
            .get("name")
            .and_then(|n| n.as_str())
            .unwrap_or("")
            .to_string();
        let param_entry = params.iter().find(|p| {
            from_token(p.get("from").and_then(|f| f.as_str()), "option").as_deref()
                == Some(&opt_name)
                && p.get("in").and_then(|i| i.as_str()) != Some("path")
        });

        let location: String;
        let wire_name: String;
        let mut encoding: Option<String> = None;

        if let Some(pe) = param_entry {
            location = str_field(pe, "in").unwrap_or_default();
            wire_name = str_field(pe, "name").unwrap_or_default();
        } else if get_enc(&opt_name).is_some() {
            location = "body".to_string();
            wire_name = get_wire(&opt_name).unwrap_or_else(|| opt_name.clone());
            encoding = get_enc(&opt_name);
        } else {
            location = "query".to_string();
            wire_name = opt_name.clone();
        }

        flags.push(FlagModel {
            flag_type: option_flag_type(opt, encoding.as_deref()),
            flag_name: opt_name,
            wire_name,
            location,
            required: opt.get("required").and_then(|r| r.as_bool()) == Some(true),
            hidden: opt.get("hidden").and_then(|h| h.as_bool()) == Some(true),
            aliases: opt
                .get("aliases")
                .and_then(|a| a.as_array())
                .map(|a| {
                    a.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default(),
            description: str_field(opt, "description"),
            accepted_values: None,
            arity: None,
        });
    }

    let body_style = body.and_then(|b| str_field(b, "style"));
    let body_json_option = if body_style.as_deref() == Some("json") {
        from_token(
            body.and_then(|b| b.get("from")).and_then(|f| f.as_str()),
            "option",
        )
        .or_else(|| {
            flags
                .iter()
                .find(|f| f.location == "body")
                .map(|f| f.flag_name.clone())
        })
    } else {
        None
    };
    let has_body = body.is_some()
        && (body_style.as_deref() == Some("json") || flags.iter().any(|f| f.location == "body"));

    let method = x
        .get("method")
        .and_then(|m| m.as_str())
        .unwrap_or("get")
        .to_uppercase();
    let path = x
        .get("path")
        .and_then(|p| p.as_str())
        .unwrap_or("")
        .to_string();

    LeafModel {
        method,
        path,
        path_args,
        flags,
        has_body,
        body_style,
        body_json_option,
    }
}

/// The `acceptedValues` of an OpenCLI argument, as a list (None when absent/empty).
pub fn accepted_values_of(arg: &Value) -> Option<Vec<String>> {
    arg.get("acceptedValues")
        .and_then(|a| a.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect::<Vec<_>>()
        })
        .filter(|v| !v.is_empty())
}

/// The `arity` of an OpenCLI argument, as an `ArityModel` (None when absent).
pub fn arity_of(arg: &Value) -> Option<ArityModel> {
    arg.get("arity")
        .filter(|a| a.is_object())
        .map(|a| ArityModel {
            minimum: a.get("minimum").and_then(|m| m.as_i64()),
            maximum: a.get("maximum").and_then(|m| m.as_i64()),
        })
}

/// Flags for a non-API "runnable leaf": mapped straight from the command's own
/// `options` (no x-openapi binding). `accepted_values`/`arity` carry through to the
/// clap emitter. `location`/`wire_name` are placeholders (never read for local leaves).
pub fn build_local_flags(command: &Value) -> Vec<FlagModel> {
    let empty: Vec<Value> = Vec::new();
    let opts = command
        .get("options")
        .and_then(|o| o.as_array())
        .unwrap_or(&empty);
    opts.iter()
        .map(|opt| {
            let arg = opt
                .get("arguments")
                .and_then(|a| a.as_array())
                .and_then(|a| a.first());
            let opt_name = opt
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or("")
                .to_string();
            FlagModel {
                flag_name: opt_name.clone(),
                wire_name: opt_name,
                location: "query".to_string(),
                flag_type: option_flag_type(opt, None),
                required: opt.get("required").and_then(|r| r.as_bool()) == Some(true),
                hidden: opt.get("hidden").and_then(|h| h.as_bool()) == Some(true),
                aliases: opt
                    .get("aliases")
                    .and_then(|a| a.as_array())
                    .map(|a| {
                        a.iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default(),
                description: str_field(opt, "description"),
                accepted_values: arg.and_then(accepted_values_of),
                arity: arg.and_then(arity_of),
            }
        })
        .collect()
}
