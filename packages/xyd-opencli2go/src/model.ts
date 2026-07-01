import type { Command, Option, XOpenApiCommand } from '@xyd-js/opencli';

import { goVar } from './naming';

export type GoType = 'string' | 'int' | 'float' | 'bool' | 'slice' | 'json' | 'file';

export interface PathArg {
  goVar: string;
  wireName: string;
  idx: number;
}

export interface FlagModel {
  flagName: string;
  wireName: string;
  location: 'query' | 'header' | 'cookie' | 'body';
  goType: GoType;
  required: boolean;
  hidden: boolean;
  aliases: string[];
  description?: string;
}

export interface LeafModel {
  method: string; // uppercase HTTP method
  path: string;
  pathArgs: PathArg[];
  flags: FlagModel[];
  hasBody: boolean;
  bodyStyle?: string; // 'flatten' | 'json' | 'multipart'
  bodyJsonOption?: string; // flag name when the whole body is one JSON option (style=json)
}

function fromToken(from: string | undefined, kind: 'option' | 'argument'): string | undefined {
  if (!from) return undefined;
  const [k, ...rest] = from.split(':');
  return k === kind ? rest.join(':') : undefined;
}

function encodingToGoType(encoding: string | undefined): GoType | undefined {
  switch (encoding) {
    case 'integer':
      return 'int';
    case 'number':
      return 'float';
    case 'boolean':
      return 'bool';
    case 'array':
      return 'slice';
    case 'json':
      return 'json';
    case 'file':
      return 'file';
    case 'string':
      return 'string';
    default:
      return undefined;
  }
}

function optionGoType(opt: Option, encoding?: string): GoType {
  if (!opt.arguments || opt.arguments.length === 0) return 'bool';
  const fromEncoding = encodingToGoType(encoding);
  if (fromEncoding) return fromEncoding;
  const arg = opt.arguments[0];
  if (arg.arity) return 'slice';
  switch (arg.name) {
    case 'integer':
      return 'int';
    case 'number':
      return 'float';
    case 'boolean':
      return 'bool';
    case 'json':
      return 'json';
    default:
      return 'string';
  }
}

/** Build the normalized request model for a leaf command from its x-openapi binding. */
export function buildLeafModel(command: Command): LeafModel {
  const x = command['x-openapi'] as XOpenApiCommand;
  const params = x.params || [];
  const body = x.body;

  const pathArgs: PathArg[] = (command.arguments || []).map((arg, idx) => {
    const param = params.find((p) => p.in === 'path' && fromToken(p.from, 'argument') === arg.name);
    return { goVar: goVar(arg.name), wireName: param?.name ?? arg.name, idx };
  });

  const bodyPropByOption = new Map<string, string>(); // flagName -> encoding
  const bodyWireByOption = new Map<string, string>(); // flagName -> wire name
  for (const prop of body?.properties || []) {
    const flag = fromToken(prop.from, 'option');
    if (flag) {
      bodyPropByOption.set(flag, prop.encoding || 'string');
      bodyWireByOption.set(flag, prop.name);
    }
  }

  const flags: FlagModel[] = [];
  for (const opt of command.options || []) {
    const paramEntry = params.find((p) => fromToken(p.from, 'option') === opt.name && p.in !== 'path');
    let location: FlagModel['location'];
    let wireName: string;
    let encoding: string | undefined;

    if (paramEntry) {
      location = paramEntry.in as FlagModel['location'];
      wireName = paramEntry.name;
    } else if (bodyPropByOption.has(opt.name)) {
      location = 'body';
      wireName = bodyWireByOption.get(opt.name) ?? opt.name;
      encoding = bodyPropByOption.get(opt.name);
    } else {
      location = 'query';
      wireName = opt.name;
    }

    flags.push({
      flagName: opt.name,
      wireName,
      location,
      goType: optionGoType(opt, encoding),
      required: opt.required === true,
      hidden: opt.hidden === true,
      aliases: opt.aliases || [],
      description: opt.description,
    });
  }

  const bodyStyle = body?.style;
  const bodyJsonOption =
    bodyStyle === 'json' ? fromToken(body?.from, 'option') ?? flags.find((f) => f.location === 'body')?.flagName : undefined;
  const hasBody = !!body && (bodyStyle === 'json' || flags.some((f) => f.location === 'body'));

  return {
    method: (x.method || 'get').toUpperCase(),
    path: x.path,
    pathArgs,
    flags,
    hasBody,
    bodyStyle,
    bodyJsonOption,
  };
}
