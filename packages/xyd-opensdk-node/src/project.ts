import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { type ResolvedBusybox, resolveBusybox } from './busybox';
import { npmPackageName, pascalCase, screamingSnakeCase } from './naming';
import type { OpensdkNodeOptions } from './types';

export interface ResolvedNodeOptions {
  pkg: string;
  baseURL: string;
  envVar: string;
  /** The client class name (also the exported symbol in named mode). */
  clientName: string;
  /** `true` → default export (`import X from 'pkg'`); `false` → named export. */
  defaultExport: boolean;
  /** The resolved error-helper "busybox" config, or `null` when disabled. */
  busybox: ResolvedBusybox | null;
}

export function resolveNodeOptions(spec: OpensdkSpecJson, options: OpensdkNodeOptions): ResolvedNodeOptions {
  const pkg = options.packageName ?? npmPackageName(spec.info.title);
  // Named export iff `exportPackage` is set; otherwise a default export (the
  // fallback, also when `exportDefault` is set). For the chosen option, a string
  // is used verbatim as the symbol; `true`/unset → the PascalCase name derived
  // from the package (`@cloudinary/analysis` → `CloudinaryAnalysis`).
  const named =
    options.exportPackage !== undefined && options.exportPackage !== false;
  const nameOpt = named ? options.exportPackage : options.exportDefault;
  const clientName =
    (typeof nameOpt === 'string' ? nameOpt.trim() : '') || pascalCase(pkg);
  return {
    pkg,
    baseURL: options.baseURL ?? spec.servers?.[0] ?? '',
    envVar: options.envVar ?? spec.security?.find((s) => s.envVar)?.envVar ?? `${screamingSnakeCase(pkg)}_API_KEY`,
    clientName,
    defaultExport: !named,
    busybox: resolveBusybox(options.busybox),
  };
}

/** The generated `package.json`: dependency-free, TS-source SDK (built with `tsc`). */
export function packageJson(pkg: string, spec: OpensdkSpecJson): string {
  const info = spec.info;
  const manifest: Record<string, unknown> = {
    name: pkg,
    version: info.version || '0.0.0',
  };
  // Publish identity (author/license/repository/homepage) from spec.info — filled
  // by the OpenAPI `info` or overridden via an sdk.json `publish` block. The
  // registry itself is NOT baked here; `opensdk publish` passes `--registry`.
  if (info.description) manifest.description = info.description;
  if (info.contact?.name) manifest.author = info.contact.name;
  if (info.license?.identifier) manifest.license = info.license.identifier;
  if (info.homepage) manifest.homepage = info.homepage;
  if (info.repository) manifest.repository = { type: 'git', url: info.repository };
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
    // `prepare` builds dist/ on `npm install` AND before `npm publish`/pack, so
    // the published tarball is usable (exports -> ./dist/index.js) without the
    // publisher running a manual build. typescript is the only devDep — runtime
    // stays dependency-free.
    scripts: { build: 'tsc', prepare: 'tsc' },
    engines: { node: '>=18' },
    dependencies: {},
    devDependencies: { typescript: '^5.6.2' },
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
export function readme(pkg: string, spec: OpensdkSpecJson, clientName: string, defaultExport: boolean): string {
  const summary = spec.info.description ? `\n${spec.info.description}\n` : '';
  const importLine = defaultExport
    ? `import ${clientName} from '${pkg}';`
    : `import { ${clientName} } from '${pkg}';`;
  return `# ${pkg}
${summary}
## Usage

\`\`\`ts
${importLine}

const client = new ${clientName}({ apiKey: process.env.API_KEY });
\`\`\`
`;
}
