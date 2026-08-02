// Handler emission (the handler.ts mirror from opencli2go): positional path args,
// IsSet-style guarded query/header population, flatten-vs-json body assembly —
// ending in runtime::run_request so the CliOverrides hooks see every request.

import type { Command } from '@xyd-js/opencli';

import { buildLeafModel, type FlagModel, type FlagType, type LeafModel } from './model';
import { snakeCase } from './naming';
import { indent } from './rslit';

const q = (s: string) => JSON.stringify(s);

function getOne(id: string, t: FlagType): string {
  switch (t) {
    case 'bool':
      return `m.get_one::<bool>(${q(id)})`;
    case 'int':
      return `m.get_one::<i64>(${q(id)})`;
    case 'float':
      return `m.get_one::<f64>(${q(id)})`;
    default:
      return `m.get_one::<String>(${q(id)})`; // string | json | file
  }
}

/** The `String`-typed rendering of a read flag value, for query/header params. */
function stringValue(t: FlagType): string {
  return t === 'string' || t === 'json' || t === 'file' ? 'v.clone()' : 'v.to_string()';
}

function pathParts(model: LeafModel): { fmt: string; args: string[]; usedVars: Set<string> } {
  const segs = model.path.split(/(\{[^}]+\})/).filter((s) => s !== '');
  let fmt = '';
  const args: string[] = [];
  const usedVars = new Set<string>();
  for (const seg of segs) {
    const m = seg.match(/^\{(.+)\}$/);
    if (m) {
      const a = model.pathArgs.find((p) => p.wireName === m[1]);
      fmt += '{}';
      if (a) {
        args.push(`runtime::path_escape(${a.varName})`);
        usedVars.add(a.varName);
      } else {
        args.push('""');
      }
    } else {
      fmt += seg.replace(/\{/g, '{{').replace(/\}/g, '}}');
    }
  }
  return { fmt, args, usedVars };
}

/** Guarded param population for query/header/cookie flags. */
function paramLines(flags: FlagModel[], target: string): string[] {
  const lines: string[] = [];
  for (const f of flags) {
    if (f.flagType === 'slice') {
      lines.push(`if let Some(vs) = m.get_many::<String>(${q(f.flagName)}) {`);
      lines.push(`    ${target}.push((${q(f.wireName)}, vs.cloned().collect::<Vec<_>>().join(",")));`);
      lines.push('}');
    } else {
      lines.push(`if let Some(v) = ${getOne(f.flagName, f.flagType)} {`);
      lines.push(`    ${target}.push((${q(f.wireName)}, ${stringValue(f.flagType)}));`);
      lines.push('}');
    }
  }
  return lines;
}

export interface RenderedHandler {
  name: string;
  code: string;
}

/** Render the async handler fn for a leaf command from its x-openapi binding. */
export function renderHandler(pathNames: string[], command: Command): RenderedHandler {
  const model = buildLeafModel(command);
  // Snake the WHOLE joined name (not per segment): a keyword segment like
  // "match" needs no trailing-underscore guard inside a longer identifier,
  // and per-segment guards would produce non-snake-case `__` doubles.
  const name = snakeCase(['handle', ...pathNames].join('-'));

  const lines: string[] = [];
  const push = (s = '') => lines.push(s);

  // Path params (positional args) — only read the ones the path actually uses.
  const { fmt, args, usedVars } = pathParts(model);
  for (const a of model.pathArgs) {
    if (usedVars.has(a.varName)) {
      push(`let ${a.varName} = m.get_one::<String>(${q(a.argName)}).map(String::as_str).unwrap_or("");`);
    }
  }
  push(args.length ? `let path = format!(${q(fmt)}, ${args.join(', ')});` : `let path = ${q(model.path)}.to_string();`);

  // Query params.
  const queryFlags = model.flags.filter((f) => f.location === 'query');
  if (queryFlags.length) {
    push(`let mut query: Vec<(&'static str, String)> = Vec::new();`);
    for (const line of paramLines(queryFlags, 'query')) push(line);
  }

  // Header / cookie params.
  const headerFlags = model.flags.filter((f) => f.location === 'header' || f.location === 'cookie');
  if (headerFlags.length) {
    push(`let mut headers: Vec<(&'static str, String)> = Vec::new();`);
    for (const line of paramLines(headerFlags, 'headers')) push(line);
  }

  // Body.
  let bodyExpr: string | undefined;
  if (model.hasBody) {
    if (model.bodyStyle === 'json' && model.bodyJsonOption) {
      push(`let body_bytes = m.get_one::<String>(${q(model.bodyJsonOption)}).map(|v| v.clone().into_bytes());`);
      bodyExpr = 'body_bytes';
    } else {
      push('let mut body = serde_json::Map::new();');
      for (const f of model.flags.filter((x) => x.location === 'body')) {
        if (f.flagType === 'slice') {
          push(`if let Some(vs) = m.get_many::<String>(${q(f.flagName)}) {`);
          push(
            `    body.insert(${q(f.wireName)}.to_string(), serde_json::Value::Array(vs.cloned().map(serde_json::Value::String).collect()));`,
          );
          push('}');
        } else if (f.flagType === 'json') {
          // Accept either JSON (objects/arrays) or a bare scalar: a string|object
          // union field is commonly given a plain value, and an unparseable value
          // must not abort the whole request.
          push(`if let Some(v) = m.get_one::<String>(${q(f.flagName)}) {`);
          push('    let value = serde_json::from_str::<serde_json::Value>(v)');
          push('        .unwrap_or_else(|_| serde_json::Value::String(v.clone()));');
          push(`    body.insert(${q(f.wireName)}.to_string(), value);`);
          push('}');
        } else {
          const value =
            f.flagType === 'int' || f.flagType === 'float'
              ? 'serde_json::Value::from(*v)'
              : f.flagType === 'bool'
                ? 'serde_json::Value::Bool(*v)'
                : 'serde_json::Value::String(v.clone())';
          push(`if let Some(v) = ${getOne(f.flagName, f.flagType)} {`);
          push(`    body.insert(${q(f.wireName)}.to_string(), ${value});`);
          push('}');
        }
      }
      push('let body_bytes = match serde_json::to_vec(&serde_json::Value::Object(body)) {');
      push('    Ok(bytes) => bytes,');
      push('    Err(err) => return o.print_error(cmd_path, &runtime::Error::Invalid(err.to_string())),');
      push('};');
      bodyExpr = 'Some(body_bytes)';
    }
  }

  // Assemble the request.
  push('let req = runtime::Request {');
  push(`    method: ${q(model.method)},`);
  push('    path,');
  push(queryFlags.length ? '    query,' : '    query: Vec::new(),');
  push(headerFlags.length ? '    headers,' : '    headers: Vec::new(),');
  push(bodyExpr ? `    body: ${bodyExpr},` : '    body: None,');
  push('};');
  push('runtime::run_request(ctx, o, cmd_path, req).await');

  const readsMatches = usedVars.size > 0 || model.flags.length > 0;
  const mParam = readsMatches ? 'm' : '_m';
  const code = `async fn ${name}<O: CliOverrides>(
    ctx: &Context,
    o: &O,
    cmd_path: &[String],
    ${mParam}: &ArgMatches,
) -> ExitCode {
${indent(lines.join('\n'))}
}`;
  return { name, code };
}
