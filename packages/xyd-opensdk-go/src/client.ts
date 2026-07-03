import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { goDoc, goField, goFile, Imports, goStruct } from './gowriter';
import { pascalCase } from './naming';
import { serviceTypeName } from './service';
import type { GoCtx } from './service';

/**
 * Emit `client.go`: the top-level `Client` with a field per top-level resource
 * service, and `NewClient(...)` that seeds auth from the environment.
 */
export function renderClientFile(spec: OpensdkSpecJson, ctx: GoCtx): string {
  const imports = new Imports();
  const optionQ = imports.add(`${ctx.modulePath}/option`);
  const resources = spec.resources || [];

  const structFields = [goField('Options', `[]${optionQ}.RequestOption`)];
  for (const r of resources) structFields.push(goField(pascalCase(r.name), serviceTypeName([r.name])));
  const clientStruct = goStruct('Client', structFields, goDoc(`Client is the ${spec.info.title} API client.`, 'Client'));

  const envVar = spec.security?.find((s) => s.envVar)?.envVar;
  const ctorLines: string[] = [`\tdefaults := []${optionQ}.RequestOption{}`];
  if (envVar) {
    imports.add('os');
    ctorLines.push(
      `\tif value, ok := os.LookupEnv(${JSON.stringify(envVar)}); ok {\n` +
        `\t\tdefaults = append(defaults, ${optionQ}.WithAPIKey(value))\n\t}`,
    );
  }
  ctorLines.push(`\topts = append(defaults, opts...)`);
  ctorLines.push(`\tr = Client{Options: opts}`);
  for (const res of resources) ctorLines.push(`\tr.${pascalCase(res.name)} = New${serviceTypeName([res.name])}(opts...)`);

  const ctorDoc = envVar
    ? `NewClient creates a client seeded with the credential from ${envVar}.`
    : 'NewClient creates a new API client with the given request options.';
  const ctor =
    `${goDoc(ctorDoc, 'NewClient')}\n` +
    `func NewClient(opts ...${optionQ}.RequestOption) (r Client) {\n${ctorLines.join('\n')}\n\treturn\n}`;

  return goFile(ctx.pkg, imports, [clientStruct, ctor]);
}
