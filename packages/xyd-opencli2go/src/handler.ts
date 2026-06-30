import type { Command } from '@xyd-js/opencli';

import type { Imports } from './golit';
import { buildLeafModel, type GoType, type LeafModel } from './model';
import { pascalCase } from './naming';

const CLI = 'github.com/urfave/cli/v3';
const q = (s: string) => JSON.stringify(s);

function readExpr(flagName: string, t: GoType): string {
  switch (t) {
    case 'bool':
      return `cmd.Bool(${q(flagName)})`;
    case 'int':
      return `cmd.Int(${q(flagName)})`;
    case 'float':
      return `cmd.Float(${q(flagName)})`;
    case 'slice':
      return `cmd.StringSlice(${q(flagName)})`;
    default:
      return `cmd.String(${q(flagName)})`; // string | json | file
  }
}

function pathExpr(model: LeafModel, imports: Imports): string {
  const segs = model.path.split(/(\{[^}]+\})/).filter((s) => s !== '');
  const parts: string[] = [];
  let lit = '';
  for (const seg of segs) {
    const m = seg.match(/^\{(.+)\}$/);
    if (m) {
      if (lit) {
        parts.push(q(lit));
        lit = '';
      }
      const a = model.pathArgs.find((p) => p.wireName === m[1]);
      parts.push(`url.PathEscape(${a ? a.goVar : '""'})`);
      imports.add('net/url');
    } else {
      lit += seg;
    }
  }
  if (lit) parts.push(q(lit));
  return parts.length ? parts.join(' + ') : '""';
}

/** Render the handler func for a leaf command from its x-openapi binding. */
export function renderHandler(
  pathNames: string[],
  command: Command,
  module: string,
  imports: Imports,
): { name: string; code: string } {
  const model = buildLeafModel(command);
  const name = `handle${pathNames.map(pascalCase).join('')}`;
  imports.add('context', CLI, `${module}/internal/runtime`);

  const lines: string[] = [];
  const push = (s = '') => lines.push(s);

  // Path params (positional args) — only declare the ones the path actually uses.
  const pe = pathExpr(model, imports);
  for (const a of model.pathArgs) {
    if (pe.includes(`url.PathEscape(${a.goVar})`)) push(`${a.goVar} := cmd.Args().Get(${a.idx})`);
  }
  push(`path := ${pe}`);

  // Query params.
  const queryFlags = model.flags.filter((f) => f.location === 'query');
  if (queryFlags.length) {
    imports.add('net/url');
    push('query := url.Values{}');
    for (const f of queryFlags) {
      const read = readExpr(f.flagName, f.goType);
      let val = read;
      if (f.goType !== 'string') {
        val = `fmt.Sprint(${read})`;
        imports.add('fmt');
      }
      push(`if cmd.IsSet(${q(f.flagName)}) {`);
      push(`\tquery.Set(${q(f.wireName)}, ${val})`);
      push('}');
    }
  }

  // Header / cookie params.
  const headerFlags = model.flags.filter((f) => f.location === 'header' || f.location === 'cookie');
  if (headerFlags.length) {
    imports.add('net/http');
    push('headers := http.Header{}');
    for (const f of headerFlags) {
      const read = readExpr(f.flagName, f.goType);
      let val = read;
      if (f.goType !== 'string') {
        val = `fmt.Sprint(${read})`;
        imports.add('fmt');
      }
      push(`if cmd.IsSet(${q(f.flagName)}) {`);
      push(`\theaders.Set(${q(f.wireName)}, ${val})`);
      push('}');
    }
  }

  // Body.
  if (model.hasBody) {
    imports.add('encoding/json');
    if (model.bodyStyle === 'json' && model.bodyJsonOption) {
      push('var bodyBytes []byte');
      push(`if cmd.IsSet(${q(model.bodyJsonOption)}) {`);
      push(`\tbodyBytes = []byte(cmd.String(${q(model.bodyJsonOption)}))`);
      push('}');
    } else {
      push('body := map[string]any{}');
      for (const f of model.flags.filter((x) => x.location === 'body')) {
        push(`if cmd.IsSet(${q(f.flagName)}) {`);
        if (f.goType === 'json') {
          // Accept either JSON (objects/arrays) or a bare scalar: a string|object
          // union field is commonly given a plain value, and an unparseable value
          // must not abort the whole request.
          push(`\traw := cmd.String(${q(f.flagName)})`);
          push('\tvar v any');
          push('\tif err := json.Unmarshal([]byte(raw), &v); err != nil {');
          push('\t\tv = raw');
          push('\t}');
          push(`\tbody[${q(f.wireName)}] = v`);
        } else {
          push(`\tbody[${q(f.wireName)}] = ${readExpr(f.flagName, f.goType)}`);
        }
        push('}');
      }
      push('bodyBytes, err := json.Marshal(body)');
      push('if err != nil {');
      push('\treturn err');
      push('}');
    }
  }

  // Assemble the request.
  push('req := runtime.Request{');
  push(`\tMethod: ${q(model.method)},`);
  push('\tPath: path,');
  if (queryFlags.length) push('\tQuery: query,');
  if (headerFlags.length) push('\tHeaders: headers,');
  if (model.hasBody) push('\tBody: bodyBytes,');
  push('}');
  push('return runtime.Do(ctx, req)');

  const body = lines.map((l) => `\t${l}`).join('\n');
  const code = `func ${name}(ctx context.Context, cmd *cli.Command) error {\n${body}\n}`;
  return { name, code };
}
