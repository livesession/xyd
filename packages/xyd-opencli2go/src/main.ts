import type { OpencliSpecJson } from '@xyd-js/opencli';

import { Imports, goFile, goSlice, goStr, goStruct, lit, type GoVal } from './golit';

const CLI = 'github.com/urfave/cli/v3';

/** Render `cmd/<bin>/main.go`. */
export function renderMain(
  spec: OpencliSpecJson,
  binName: string,
  module: string,
  constructors: string[],
): string {
  const imports = new Imports().add('context', 'log', 'os', CLI, `${module}/pkg/cmd`);

  const fields: [string, GoVal][] = [['Name', goStr(binName)]];
  const usage = spec.info?.summary || spec.info?.description;
  if (usage) fields.push(['Usage', goStr(usage)]);
  if (spec.info?.version) fields.push(['Version', goStr(spec.info.version)]);
  fields.push(['Commands', goSlice('*cli.Command', constructors.map((c) => lit(`cmd.${c}()`)))]);

  const app = goStruct('cli.Command', fields, true);
  const body = `\tapp := ${app(1)}
\tif err := app.Run(context.Background(), os.Args); err != nil {
\t\tlog.Fatal(err)
\t}`;
  const fn = `func main() {\n${body}\n}`;

  return goFile('main', imports, [fn]);
}
