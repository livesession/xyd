// Per-resource file emission (the command.ts mirror from opencli2go): one
// `src/gen/cmd/<resource>.rs` per top-level command with a clap builder tree,
// a flat command-path dispatch, and the leaf handlers.

import type { Command } from '@xyd-js/opencli';

import { renderFlagArgs, renderPositionalArg } from './flags';
import { renderHandler, type RenderedHandler } from './handler';
import { buildLeafModel } from './model';
import { snakeCase } from './naming';
import { chain, indent, lit, rsFile, rsStr, Uses, type RsVal } from './rslit';

interface Leaf {
  pathNames: string[];
  command: Command;
}

function renderCommandChain(command: Command, pathNames: string[], leaves: Leaf[], state: { hasArg: boolean }): RsVal {
  const calls: [string, RsVal[]][] = [];
  if (command.aliases?.length === 1) calls.push(['visible_alias', [rsStr(command.aliases[0])]]);
  else if (command.aliases?.length)
    calls.push(['visible_aliases', [lit(`[${command.aliases.map((a) => JSON.stringify(a)).join(', ')}]`)]]);
  if (command.description) calls.push(['about', [rsStr(command.description)]]);
  if (command.hidden) calls.push(['hide', [lit('true')]]);

  if (command.commands?.length) {
    calls.push(['subcommand_required', [lit('true')]]);
    calls.push(['arg_required_else_help', [lit('true')]]);
    for (const sub of command.commands) {
      calls.push(['subcommand', [renderCommandChain(sub, [...pathNames, sub.name], leaves, state)]]);
    }
  } else if (command['x-openapi']) {
    const model = buildLeafModel(command);
    for (const arg of command.arguments || []) {
      state.hasArg = true;
      calls.push(['arg', [renderPositionalArg(arg)]]);
    }
    for (const flagVal of renderFlagArgs(model.flags)) {
      state.hasArg = true;
      calls.push(['arg', [flagVal]]);
    }
    leaves.push({ pathNames, command });
  } else {
    // A doc-only command with neither subcommands nor a binding: let clap show help.
    calls.push(['subcommand_required', [lit('true')]]);
    calls.push(['arg_required_else_help', [lit('true')]]);
  }

  return chain(`Command::new(${JSON.stringify(command.name)})`, calls);
}

export interface ResourceFile {
  path: string;
  content: string;
  /** Rust module name (snake_case, keyword-guarded) — the file base + `cmd::<modName>`. */
  modName: string;
  /** The raw command name, for the dispatch match in gen/cli.rs. */
  cmdName: string;
}

/** Render one `src/gen/cmd/<resource>.rs` for a top-level command + its subtree. */
export function renderResourceFile(topCommand: Command): ResourceFile {
  const leaves: Leaf[] = [];
  const state = { hasArg: false };
  const tree = renderCommandChain(topCommand, [topCommand.name], leaves, state);

  const handlers: RenderedHandler[] = [];
  const arms: string[] = [];
  for (const leaf of leaves) {
    const handler = renderHandler(leaf.pathNames, leaf.command);
    handlers.push(handler);
    const pattern = `[${leaf.pathNames.map((n) => JSON.stringify(n)).join(', ')}]`;
    arms.push(`${pattern} => ${handler.name}(ctx, o, cmd_path, m).await,`);
  }

  const commandFn = `pub fn command() -> Command {
    ${tree(1)}
}`;

  const params = leaves.length
    ? 'ctx: &Context, o: &O, cmd_path: &[String], m: &ArgMatches'
    : '_ctx: &Context, _o: &O, cmd_path: &[String], _m: &ArgMatches';
  const matchBody = [
    ...arms,
    '_ => {',
    '    eprintln!("error: unknown command: {}", cmd_path.join(" "));',
    '    ExitCode::FAILURE',
    '}',
  ].join('\n');
  const runFn = `pub async fn run<O: CliOverrides>(${params}) -> ExitCode {
    let parts: Vec<&str> = cmd_path.iter().map(String::as_str).collect();
    match parts.as_slice() {
${indent(matchBody, 2)}
    }
}`;

  const uses = new Uses().add('std::process::ExitCode');
  uses.add(state.hasArg ? 'clap::{Arg, ArgMatches, Command}' : 'clap::{ArgMatches, Command}');
  uses.add('crate::gen::runtime::{self, CliOverrides, Context}');
  const content = rsFile(uses, [commandFn, runFn, ...handlers.map((h) => h.code)]);

  const modName = snakeCase(topCommand.name);
  return { path: `src/gen/cmd/${modName}.rs`, content, modName, cmdName: topCommand.name };
}
