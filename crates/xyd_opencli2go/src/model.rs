//! LeafModel builder — port of model.ts. Normalizes a leaf command's
//! x-openapi binding into the request model the handler/flags render from.

use serde_json::Value;

use crate::naming::go_var;

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum GoType {
    String,
    Int,
    Float,
    Bool,
    Slice,
    Json,
    File,
}

impl GoType {
    /// cli.<X>Flag type (flags.ts FLAG_TYPE).
    pub fn flag_type(self) -> &'static str {
        match self {
            GoType::Bool => "BoolFlag",
            GoType::Int => "IntFlag",
            GoType::Float => "FloatFlag",
            GoType::Slice => "StringSliceFlag",
            GoType::String | GoType::Json | GoType::File => "StringFlag",
        }
    }
}

pub struct PathArg {
    pub go_var: String,
    pub wire_name: String,
    pub idx: usize,
}

pub struct FlagModel {
    pub flag_name: String,
    pub wire_name: String,
    pub location: String, // query | header | cookie | body
    pub go_type: GoType,
    pub required: bool,
    pub hidden: bool,
    pub aliases: Vec<String>,
    pub description: Option<String>,
}

pub struct LeafModel {
    pub method: String,
    pub path: String,
    pub path_args: Vec<PathArg>,
    pub flags: Vec<FlagModel>,
    pub has_body: bool,
    pub body_style: Option<String>,
    pub body_json_option: Option<String>,
}

/// `from` = "<kind>:<rest>"; returns rest when kind matches.
fn from_token(from: Option<&str>, kind: &str) -> Option<String> {
    let from = from?;
    let mut parts = from.split(':');
    let k = parts.next()?;
    if k == kind {
        Some(parts.collect::<Vec<_>>().join(":"))
    } else {
        None
    }
}

fn encoding_to_go_type(encoding: Option<&str>) -> Option<GoType> {
    match encoding? {
        "integer" => Some(GoType::Int),
        "number" => Some(GoType::Float),
        "boolean" => Some(GoType::Bool),
        "array" => Some(GoType::Slice),
        "json" => Some(GoType::Json),
        "file" => Some(GoType::File),
        "string" => Some(GoType::String),
        _ => None,
    }
}

fn option_go_type(opt: &Value, encoding: Option<&str>) -> GoType {
    let args = opt.get("arguments").and_then(|a| a.as_array());
    let args = match args {
        Some(a) if !a.is_empty() => a,
        _ => return GoType::Bool,
    };
    if let Some(t) = encoding_to_go_type(encoding) {
        return t;
    }
    let arg = &args[0];
    if arg.get("arity").is_some() {
        return GoType::Slice;
    }
    match arg.get("name").and_then(|n| n.as_str()) {
        Some("integer") => GoType::Int,
        Some("number") => GoType::Float,
        Some("boolean") => GoType::Bool,
        Some("json") => GoType::Json,
        _ => GoType::String,
    }
}

fn params_of(x: &Value) -> Vec<&Value> {
    x.get("params")
        .and_then(|p| p.as_array())
        .map(|a| a.iter().collect())
        .unwrap_or_default()
}

pub fn build_leaf_model(command: &Value) -> LeafModel {
    let x = command.get("x-openapi").cloned().unwrap_or(Value::Null);
    let params = params_of(&x);
    let body = x.get("body");

    let arguments = command
        .get("arguments")
        .and_then(|a| a.as_array())
        .cloned()
        .unwrap_or_default();
    let path_args: Vec<PathArg> = arguments
        .iter()
        .enumerate()
        .map(|(idx, arg)| {
            let arg_name = arg.get("name").and_then(|n| n.as_str()).unwrap_or("");
            let param = params.iter().find(|p| {
                p.get("in").and_then(|v| v.as_str()) == Some("path")
                    && from_token(p.get("from").and_then(|f| f.as_str()), "argument").as_deref()
                        == Some(arg_name)
            });
            let wire_name = param
                .and_then(|p| p.get("name").and_then(|n| n.as_str()))
                .unwrap_or(arg_name)
                .to_string();
            PathArg {
                go_var: go_var(arg_name),
                wire_name,
                idx,
            }
        })
        .collect();

    // body prop maps: flagName -> encoding / wire name.
    let mut body_prop_by_option: std::collections::HashMap<String, String> = Default::default();
    let mut body_wire_by_option: std::collections::HashMap<String, String> = Default::default();
    if let Some(props) = body
        .and_then(|b| b.get("properties"))
        .and_then(|p| p.as_array())
    {
        for prop in props {
            if let Some(flag) = from_token(prop.get("from").and_then(|f| f.as_str()), "option") {
                let enc = prop
                    .get("encoding")
                    .and_then(|e| e.as_str())
                    .unwrap_or("string")
                    .to_string();
                let wire = prop
                    .get("name")
                    .and_then(|n| n.as_str())
                    .unwrap_or(&flag)
                    .to_string();
                body_prop_by_option.insert(flag.clone(), enc);
                body_wire_by_option.insert(flag, wire);
            }
        }
    }

    let mut flags: Vec<FlagModel> = Vec::new();
    let options = command
        .get("options")
        .and_then(|o| o.as_array())
        .cloned()
        .unwrap_or_default();
    for opt in &options {
        let opt_name = opt
            .get("name")
            .and_then(|n| n.as_str())
            .unwrap_or("")
            .to_string();
        let param_entry = params.iter().find(|p| {
            from_token(p.get("from").and_then(|f| f.as_str()), "option").as_deref()
                == Some(&opt_name)
                && p.get("in").and_then(|v| v.as_str()) != Some("path")
        });

        let (location, wire_name, encoding): (String, String, Option<String>) =
            if let Some(pe) = param_entry {
                (
                    pe.get("in")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string(),
                    pe.get("name")
                        .and_then(|n| n.as_str())
                        .unwrap_or("")
                        .to_string(),
                    None,
                )
            } else if body_prop_by_option.contains_key(&opt_name) {
                (
                    "body".to_string(),
                    body_wire_by_option
                        .get(&opt_name)
                        .cloned()
                        .unwrap_or_else(|| opt_name.clone()),
                    body_prop_by_option.get(&opt_name).cloned(),
                )
            } else {
                ("query".to_string(), opt_name.clone(), None)
            };

        flags.push(FlagModel {
            flag_name: opt_name.clone(),
            wire_name,
            location,
            go_type: option_go_type(opt, encoding.as_deref()),
            required: opt.get("required") == Some(&Value::Bool(true)),
            hidden: opt.get("hidden") == Some(&Value::Bool(true)),
            aliases: opt
                .get("aliases")
                .and_then(|a| a.as_array())
                .map(|a| {
                    a.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default(),
            description: opt
                .get("description")
                .and_then(|d| d.as_str())
                .map(String::from),
        });
    }

    let body_style = body
        .and_then(|b| b.get("style"))
        .and_then(|s| s.as_str())
        .map(String::from);
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

    LeafModel {
        method: x
            .get("method")
            .and_then(|m| m.as_str())
            .unwrap_or("get")
            .to_uppercase(),
        path: x
            .get("path")
            .and_then(|p| p.as_str())
            .unwrap_or("")
            .to_string(),
        path_args,
        flags,
        has_body,
        body_style,
        body_json_option,
    }
}
