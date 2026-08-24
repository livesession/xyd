//! `src/gen/cli.rs` emission — port of cli.ts: the root clap tree, custom-command
//! grafting, and custom-first dispatch.

use serde_json::Value;

use crate::command::ResourceFile;
use crate::rslit::{chain, indent, json_str, lit, rs_file, rs_str, RsVal, Uses};

pub fn render_cli(
    spec: &Value,
    bin_name: &str,
    resources: &[ResourceFile],
    action_paths: &[Vec<String>],
) -> String {
    let has_actions = !action_paths.is_empty();
    let info = spec.get("info");
    let mut calls: Vec<(String, Vec<RsVal>)> = Vec::new();
    let usage = info
        .and_then(|i| i.get("summary").and_then(|s| s.as_str()))
        .or_else(|| info.and_then(|i| i.get("description").and_then(|s| s.as_str())));
    if let Some(usage) = usage {
        calls.push(("about".into(), vec![rs_str(usage)]));
    }
    if let Some(version) = info.and_then(|i| i.get("version").and_then(|v| v.as_str())) {
        calls.push(("version".into(), vec![rs_str(version)]));
    }
    calls.push(("subcommand_required".into(), vec![lit("true")]));
    calls.push(("arg_required_else_help".into(), vec![lit("true")]));
    for r in resources {
        calls.push((
            "subcommand".into(),
            vec![lit(format!("cmd::{}::command()", r.mod_name))],
        ));
    }
    let root = chain(format!("clap::Command::new({})", json_str(bin_name)), calls);

    let root_fn = format!(
        "/// The generated root command tree.\npub fn root_command() -> clap::Command {{\n    {}\n}}",
        root.render(1)
    );

    let arms: Vec<String> = resources
        .iter()
        .map(|r| {
            format!(
                "Some({}) => cmd::{}::run(&ctx, &o, &cmd_path, leaf).await,",
                json_str(&r.cmd_name),
                r.mod_name
            )
        })
        .collect();
    let mut match_lines = arms;
    match_lines.push("_ => {".to_string());
    match_lines
        .push("    eprintln!(\"error: unknown command: {}\", cmd_path.join(\" \"));".to_string());
    match_lines.push("    ExitCode::FAILURE".to_string());
    match_lines.push("}".to_string());
    let match_body = match_lines.join("\n");

    // Non-API leaf dispatch, threaded between the custom-command check and the
    // x-openapi handlers. Only present when the doc has runnable leaves.
    let actions_param = if has_actions {
        ", actions: Actions"
    } else {
        ""
    };
    let dispatch_note = if has_actions {
        "/// first (so user registrations can override generated behavior), then non-API\n/// leaf actions, then the generated handlers."
    } else {
        "/// first (so user registrations can override generated behavior), then the\n/// generated handlers."
    };
    let actions_dispatch = if has_actions {
        "\n    if is_action_path(&cmd_path) {\n        return match actions.run(&ctx, &cmd_path, leaf).await {\n            Ok(()) => ExitCode::SUCCESS,\n            Err(err) => o.print_error(&cmd_path, &err),\n        };\n    }\n"
    } else {
        ""
    };

    let run_fn = format!(
        "/// Parse args, resolve the invoked command path, and dispatch — custom commands\n{dispatch_note}\npub async fn run<O: CliOverrides>(o: O, customs: CustomCommands{actions_param}) -> ExitCode {{\n    let matches = customs.graft(root_command()).get_matches();\n    let ctx = Context::from_env();\n    let (cmd_path, leaf) = descend(&matches);\n\n    if let Some(handler) = customs.find(&cmd_path) {{\n        return match handler(ctx.clone(), leaf.clone()).await {{\n            Ok(()) => ExitCode::SUCCESS,\n            Err(err) => o.print_error(&cmd_path, &err),\n        }};\n    }}\n{actions_dispatch}\n    match cmd_path.first().map(String::as_str) {{\n{}\n    }}\n}}",
        indent(&match_body, 2)
    );

    let descend_fn = "/// Walk matches to the invoked leaf, collecting the full command path.\nfn descend(matches: &ArgMatches) -> (Vec<String>, &ArgMatches) {\n    let mut path = Vec::new();\n    let mut current = matches;\n    while let Some((name, sub)) = current.subcommand() {\n        path.push(name.to_string());\n        current = sub;\n    }\n    (path, current)\n}".to_string();

    let mut decls = vec![root_fn, run_fn, descend_fn];
    if has_actions {
        decls.push(render_is_action_path(action_paths));
    }

    let mut uses = Uses::new();
    uses.add(&[
        "std::process::ExitCode",
        "clap::ArgMatches",
        "super::cmd",
        if has_actions {
            "super::runtime::{Actions, CliOverrides, Context, CustomCommands}"
        } else {
            "super::runtime::{CliOverrides, Context, CustomCommands}"
        },
    ]);
    rs_file(&uses, &decls)
}

/// A `matches!` over the known non-API leaf paths, so `run()` only sends those to `Actions`.
fn render_is_action_path(action_paths: &[Vec<String>]) -> String {
    let patterns = action_paths
        .iter()
        .map(|p| {
            format!(
                "[{}]",
                p.iter().map(|n| json_str(n)).collect::<Vec<_>>().join(", ")
            )
        })
        .collect::<Vec<_>>()
        .join("\n| ");
    format!(
        "/// Whether `path` is one of the generated non-API leaves handled by `Actions`.\nfn is_action_path(path: &[String]) -> bool {{\n    let parts: Vec<&str> = path.iter().map(String::as_str).collect();\n    matches!(\n        parts.as_slice(),\n{}\n    )\n}}",
        indent(&patterns, 2)
    )
}
