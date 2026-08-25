//! Leaf-command → Method construction: typed params (positionals as
//! `pathParams`, flag-bound options as `queryParams`) plus the x-cli argv
//! binding that is the emitters' source of truth.

use std::collections::HashSet;

use serde_json::Value;

use crate::binding::{argument_shape, flag_token, option_shape};
use crate::jsrt::{camel_case, kebab_case};
use crate::model::{Method, Param, Response, XCliArg, XCliMethod, XCliOpt};
use crate::nominal::TypeRegistry;
use crate::options::Options;

/// A `recursive: true` option flowing down from an ancestor, with the context
/// it was declared in (for enum type naming).
pub struct InheritedOpt {
    pub value: Value,
    pub context: Vec<String>,
}

fn str_of(v: &Value, key: &str) -> Option<String> {
    v.get(key)
        .and_then(|s| s.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
}

fn is_hidden(v: &Value) -> bool {
    v.get("hidden").and_then(|h| h.as_bool()) == Some(true)
}

/// `metadata: [{name, value}]` → the `example` entry's value, if any.
fn metadata_example(v: &Value) -> Option<Value> {
    let meta = v.get("metadata")?.as_array()?;
    meta.iter()
        .find(|m| m.get("name").and_then(|n| n.as_str()) == Some("example"))
        .and_then(|m| m.get("value"))
        .cloned()
}

fn exit_codes(command: &Value) -> (Option<Vec<Response>>, Option<Value>) {
    let Some(codes) = command.get("exitCodes").and_then(|c| c.as_array()) else {
        return (None, None);
    };
    if codes.is_empty() {
        return (None, None);
    }
    let responses: Vec<Response> = codes
        .iter()
        .filter_map(|c| {
            let status = match c.get("code") {
                Some(Value::Number(n)) => n.to_string(),
                Some(Value::String(s)) => s.clone(),
                _ => return None,
            };
            Some(Response {
                status,
                description: str_of(c, "description"),
            })
        })
        .collect();
    let raw = Value::Array(codes.clone());
    if responses.is_empty() {
        (None, Some(raw))
    } else {
        (Some(responses), Some(raw))
    }
}

/// Build a Method for a runnable command. `command_tokens` are the verbatim
/// subcommand names root→here (empty for the root exec method); `inherited`
/// is the ancestor `recursive: true` option stack (excludes already applied).
pub fn build_method(
    command: &Value,
    action: String,
    command_tokens: Vec<String>,
    inherited: &[InheritedOpt],
    registry: &mut TypeRegistry,
    options: &Options,
) -> Method {
    let mut path_params: Vec<Param> = Vec::new();
    let mut query_params: Vec<Param> = Vec::new();
    let mut arg_bindings: Vec<XCliArg> = Vec::new();
    let mut opt_bindings: Vec<XCliOpt> = Vec::new();
    let mut used_positional: HashSet<String> = HashSet::new();
    let mut used_flag_names: HashSet<String> = HashSet::new();

    // Positionals, in declaration order.
    if let Some(args) = command.get("arguments").and_then(|a| a.as_array()) {
        for arg in args {
            let Some(name) = str_of(arg, "name") else {
                continue;
            };
            if is_hidden(arg) && !options.include_hidden() {
                continue;
            }
            let param_name = camel_case(&name);
            if !used_positional.insert(param_name.clone()) {
                continue;
            }
            let mut context = command_tokens.clone();
            context.push(name.clone());
            let shape = argument_shape(arg, &context, registry);
            path_params.push(Param {
                name: param_name.clone(),
                param_type: shape.type_ref,
                required: shape.required,
                wire_name: (param_name != name).then_some(name),
                description: str_of(arg, "description"),
                default: None,
                example: metadata_example(arg),
            });
            arg_bindings.push(XCliArg {
                from: format!("param:{param_name}"),
                encoding: shape.encoding.to_string(),
                required: shape.required.then_some(true),
                variadic: shape.variadic.then_some(true),
            });
        }
    }

    // Own options first (declaration order), then inherited (own shadow by
    // canonical name).
    let own_options: Vec<(Value, Vec<String>)> = command
        .get("options")
        .and_then(|o| o.as_array())
        .map(|opts| {
            opts.iter()
                .map(|o| {
                    let mut context = command_tokens.clone();
                    if let Some(n) = str_of(o, "name") {
                        context.push(n);
                    }
                    (o.clone(), context)
                })
                .collect()
        })
        .unwrap_or_default();
    let inherited_options = inherited
        .iter()
        .map(|i| (i.value.clone(), i.context.clone()));

    for (opt, context) in own_options.into_iter().chain(inherited_options) {
        let Some(name) = str_of(&opt, "name") else {
            continue;
        };
        if is_hidden(&opt) && !options.include_hidden() {
            continue;
        }
        if !used_flag_names.insert(name.clone()) {
            continue; // shadowed (or duplicate)
        }
        let param_name = camel_case(&name);
        let shape = option_shape(&opt, &context, registry);
        query_params.push(Param {
            name: param_name.clone(),
            param_type: shape.type_ref,
            required: opt.get("required").and_then(|r| r.as_bool()) == Some(true),
            wire_name: (param_name != name).then_some(name.clone()),
            description: str_of(&opt, "description"),
            default: None,
            example: metadata_example(&opt),
        });
        opt_bindings.push(XCliOpt {
            flag: flag_token(&name),
            from: Some(format!("param:{param_name}")),
            encoding: Some(shape.encoding.to_string()),
            repeat: shape.repeat.then_some(true),
        });
    }

    let (responses, raw_exit_codes) = exit_codes(command);

    Method {
        action,
        description: str_of(command, "description"),
        path_params: (!path_params.is_empty()).then_some(path_params),
        query_params: (!query_params.is_empty()).then_some(query_params),
        responses,
        primary_response: TypeRegistry::command_result_ref(),
        x_cli: XCliMethod {
            command: command_tokens,
            args: (!arg_bindings.is_empty()).then_some(arg_bindings),
            options: (!opt_bindings.is_empty()).then_some(opt_bindings),
            interactive: (command.get("interactive").and_then(|i| i.as_bool()) == Some(true))
                .then_some(true),
            exit_codes: raw_exit_codes,
        },
    }
}

/// Build an opt-method for a root option that is not materialized as an
/// inherited param (`xyd --version` → `optVersion()`): no params, a single
/// constant-flag binding.
pub fn build_opt_method(opt: &Value) -> Option<Method> {
    let name = str_of(opt, "name")?;
    Some(Method {
        action: format!("opt-{}", kebab_case(&name)),
        description: str_of(opt, "description"),
        path_params: None,
        query_params: None,
        responses: None,
        primary_response: TypeRegistry::command_result_ref(),
        x_cli: XCliMethod {
            command: Vec::new(),
            args: None,
            options: Some(vec![XCliOpt {
                flag: flag_token(&name),
                from: None,
                encoding: None,
                repeat: None,
            }]),
            interactive: None,
            exit_codes: None,
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn toks(parts: &[&str]) -> Vec<String> {
        parts.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn opt_method_naming_and_binding() {
        let m = build_opt_method(&json!({"name": "version", "description": "d"})).unwrap();
        assert_eq!(m.action, "opt-version");
        assert!(m.x_cli.command.is_empty());
        let opts = m.x_cli.options.unwrap();
        assert_eq!(opts[0].flag, "--version");
        assert!(opts[0].from.is_none());
    }

    #[test]
    fn own_options_shadow_inherited() {
        let cmd = json!({
            "name": "run",
            "options": [{"name": "verbose", "description": "own"}]
        });
        let inherited = vec![InheritedOpt {
            value: json!({"name": "verbose", "description": "root"}),
            context: toks(&["verbose"]),
        }];
        let m = build_method(
            &cmd,
            "run".into(),
            toks(&["run"]),
            &inherited,
            &mut TypeRegistry::new(),
            &Options::default(),
        );
        let q = m.query_params.unwrap();
        assert_eq!(q.len(), 1);
        assert_eq!(q[0].description.as_deref(), Some("own"));
    }

    #[test]
    fn inherited_options_append_after_own() {
        let cmd = json!({
            "name": "build",
            "options": [{"name": "outDir", "arguments": [{"name": "string"}]}]
        });
        let inherited = vec![InheritedOpt {
            value: json!({"name": "verbose"}),
            context: toks(&["verbose"]),
        }];
        let m = build_method(
            &cmd,
            "build".into(),
            toks(&["build"]),
            &inherited,
            &mut TypeRegistry::new(),
            &Options::default(),
        );
        let q = m.query_params.unwrap();
        assert_eq!(q[0].name, "outDir");
        assert!(q[0].wire_name.is_none()); // camelCase(outDir) == outDir
        assert_eq!(q[1].name, "verbose");
        let b = m.x_cli.options.unwrap();
        assert_eq!(b[0].flag, "--outDir");
        assert_eq!(b[1].flag, "--verbose");
        assert_eq!(b[1].encoding.as_deref(), Some("boolean"));
    }
}
