import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { type ResolvedBusybox, busyboxClientStatics, busyboxIndexExport } from './busybox';
import { jsDoc } from './model';
import { camelCase, slug } from './naming';
import { resourceClassName } from './resource';

/**
 * Emit `src/client.ts`: the top-level `Client` (extends the fetch runtime's
 * `APIClient`) with a field per top-level resource, seeding the credential from
 * the configured environment variable when no `apiKey` is passed. When busybox is
 * in `'static'` mode, the error helpers are aliased onto the class as statics
 * (`Client.isNotFound(err)`).
 */
export function renderClientFile(
  spec: OpensdkSpecJson,
  envVar: string,
  clientName: string,
  busybox: ResolvedBusybox | null,
): string {
  const resources = spec.resources || [];
  const imports = [
    `import { APIClient, readEnv } from './core/request';`,
    `import type { ClientOptions } from './core/request';`,
  ];
  for (const r of resources) {
    imports.push(`import { ${resourceClassName([r.name])} } from './resources/${slug(r.name) || 'resource'}';`);
  }
  const statics = busybox ? busyboxClientStatics(busybox) : null;
  if (statics) imports.push(statics.importLine);

  const fields = resources.map((r) => `  readonly ${camelCase(r.name)}: ${resourceClassName([r.name])};`);
  const ctorLines = [`    super({ ...options, apiKey: options.apiKey ?? readEnv(${JSON.stringify(envVar)}) });`];
  for (const r of resources) {
    ctorLines.push(`    this.${camelCase(r.name)} = new ${resourceClassName([r.name])}(this);`);
  }

  const doc = jsDoc(`The ${spec.info.title} API client.`);
  const staticBlock = statics ? `${statics.staticLines.join('\n')}\n\n` : '';
  const fieldBlock = fields.length ? `${fields.join('\n')}\n\n` : '';
  return (
    `${imports.join('\n')}\n\n` +
    `${doc}export class ${clientName} extends APIClient {\n` +
    `${staticBlock}` +
    `${fieldBlock}` +
    `  constructor(options: ClientOptions = {}) {\n${ctorLines.join('\n')}\n  }\n` +
    `}\n`
  );
}

/**
 * Emit `src/index.ts`: the public entry point re-exporting the client, the
 * error base + policy error-kind subclasses, the option types, every model
 * (and its union decode helpers) and every resource (classes + param types).
 * With busybox in `'flat'`/`'namespace'` mode, the error helpers are re-exported
 * too (`import { isNotFound } from '<pkg>'` / `import { busybox } from '<pkg>'`).
 */
export function renderRootIndexFile(
  spec: OpensdkSpecJson,
  errorClasses: string[],
  clientName: string,
  defaultExport: boolean,
  busybox: ResolvedBusybox | null,
): string {
  const errors = ['APIError', ...errorClasses];
  const clientLine = defaultExport
    ? `export { ${clientName} as default } from './client';`
    : `export { ${clientName} } from './client';`;
  const lines = [
    clientLine,
    `export { ${errors.join(', ')} } from './core/error';`,
    `export type { ClientOptions, RequestOptions } from './core/request';`,
    `export * from './models';`,
  ];
  if ((spec.resources || []).length) lines.push(`export * from './resources/index';`);
  const busyboxLine = busybox ? busyboxIndexExport(busybox) : null;
  if (busyboxLine) lines.push(busyboxLine);
  return `${lines.join('\n')}\n`;
}
