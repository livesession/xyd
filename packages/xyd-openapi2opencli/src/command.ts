import type { OpenAPIV3 } from 'openapi-types';
import type { Command, XOpenApiCommand } from '@xyd-js/opencli';

import { deriveTarget } from './action';
import { mapParameters } from './parameters';
import { mapRequestBody } from './body';
import { mapResponses } from './response';
import type { OpenApi2OpenCliOptions } from './types';

/** Merge path-item parameters with operation parameters (operation wins on name+in). */
function mergeParameters(
  pathItemParams: OpenAPIV3.ParameterObject[],
  operationParams: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[] | undefined,
): OpenAPIV3.ParameterObject[] {
  const byKey = new Map<string, OpenAPIV3.ParameterObject>();
  const add = (p: OpenAPIV3.ParameterObject) => {
    if (p && typeof p === 'object' && 'name' in p && 'in' in p) byKey.set(`${p.in}:${p.name}`, p);
  };
  for (const p of pathItemParams) add(p);
  for (const p of (operationParams || []) as OpenAPIV3.ParameterObject[]) add(p);
  return [...byKey.values()];
}

export interface BuiltLeaf {
  resourcePath: string[];
  command: Command;
}

/** Build a single leaf command (+ its resource placement) from one operation. */
export function buildLeafCommand(
  method: string,
  path: string,
  operation: OpenAPIV3.OperationObject,
  pathItemParams: OpenAPIV3.ParameterObject[],
  options: OpenApi2OpenCliOptions,
): BuiltLeaf {
  const target = deriveTarget(method, path, operation, options);
  const allParams = mergeParameters(pathItemParams, operation.parameters);

  const usedFlagNames = new Set<string>();
  const params = mapParameters(allParams, target.pathParamNames, usedFlagNames, options);
  const body = mapRequestBody(
    operation.requestBody as OpenAPIV3.RequestBodyObject | undefined,
    usedFlagNames,
    options,
  );

  const command: Command = { name: target.action };
  if (target.aliases.length) command.aliases = target.aliases;

  const description = operation.summary || operation.description;
  if (description) command.description = description;

  if (params.arguments.length) command.arguments = params.arguments;

  const allOptions = [...params.options, ...body.options];
  if (allOptions.length) command.options = allOptions;

  const xOpenapi: XOpenApiCommand = { method: method.toLowerCase(), path };
  if (operation.operationId) xOpenapi.operationId = operation.operationId;
  if (body.xBody?.contentType) xOpenapi.contentType = body.xBody.contentType;
  if (params.xParams.length) xOpenapi.params = params.xParams;
  if (body.xBody) xOpenapi.body = body.xBody;

  const responses = mapResponses(operation.responses, options);
  if (responses.length) xOpenapi.responses = responses;

  command['x-openapi'] = xOpenapi;

  return { resourcePath: target.resourcePath, command };
}
