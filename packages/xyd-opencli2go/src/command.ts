import type { Command } from '@xyd-js/opencli';

import { Imports, goBool, goFile, goSlice, goStr, goStruct, lit, type GoVal } from './golit';
import { renderFlags } from './flags';
import { renderHandler } from './handler';
import { buildLeafModel } from './model';
import { pascalCase, splitWords } from './naming';

const CLI = 'github.com/urfave/cli/v3';

function renderCommand(
  command: Command,
  pathNames: string[],
  module: string,
  imports: Imports,
  handlers: string[],
): GoVal {
  imports.add(CLI);
  const fields: [string, GoVal][] = [['Name', goStr(command.name)]];
  if (command.aliases?.length) fields.push(['Aliases', goSlice('string', command.aliases.map(goStr))]);
  if (command.description) fields.push(['Usage', goStr(command.description)]);
  if (command.hidden) fields.push(['Hidden', goBool(true)]);

  if (command.commands?.length) {
    const subs = command.commands.map((sub) =>
      renderCommand(sub, [...pathNames, sub.name], module, imports, handlers),
    );
    fields.push(['Commands', goSlice('*cli.Command', subs)]);
  } else if (command['x-openapi']) {
    const flags = renderFlags(buildLeafModel(command).flags);
    if (flags.length) fields.push(['Flags', goSlice('cli.Flag', flags)]);
    const handler = renderHandler(pathNames, command, module, imports);
    fields.push(['Action', lit(handler.name)]);
    handlers.push(handler.code);
  }

  return goStruct('cli.Command', fields, true);
}

export interface ResourceFile {
  path: string;
  content: string;
  constructor: string;
}

/** Render one `pkg/cmd/<resource>.go` file for a top-level command + its subtree. */
export function renderResourceFile(topCommand: Command, module: string): ResourceFile {
  const imports = new Imports();
  const handlers: string[] = [];
  const struct = renderCommand(topCommand, [topCommand.name], module, imports, handlers);

  const ctorName = `New${pascalCase(topCommand.name)}Command`;
  const ctor = `func ${ctorName}() *cli.Command {\n\treturn ${struct(1)}\n}`;
  const content = goFile('cmd', imports, [ctor, ...handlers]);

  const fileBase = splitWords(topCommand.name).join('') || 'command';
  return { path: `pkg/cmd/${fileBase}.go`, content, constructor: ctorName };
}
