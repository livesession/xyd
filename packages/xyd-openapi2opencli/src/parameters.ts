import type { OpenAPIV3 } from 'openapi-types';
import type { Argument, Option, XOpenApiParam } from '@xyd-js/opencli';

import { camelCase, kebabCase } from './naming';
import { arrayItems, getEnum, isArray, isBoolean, isObjectSchema, scalarType, type Schema } from './schema';
import { uniqueName } from './unique';
import type { FlagCase, OpenApi2OpenCliOptions } from './types';

/** Header parameters handled by the security layer — never surfaced as flags. */
const AUTH_HEADERS = new Set(['authorization', 'x-api-key', 'api-key', 'openai-organization', 'openai-project']);

export interface ParamMapResult {
  arguments: Argument[];
  options: Option[];
  xParams: XOpenApiParam[];
}

function flagName(wire: string, flagCase: FlagCase | undefined): string {
  return flagCase === 'camel' ? camelCase(wire) : kebabCase(wire);
}

/** A human-friendly value-argument label for an option (`--limit <integer>`). */
function valueLabel(schema: Schema | undefined): string {
  if (isArray(schema)) {
    const item = arrayItems(schema);
    return scalarType(item) || (isObjectSchema(item) ? 'json' : 'value');
  }
  return scalarType(schema) || (isObjectSchema(schema) ? 'json' : 'value');
}

/** Build the value Argument attached to a value-taking option. */
function valueArgument(schema: Schema | undefined): Argument {
  const arg: Argument = { name: valueLabel(schema) };
  const enumValues = getEnum(isArray(schema) ? arrayItems(schema) : schema);
  if (enumValues) arg.acceptedValues = enumValues;
  if (isArray(schema)) {
    // unbounded variadic: minimum 0, no maximum
    arg.arity = { minimum: 0 };
  }
  return arg;
}

/**
 * Map an operation's parameters (path/query/header/cookie) to OpenCLI arguments
 * and options, recording the HTTP binding in `xParams`.
 *
 * @param params merged path-item + operation parameters (already dereferenced)
 * @param pathParamOrder wire names of path params in path order (positional ordering)
 * @param usedFlagNames shared flag-name allocator (also used by the body mapper)
 */
export function mapParameters(
  params: OpenAPIV3.ParameterObject[],
  pathParamOrder: string[],
  usedFlagNames: Set<string>,
  options: OpenApi2OpenCliOptions,
): ParamMapResult {
  const result: ParamMapResult = { arguments: [], options: [], xParams: [] };
  const byName = new Map<string, OpenAPIV3.ParameterObject>();
  for (const p of params) {
    if (p && p.in === 'path') byName.set(p.name, p);
  }

  // Path params → positional arguments, in path order.
  for (const wire of pathParamOrder) {
    const p = byName.get(wire);
    const schema = p?.schema as Schema | undefined;
    const argName = kebabCase(wire);
    const arg: Argument = { name: argName, required: true };
    if (p?.description) arg.description = p.description;
    const enumValues = getEnum(schema);
    if (enumValues) arg.acceptedValues = enumValues;
    result.arguments.push(arg);
    result.xParams.push({ in: 'path', name: wire, from: `argument:${argName}`, required: true });
  }

  // Query / header / cookie params → options.
  for (const p of params) {
    if (!p || p.in === 'path') continue;
    if (p.in === 'header' || p.in === 'cookie') {
      if (!options.includeHeaders) continue;
      if (AUTH_HEADERS.has(p.name.toLowerCase())) continue;
    }

    const schema = p.schema as Schema | undefined;
    const name = uniqueName(flagName(p.name, options.flagCase), usedFlagNames);

    const opt: Option = { name };
    if (p.required) opt.required = true;
    if (p.description) opt.description = p.description;
    if (p.in !== 'query') opt.group = p.in; // 'query' is the default group; only annotate others
    else opt.group = 'query';
    if (p.in === 'header' || p.in === 'cookie') opt.hidden = true;

    // boolean → flag with no value; everything else takes a value
    if (!isBoolean(schema)) {
      opt.arguments = [valueArgument(schema)];
    }
    result.options.push(opt);

    const xParam: XOpenApiParam = { in: p.in, name: p.name, from: `option:${name}` };
    if (p.required) xParam.required = true;
    if (typeof (p as { explode?: boolean }).explode === 'boolean') xParam.explode = (p as { explode?: boolean }).explode;
    if (typeof (p as { style?: string }).style === 'string') xParam.style = (p as { style?: string }).style;
    result.xParams.push(xParam);
  }

  return result;
}
