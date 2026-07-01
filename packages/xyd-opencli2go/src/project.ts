import type { OpencliSpecJson } from '@xyd-js/opencli';

import { renderResourceFile } from './command';
import { renderMain } from './main';
import { slug } from './naming';
import { configGo, runtimeGo } from './runtime';
import type { Opencli2GoOptions } from './types';

/**
 * Generate a buildable Go CLI project (urfave/cli v3) from an OpenCLI document.
 * Pure: returns a virtual file map `{ relativePath: contents }`.
 */
export function opencli2go(spec: OpencliSpecJson, options: Opencli2GoOptions = {}): Record<string, string> {
  const binName = options.binName ?? (slug(spec.info?.title || 'cli') || 'cli');
  const module = options.modulePath ?? `example.com/${binName}`;
  const goVersion = options.goVersion ?? '1.22';
  const baseURL = options.baseURL ?? spec['x-openapi']?.servers?.[0] ?? '';

  const files: Record<string, string> = {};

  files['go.mod'] = `module ${module}\n\ngo ${goVersion}\n`;

  const constructors: string[] = [];
  for (const top of spec.commands || []) {
    const resource = renderResourceFile(top, module);
    files[resource.path] = resource.content;
    constructors.push(resource.constructor);
  }

  files[`cmd/${binName}/main.go`] = renderMain(spec, binName, module, constructors);

  files['internal/runtime/runtime.go'] = runtimeGo();
  files['internal/runtime/config.go'] = configGo(spec, binName, baseURL);

  return files;
}
