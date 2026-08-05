//! Handler emission — port of handler.ts. Path args, guarded query/header
//! population, flatten-vs-json body assembly, ending in runtime::run_request.

use std::collections::HashSet;

use serde_json::Value;

use crate::model::{build_leaf_model, FlagModel, FlagType, LeafModel};
use crate::naming::snake_case;
use crate::rslit::{indent, json_str};

fn q(s: &str) -> String {
    json_str(s)
}

fn get_one(id: &str, t: FlagType) -> String {
    match t {
        FlagType::Bool => format!("m.get_one::<bool>({})", q(id)),
        FlagType::Int => format!("m.get_one::<i64>({})", q(id)),
        FlagType::Float => format!("m.get_one::<f64>({})", q(id)),
        _ => format!("m.get_one::<String>({})", q(id)), // string | json | file
    }
}

fn string_value(t: FlagType) -> &'static str {
    match t {
        FlagType::String | FlagType::Json | FlagType::File => "v.clone()",
        _ => "v.to_string()",
    }
}

/// Split a path keeping `{param}` tokens (mirrors JS `split(/(\{[^}]+\})/)`).
fn split_path_tokens(path: &str) -> Vec<String> {
    let chars: Vec<char> = path.chars().collect();
    let mut out: Vec<String> = Vec::new();
    let mut lit = String::new();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '{' {
            if let Some(close) = chars[i + 1..].iter().position(|&c| c == '}') {
                if close >= 1 {
                    if !lit.is_empty() {
                        out.push(std::mem::take(&mut lit));
                    }
                    let token: String = chars[i..=i + 1 + close].iter().collect();
                    out.push(token);
                    i = i + 1 + close + 1;
                    continue;
                }
            }
        }
        lit.push(chars[i]);
        i += 1;
    }
    if !lit.is_empty() {
        out.push(lit);
    }
    out
}

struct PathParts {
    fmt: String,
    args: Vec<String>,
    used_vars: HashSet<String>,
}

fn path_parts(model: &LeafModel) -> PathParts {
    let segs = split_path_tokens(&model.path);
    let mut fmt = String::new();
    let mut args: Vec<String> = Vec::new();
    let mut used_vars: HashSet<String> = HashSet::new();
    for seg in segs {
        let is_token = seg.starts_with('{') && seg.ends_with('}') && seg.len() >= 3;
        if is_token {
            let inner = &seg[1..seg.len() - 1];
            fmt.push_str("{}");
            if let Some(a) = model.path_args.iter().find(|p| p.wire_name == inner) {
                args.push(format!("runtime::path_escape({})", a.var_name));
                used_vars.insert(a.var_name.clone());
            } else {
                args.push("\"\"".to_string());
            }
        } else {
            fmt.push_str(&seg.replace('{', "{{").replace('}', "}}"));
        }
    }
    PathParts {
        fmt,
        args,
        used_vars,
    }
}

/// Guarded param population for query/header/cookie flags.
fn param_lines(flags: &[&FlagModel], target: &str) -> Vec<String> {
    let mut lines: Vec<String> = Vec::new();
    for f in flags {
        if f.flag_type == FlagType::Slice {
            lines.push(format!(
                "if let Some(vs) = m.get_many::<String>({}) {{",
                q(&f.flag_name)
            ));
            lines.push(format!(
                "    {target}.push(({}, vs.cloned().collect::<Vec<_>>().join(\",\")));",
                q(&f.wire_name)
            ));
            lines.push("}".to_string());
        } else {
            lines.push(format!(
                "if let Some(v) = {} {{",
                get_one(&f.flag_name, f.flag_type)
            ));
            lines.push(format!(
                "    {target}.push(({}, {}));",
                q(&f.wire_name),
                string_value(f.flag_type)
            ));
            lines.push("}".to_string());
        }
    }
    lines
}

pub struct RenderedHandler {
    pub name: String,
    pub code: String,
}

