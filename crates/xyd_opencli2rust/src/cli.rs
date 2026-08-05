//! `src/gen/cli.rs` emission — port of cli.ts: the root clap tree, custom-command
//! grafting, and custom-first dispatch.

use serde_json::Value;

use crate::command::ResourceFile;
use crate::rslit::{chain, indent, json_str, lit, rs_file, rs_str, RsVal, Uses};

pub fn render_cli(spec: &Value, bin_name: &str, resources: &[ResourceFile]) -> String {
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

    let run_fn = format!(
        "/// Parse args, resolve the invoked command path, and dispatch — custom commands\n/// first (so user registrations can override generated behavior), then the\n/// generated handlers.\npub async fn run<O: CliOverrides>(o: O, customs: CustomCommands) -> ExitCode {{\n    let matches = customs.graft(root_command()).get_matches();\n    let ctx = Context::from_env();\n    let (cmd_path, leaf) = descend(&matches);\n\n    if let Some(handler) = customs.find(&cmd_path) {{\n        return match handler(ctx.clone(), leaf.clone()).await {{\n            Ok(()) => ExitCode::SUCCESS,\n            Err(err) => o.print_error(&cmd_path, &err),\n        }};\n    }}\n\n    match cmd_path.first().map(String::as_str) {{\n{}\n    }}\n}}",
        indent(&match_body, 2)
    );

    let descend_fn = "/// Walk matches to the invoked leaf, collecting the full command path.\nfn descend(matches: &ArgMatches) -> (Vec<String>, &ArgMatches) {\n    let mut path = Vec::new();\n    let mut current = matches;\n    while let Some((name, sub)) = current.subcommand() {\n        path.push(name.to_string());\n        current = sub;\n    }\n    (path, current)\n}".to_string();

    let mut uses = Uses::new();
    uses.add(&[
        "std::process::ExitCode",
        "clap::ArgMatches",
        "super::cmd",
        "super::runtime::{CliOverrides, Context, CustomCommands}",
    ]);
    rs_file(&uses, &[root_fn, run_fn, descend_fn])
}
