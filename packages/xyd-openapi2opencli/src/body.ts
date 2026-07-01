import type { OpenAPIV3 } from 'openapi-types';
import type { Argument, Option, XOpenApiBody, XOpenApiBodyProp } from '@xyd-js/opencli';

import { camelCase, kebabCase } from './naming';
import {
  arrayItems,
  getEnum,
  isArray,
  isBinary,
  isBoolean,
  isObjectSchema,
  resolveObjectSchema,
  scalarType,
  type Schema,
} from './schema';
import { uniqueName } from './unique';
import type { FlagCase, OpenApi2OpenCliOptions } from './types';

export interface BodyMapResult {
  options: Option[];
  xBody?: XOpenApiBody;
}

function flagName(wire: string, flagCase: FlagCase | undefined): string {
  return flagCase === 'camel' ? camelCase(wire) : kebabCase(wire);
}

/** Pick the content type to drive the body mapping. */
function pickContent(
  content: { [media: string]: OpenAPIV3.MediaTypeObject } | undefined,
): { mediaType: string; schema?: Schema } | undefined {
  if (!content) return undefined;
  const keys = Object.keys(content);
  if (keys.length === 0) return undefined;
  const prefer = ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'];
  const chosen = prefer.find((k) => keys.includes(k)) || keys[0];
  return { mediaType: chosen, schema: content[chosen]?.schema as Schema | undefined };
}

/** Encoding hint a generator uses to serialize a CLI value into a body field. */
function encodingFor(schema: Schema | undefined): XOpenApiBodyProp['encoding'] {
  if (isBinary(schema)) return 'file';
  if (isArray(schema)) return 'array';
  const t = scalarType(schema);
  if (t) return t as XOpenApiBodyProp['encoding'];
  return 'json'; // nested object / oneOf / anyOf → JSON string
}

function valueArgument(schema: Schema | undefined): Argument {
  if (isBinary(schema)) return { name: 'path' };
  const isArr = isArray(schema);
  const label = isArr
    ? scalarType(arrayItems(schema)) || (isObjectSchema(arrayItems(schema)) ? 'json' : 'value')
    : scalarType(schema) || (isObjectSchema(schema) ? 'json' : 'value');
  const arg: Argument = { name: label };
  const enumValues = getEnum(isArr ? arrayItems(schema) : schema);
  if (enumValues) arg.acceptedValues = enumValues;
  if (isArr) arg.arity = { minimum: 0 };
  return arg;
}

/**
 * Map an operation's request body to OpenCLI options + the `x-openapi.body`
 * binding. With the default hybrid strategy, top-level scalars/scalar-arrays
 * flatten into flags and nested objects/compositions collapse to a JSON-string
 * flag named after the property.
 */
export function mapRequestBody(
  requestBody: OpenAPIV3.RequestBodyObject | undefined,
  usedFlagNames: Set<string>,
  options: OpenApi2OpenCliOptions,
): BodyMapResult {
  if (!requestBody || !requestBody.content) return { options: [] };

  const picked = pickContent(requestBody.content);
  if (!picked) return { options: [] };

  const { mediaType, schema } = picked;
  const isMultipart = mediaType === 'multipart/form-data' || mediaType === 'application/x-www-form-urlencoded';
  const bodyRequired = requestBody.required === true;

  // Whole-body JSON flag (explicit "json" strategy or a non-object body).
  const resolved = resolveObjectSchema(schema);
  const useSingleJson = options.bodyStrategy === 'json' || (!resolved.object && !isMultipart);

  if (useSingleJson) {
    const name = uniqueName('body', usedFlagNames);
    const opt: Option = {
      name,
      required: bodyRequired,
      group: 'body',
      description: requestBody.description || 'Request body as a JSON string',
      arguments: [{ name: 'json' }],
    };
    return {
      options: [opt],
      xBody: { style: 'json', contentType: mediaType, from: `option:${name}`, properties: [] },
    };
  }

  const object = resolved.object;
  if (!object || !object.properties) {
    return { options: [], xBody: { style: 'json', contentType: mediaType, properties: [] } };
  }

  const requiredSet = new Set<string>(Array.isArray(object.required) ? object.required : []);
  const opts: Option[] = [];
  const props: XOpenApiBodyProp[] = [];

  for (const [wire, rawSchema] of Object.entries(object.properties)) {
    // Skip internal markers injected by the dereferencer (e.g. __UNSAFE_refPath).
    if (wire.startsWith('__')) continue;
    const propSchema = rawSchema as Schema;
    const name = uniqueName(flagName(wire, options.flagCase), usedFlagNames);
    const required = requiredSet.has(wire);

    const opt: Option = { name, group: 'body' };
    if (required) opt.required = true;
    if (propSchema.description) opt.description = propSchema.description;
    if (!isBoolean(propSchema)) opt.arguments = [valueArgument(propSchema)];
    opts.push(opt);

    const prop: XOpenApiBodyProp = { name: wire, from: `option:${name}`, jsonPath: wire, encoding: encodingFor(propSchema) };
    if (required) prop.required = true;
    props.push(prop);
  }

  return {
    options: opts,
    xBody: { style: isMultipart ? 'multipart' : 'flatten', contentType: mediaType, properties: props },
  };
}
