import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { jsDoc } from './model';
import { camelCase, slug } from './naming';
import { resourceClassName } from './resource';

/**
 * Emit `src/client.ts`: the top-level `Client` (extends the fetch runtime's
 * `APIClient`) with a field per top-level resource, seeding the credential from
 * the configured environment variable when no `apiKey` is passed.
 */
export function renderClientFile(spec: OpensdkSpecJson, envVar: string): string {
  const resources = spec.resources || [];
  const imports = [
    `import { APIClient, readEnv } from './core/request';`,
    `import type { ClientOptions } from './core/request';`,
  ];
  for (const r of resources) {
    imports.push(`import { ${resourceClassName([r.name])} } from './resources/${slug(r.name) || 'resource'}';`);
  }

  const fields = resources.map((r) => `  readonly ${camelCase(r.name)}: ${resourceClassName([r.name])};`);
  const ctorLines = [`    super({ ...options, apiKey: options.apiKey ?? readEnv(${JSON.stringify(envVar)}) });`];
  for (const r of resources) {
    ctorLines.push(`    this.${camelCase(r.name)} = new ${resourceClassName([r.name])}(this);`);
  }

  const doc = jsDoc(`The ${spec.info.title} API client.`);
  const fieldBlock = fields.length ? `${fields.join('\n')}\n\n` : '';
  return (
    `${imports.join('\n')}\n\n` +
    `${doc}export class Client extends APIClient {\n` +
    `${fieldBlock}` +
    `  constructor(options: ClientOptions = {}) {\n${ctorLines.join('\n')}\n  }\n` +
    `}\n`
  );
}

/**
 * Emit `src/index.ts`: the public entry point re-exporting the client, the
 * error base + policy error-kind subclasses, the option types, every model
 * (and its union decode helpers) and every resource (classes + param types).
 */
export function renderRootIndexFile(spec: OpensdkSpecJson, errorClasses: string[]): string {
  const errors = ['APIError', ...errorClasses];
  const lines = [
    `export { Client } from './client';`,
    `export { ${errors.join(', ')} } from './core/error';`,
    `export type { ClientOptions, RequestOptions } from './core/request';`,
    `export * from './models';`,
  ];
  if ((spec.resources || []).length) lines.push(`export * from './resources/index';`);
  return `${lines.join('\n')}\n`;
}
