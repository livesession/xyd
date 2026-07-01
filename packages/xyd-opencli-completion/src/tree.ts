import type { Command, OpencliSpecJson, Option } from '@xyd-js/opencli';

import type { CompletionNode, CompletionOption } from './types';

/**
 * Adapt an OpenCLI document into the command tree the shell generators walk.
 * Root-level `recursive` options (a CLI's global flags) are made available on
 * every command, so they complete in any subcommand context too.
 */
export function opencliToTree(spec: OpencliSpecJson): CompletionNode {
  const name = spec.info?.title || 'cli';
  const rootOptions = (spec.options || []).filter((o) => !o.hidden);
  const globalOptions = rootOptions.filter((o) => o.recursive);

  const commandNode = (cmd: Command): CompletionNode => ({
    name: cmd.name,
    description: cmd.description,
    options: [
      ...(cmd.options || []).filter((o) => !o.hidden).map(optionToCompletion),
      ...globalOptions.map(optionToCompletion),
    ],
    commands: toNodeMap(cmd.commands, commandNode),
  });

  return {
    name,
    description: spec.info?.description,
    options: rootOptions.map(optionToCompletion),
    commands: toNodeMap(spec.commands, commandNode),
  };
}

function toNodeMap(commands: Command[] | undefined, node: (c: Command) => CompletionNode): Record<string, CompletionNode> {
  return Object.fromEntries((commands || []).filter((c) => !c.hidden).map((c) => [c.name, node(c)]));
}

function optionToCompletion(opt: Option): CompletionOption {
  // OpenCLI option `name` is the canonical long form; aliases may be short or long.
  const flags = [`--${opt.name}`, ...(opt.aliases || []).map((a) => (a.length === 1 ? `-${a}` : `--${a}`))];
  return { flags, takesValue: (opt.arguments?.length ?? 0) > 0, description: opt.description };
}