/// Render the async handler fn for a leaf command from its x-openapi binding.
pub fn render_handler(path_names: &[String], command: &Value) -> RenderedHandler {
    let model = build_leaf_model(command);
    let mut joined = vec!["handle".to_string()];
    joined.extend(path_names.iter().cloned());
    let name = snake_case(&joined.join("-"));

    let mut lines: Vec<String> = Vec::new();

    // Path params — only read the ones the path actually uses.
    let PathParts {
        fmt,
        args,
        used_vars,
    } = path_parts(&model);
    for a in &model.path_args {
        if used_vars.contains(&a.var_name) {
            lines.push(format!(
                "let {} = m.get_one::<String>({}).map(String::as_str).unwrap_or(\"\");",
                a.var_name,
                q(&a.arg_name)
            ));
        }
    }
    if !args.is_empty() {
        lines.push(format!(
            "let path = format!({}, {});",
            q(&fmt),
            args.join(", ")
        ));
    } else {
        lines.push(format!("let path = {}.to_string();", q(&model.path)));
    }

    // Query params.
    let query_flags: Vec<&FlagModel> = model
        .flags
        .iter()
        .filter(|f| f.location == "query")
        .collect();
    if !query_flags.is_empty() {
        lines.push("let mut query: Vec<(&'static str, String)> = Vec::new();".to_string());
        lines.extend(param_lines(&query_flags, "query"));
    }

    // Header / cookie params.
    let header_flags: Vec<&FlagModel> = model
        .flags
        .iter()
        .filter(|f| f.location == "header" || f.location == "cookie")
        .collect();
    if !header_flags.is_empty() {
        lines.push("let mut headers: Vec<(&'static str, String)> = Vec::new();".to_string());
        lines.extend(param_lines(&header_flags, "headers"));
    }

    // Body.
    let mut body_expr: Option<String> = None;
    if model.has_body {
        if model.body_style.as_deref() == Some("json") && model.body_json_option.is_some() {
            let opt = model.body_json_option.as_ref().unwrap();
            lines.push(format!(
                "let body_bytes = m.get_one::<String>({}).map(|v| v.clone().into_bytes());",
                q(opt)
            ));
            body_expr = Some("body_bytes".to_string());
        } else {
            lines.push("let mut body = serde_json::Map::new();".to_string());
            for f in model.flags.iter().filter(|x| x.location == "body") {
                if f.flag_type == FlagType::Slice {
                    lines.push(format!(
                        "if let Some(vs) = m.get_many::<String>({}) {{",
                        q(&f.flag_name)
                    ));
                    lines.push(format!(
                        "    body.insert({}.to_string(), serde_json::Value::Array(vs.cloned().map(serde_json::Value::String).collect()));",
                        q(&f.wire_name)
                    ));
                    lines.push("}".to_string());
                } else if f.flag_type == FlagType::Json {
                    lines.push(format!(
                        "if let Some(v) = m.get_one::<String>({}) {{",
                        q(&f.flag_name)
                    ));
                    lines.push(
                        "    let value = serde_json::from_str::<serde_json::Value>(v)".to_string(),
                    );
                    lines.push(
                        "        .unwrap_or_else(|_| serde_json::Value::String(v.clone()));"
                            .to_string(),
                    );
                    lines.push(format!(
                        "    body.insert({}.to_string(), value);",
                        q(&f.wire_name)
                    ));
                    lines.push("}".to_string());
                } else {
                    let value = match f.flag_type {
                        FlagType::Int | FlagType::Float => "serde_json::Value::from(*v)",
                        FlagType::Bool => "serde_json::Value::Bool(*v)",
                        _ => "serde_json::Value::String(v.clone())",
                    };
                    lines.push(format!(
                        "if let Some(v) = {} {{",
                        get_one(&f.flag_name, f.flag_type)
                    ));
                    lines.push(format!(
                        "    body.insert({}.to_string(), {});",
                        q(&f.wire_name),
                        value
                    ));
                    lines.push("}".to_string());
                }
            }
            lines.push(
                "let body_bytes = match serde_json::to_vec(&serde_json::Value::Object(body)) {"
                    .to_string(),
            );
            lines.push("    Ok(bytes) => bytes,".to_string());
            lines.push("    Err(err) => return o.print_error(cmd_path, &runtime::Error::Invalid(err.to_string())),".to_string());
            lines.push("};".to_string());
            body_expr = Some("Some(body_bytes)".to_string());
        }
    }

    // Assemble the request.
    lines.push("let req = runtime::Request {".to_string());
    lines.push(format!("    method: {},", q(&model.method)));
    lines.push("    path,".to_string());
    lines.push(if !query_flags.is_empty() {
        "    query,".to_string()
    } else {
        "    query: Vec::new(),".to_string()
    });
    lines.push(if !header_flags.is_empty() {
        "    headers,".to_string()
    } else {
        "    headers: Vec::new(),".to_string()
    });
    lines.push(match &body_expr {
        Some(e) => format!("    body: {e},"),
        None => "    body: None,".to_string(),
    });
    lines.push("};".to_string());
    lines.push("runtime::run_request(ctx, o, cmd_path, req).await".to_string());

    let reads_matches = !used_vars.is_empty() || !model.flags.is_empty();
    let m_param = if reads_matches { "m" } else { "_m" };
    let code = format!(
        "async fn {name}<O: CliOverrides>(\n    ctx: &Context,\n    o: &O,\n    cmd_path: &[String],\n    {m_param}: &ArgMatches,\n) -> ExitCode {{\n{}\n}}",
        indent(&lines.join("\n"), 1)
    );
    RenderedHandler { name, code }
}
