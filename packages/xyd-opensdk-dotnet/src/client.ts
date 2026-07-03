import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { csDoc, csFile, indent } from './cswriter';
import { pascalCase } from './naming';
import { serviceClassName } from './service';

export interface DotnetClientCtx {
  sdk: string;
  namespace: string;
  baseURL: string;
  envVar?: string;
}

/**
 * Emit `Client.cs`: the top-level `<Sdk>Client` with a get-only property per
 * top-level resource service (`client.Pets`), and a constructor that seeds the
 * credential from the environment then wires each resource to the shared
 * transport — mirroring openai-dotnet's property-based resource access.
 */
export function renderClientFile(spec: OpensdkSpecJson, ctx: DotnetClientCtx): string {
  const usings = ['System', 'System.Net.Http'];
  const resources = spec.resources || [];
  const className = `${ctx.sdk}Client`;

  const members: string[] = ['private readonly Transport _transport;'];
  for (const r of resources) {
    members.push(`public ${serviceClassName([r.name])} ${pascalCase(r.name)} { get; }`);
  }

  const ctorLines: string[] = [];
  if (ctx.envVar) {
    ctorLines.push(`apiKey ??= Environment.GetEnvironmentVariable(${JSON.stringify(ctx.envVar)});`);
  }
  ctorLines.push(`_transport = new Transport(baseUrl ?? ${JSON.stringify(ctx.baseURL)}, apiKey, httpClient);`);
  for (const r of resources) {
    ctorLines.push(`${pascalCase(r.name)} = new ${serviceClassName([r.name])}(_transport);`);
  }
  const ctorDoc = ctx.envVar
    ? `Creates a client. When apiKey is null the credential is read from the ${ctx.envVar} environment variable.`
    : 'Creates a client with the given credential and base URL.';
  const ctor =
    `${csDoc(ctorDoc)}\n` +
    `public ${className}(string? apiKey = null, string? baseUrl = null, HttpClient? httpClient = null)\n` +
    `{\n${indent(ctorLines.join('\n'))}\n}`;

  const doc = csDoc(`${spec.info.title} API client.`);
  const body = [members.join('\n'), ctor].join('\n\n');
  const decl = `${doc}\npublic sealed class ${className}\n{\n${indent(body)}\n}`;

  return csFile(usings, ctx.namespace, [decl]);
}
