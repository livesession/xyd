import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { npmPackageName, screamingSnakeCase } from './naming';
import type { OpensdkNodeOptions } from './types';

export interface ResolvedNodeOptions {
  pkg: string;
  baseURL: string;
  envVar: string;
}

export function resolveNodeOptions(spec: OpensdkSpecJson, options: OpensdkNodeOptions): ResolvedNodeOptions {
  const pkg = options.packageName ?? npmPackageName(spec.info.title);
  return {
    pkg,
    baseURL: options.baseURL ?? spec.servers?.[0] ?? '',
    envVar: options.envVar ?? spec.security?.find((s) => s.envVar)?.envVar ?? `${screamingSnakeCase(pkg)}_API_KEY`,
  };
}

/** The generated `package.json`: dependency-free, TS-source SDK (built with `tsc`). */
export function packageJson(pkg: string, spec: OpensdkSpecJson): string {
  const manifest: Record<string, unknown> = {
    name: pkg,
    version: spec.info.version || '0.0.0',
  };
  if (spec.info.description) manifest.description = spec.info.description;
  Object.assign(manifest, {
    type: 'module',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
      },
    },
    files: ['dist', 'src'],
    scripts: { build: 'tsc' },
    engines: { node: '>=18' },
    dependencies: {},
  });
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * The generated `tsconfig.json`: strict, `moduleResolution: bundler`, ES2022
 * target, with the DOM lib for the built-in web APIs (`fetch`/`URL`/`Headers`/
 * `Response`) so the SDK type-checks with NO external `@types` dependency.
 */
export function tsconfigJson(): string {
  const config = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      lib: ['ES2022', 'DOM'],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      outDir: './dist',
    },
    include: ['src'],
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}

/** A minimal README scaffold. */
export function readme(pkg: string, spec: OpensdkSpecJson): string {
  const summary = spec.info.description ? `\n${spec.info.description}\n` : '';
  return `# ${pkg}
${summary}
## Usage

\`\`\`ts
import { Client } from '${pkg}';

const client = new Client({ apiKey: process.env.API_KEY });
\`\`\`
`;
}
