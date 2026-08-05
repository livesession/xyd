//! Per-resource file emission — port of command.ts.

use serde_json::Value;

use crate::flags::{render_flag_args, render_positional_arg};
use crate::handler::{render_handler, RenderedHandler};
use crate::model::build_leaf_model;
use crate::naming::snake_case;
use crate::rslit::{chain, indent, json_str, lit, rs_file, rs_str, RsVal, Uses};

struct Leaf {
    path_names: Vec<String>,
    command: Value,
}

struct State {
    has_arg: bool,
}

fn str_field(v: &Value, key: &str) -> Option<String> {
    v.get(key).and_then(|s| s.as_str()).map(|s| s.to_string())
}

fn aliases_of(command: &Value) -> Vec<String> {
    command
        .get("aliases")
        .and_then(|a| a.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default()
}

fn render_command_chain(
    command: &Value,
    path_names: &[String],
    leaves: &mut Vec<Leaf>,
    state: &mut State,
) -> RsVal {
    let mut calls: Vec<(String, Vec<RsVal>)> = Vec::new();
    let aliases = aliases_of(command);
    if aliases.len() == 1 {
        calls.push(("visible_alias".into(), vec![rs_str(&aliases[0])]));
    } else if aliases.len() > 1 {
        let list = aliases
            .iter()
            .map(|a| json_str(a))
            .collect::<Vec<_>>()
            .join(", ");
        calls.push(("visible_aliases".into(), vec![lit(format!("[{list}]"))]));
    }
    if let Some(desc) = str_field(command, "description") {
        calls.push(("about".into(), vec![rs_str(&desc)]));
    }
    if command.get("hidden").and_then(|h| h.as_bool()) == Some(true) {
        calls.push(("hide".into(), vec![lit("true")]));
    }

    let sub_cmds = command.get("commands").and_then(|c| c.as_array());
    if let Some(subs) = sub_cmds.filter(|s| !s.is_empty()) {
        calls.push(("subcommand_required".into(), vec![lit("true")]));
        calls.push(("arg_required_else_help".into(), vec![lit("true")]));
        for sub in subs {
            let sub_name = sub
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or("")
                .to_string();
            let mut child_names = path_names.to_vec();
            child_names.push(sub_name);
            let child = render_command_chain(sub, &child_names, leaves, state);
            calls.push(("subcommand".into(), vec![child]));
        }
    } else if command.get("x-openapi").is_some() {
        let model = build_leaf_model(command);
        if let Some(cmd_args) = command.get("arguments").and_then(|a| a.as_array()) {
            for arg in cmd_args {
                state.has_arg = true;
                let name = arg.get("name").and_then(|n| n.as_str()).unwrap_or("");
                let required = arg.get("required").and_then(|r| r.as_bool()) == Some(true);
                let desc = str_field(arg, "description");
                calls.push((
                    "arg".into(),
                    vec![render_positional_arg(name, required, desc.as_deref())],
                ));
            }
        }
        for flag_val in render_flag_args(&model.flags) {
            state.has_arg = true;
            calls.push(("arg".into(), vec![flag_val]));
        }
        leaves.push(Leaf {
            path_names: path_names.to_vec(),
            command: command.clone(),
        });
    } else {
        calls.push(("subcommand_required".into(), vec![lit("true")]));
        calls.push(("arg_required_else_help".into(), vec![lit("true")]));
    }

    let name = command.get("name").and_then(|n| n.as_str()).unwrap_or("");
    chain(format!("Command::new({})", json_str(name)), calls)
}

pub struct ResourceFile {
    pub path: String,
    pub content: String,
    pub mod_name: String,
    pub cmd_name: String,
}

/// Render one `src/gen/cmd/<resource>.rs` for a top-level command + its subtree.
pub fn render_resource_file(top_command: &Value) -> ResourceFile {
    let top_name = top_command
        .get("name")
        .and_then(|n| n.as_str())
        .unwrap_or("")
        .to_string();
    let mut leaves: Vec<Leaf> = Vec::new();
    let mut state = State { has_arg: false };
    let tree = render_command_chain(
        top_command,
        std::slice::from_ref(&top_name),
        &mut leaves,
        &mut state,
    );

    let mut handlers: Vec<RenderedHandler> = Vec::new();
    let mut arms: Vec<String> = Vec::new();
    for leaf in &leaves {
        let handler = render_handler(&leaf.path_names, &leaf.command);
        let pattern = format!(
            "[{}]",
            leaf.path_names
                .iter()
                .map(|n| json_str(n))
                .collect::<Vec<_>>()
                .join(", ")
        );
        arms.push(format!(
            "{pattern} => {}(ctx, o, cmd_path, m).await,",
            handler.name
        ));
        handlers.push(handler);
    }

    let command_fn = format!("pub fn command() -> Command {{\n    {}\n}}", tree.render(1));

    let params = if !leaves.is_empty() {
        "ctx: &Context, o: &O, cmd_path: &[String], m: &ArgMatches"
    } else {
        "_ctx: &Context, _o: &O, cmd_path: &[String], _m: &ArgMatches"
    };
    let mut match_lines = arms.clone();
    match_lines.push("_ => {".to_string());
    match_lines
        .push("    eprintln!(\"error: unknown command: {}\", cmd_path.join(\" \"));".to_string());
    match_lines.push("    ExitCode::FAILURE".to_string());
    match_lines.push("}".to_string());
    let match_body = match_lines.join("\n");
    let run_fn = format!(
        "pub async fn run<O: CliOverrides>({params}) -> ExitCode {{\n    let parts: Vec<&str> = cmd_path.iter().map(String::as_str).collect();\n    match parts.as_slice() {{\n{}\n    }}\n}}",
        indent(&match_body, 2)
    );

    let mut uses = Uses::new();
    uses.add(&["std::process::ExitCode"]);
    uses.add(&[if state.has_arg {
        "clap::{Arg, ArgMatches, Command}"
    } else {
        "clap::{ArgMatches, Command}"
    }]);
    uses.add(&["crate::gen::runtime::{self, CliOverrides, Context}"]);

    let mut decls = vec![command_fn, run_fn];
    decls.extend(handlers.into_iter().map(|h| h.code));
    let content = rs_file(&uses, &decls);

    let mod_name = snake_case(&top_name);
    ResourceFile {
        path: format!("src/gen/cmd/{mod_name}.rs"),
        content,
        mod_name,
        cmd_name: top_name,
    }
}
