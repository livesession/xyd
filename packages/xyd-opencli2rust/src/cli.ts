// `src/gen/cli.rs` emission: the root clap tree, custom-command grafting, and
// the custom-first dispatch (a registered custom command overrides generated
// behavior on the same path).

import type { OpencliSpecJson } from '@xyd-js/opencli';

import type { ResourceFile } from './command';
import { chain, indent, lit, rsFile, rsStr, Uses, type RsVal } from './rslit';

export function renderCli(spec: OpencliSpecJson, binName: string, resources: ResourceFile[]): string {
  const calls: [string, RsVal[]][] = [];
  const usage = spec.info?.summary || spec.info?.description;
  if (usage) calls.push(['about', [rsStr(usage)]]);
  if (spec.info?.version) calls.push(['version', [rsStr(spec.info.version)]]);
  calls.push(['subcommand_required', [lit('true')]]);
  calls.push(['arg_required_else_help', [lit('true')]]);
  for (const r of resources) calls.push(['subcommand', [lit(`cmd::${r.modName}::command()`)]]);
  const root = chain(`clap::Command::new(${JSON.stringify(binName)})`, calls);

  const rootFn = `/// The generated root command tree.
pub fn root_command() -> clap::Command {
    ${root(1)}
}`;

  const arms = resources.map((r) => `Some(${JSON.stringify(r.cmdName)}) => cmd::${r.modName}::run(&ctx, &o, &cmd_path, leaf).await,`);
  const matchBody = [
    ...arms,
    '_ => {',
    '    eprintln!("error: unknown command: {}", cmd_path.join(" "));',
    '    ExitCode::FAILURE',
    '}',
  ].join('\n');

  const runFn = `/// Parse args, resolve the invoked command path, and dispatch — custom commands
/// first (so user registrations can override generated behavior), then the
/// generated handlers.
pub async fn run<O: CliOverrides>(o: O, customs: CustomCommands) -> ExitCode {
    let matches = customs.graft(root_command()).get_matches();
    let ctx = Context::from_env();
    let (cmd_path, leaf) = descend(&matches);

    if let Some(handler) = customs.find(&cmd_path) {
        return match handler(ctx.clone(), leaf.clone()).await {
            Ok(()) => ExitCode::SUCCESS,
            Err(err) => o.print_error(&cmd_path, &err),
        };
    }

    match cmd_path.first().map(String::as_str) {
${indent(matchBody, 2)}
    }
}`;

  const descendFn = `/// Walk matches to the invoked leaf, collecting the full command path.
fn descend(matches: &ArgMatches) -> (Vec<String>, &ArgMatches) {
    let mut path = Vec::new();
    let mut current = matches;
    while let Some((name, sub)) = current.subcommand() {
        path.push(name.to_string());
        current = sub;
    }
    (path, current)
}`;

  const uses = new Uses().add(
    'std::process::ExitCode',
    'clap::ArgMatches',
    'super::cmd',
    'super::runtime::{CliOverrides, Context, CustomCommands}',
  );
  return rsFile(uses, [rootFn, runFn, descendFn]);
}
