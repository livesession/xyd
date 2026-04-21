import * as path from 'node:path';
import type {Plugin} from 'vite';
import type {Reference, TypeDocReferenceContext} from '@xyd-js/uniform';

export type {XydUniformBabelPluginOptions} from './babel-plugin';
export {default as xydUniformBabelPlugin} from './babel-plugin';

export interface XydSourceReactBabelRuntimeOptions {
    root: string;
    entryPoints: string[];
}

/**
 * Computes a uniform map from source files using @xyd-js/sources.
 * Returns a Record<componentName, Reference> for use with the babel plugin.
 */
export async function createUniformMap(
    root: string,
    entryPoints: string[],
): Promise<Record<string, Reference>> {
    const {sourcesToUniformV2} = await import('@xyd-js/sources/ts');
    const {uniformToReactUniform} = await import('@xyd-js/sources/react');

    const tsconfig = path.join(root, 'tsconfig.json');
    const result = await sourcesToUniformV2(root, entryPoints, {cwd: root, tsconfig});
    if (!result) return {};

    const reactRefs = uniformToReactUniform(
        result.references as Reference<TypeDocReferenceContext>[],
        result.projectJson,
        {autoDetect: true},
    );

    const uniformMap: Record<string, Reference> = {};

    for (const ref of reactRefs) {
        const ctx = ref.context as TypeDocReferenceContext | undefined;
        if (ctx?.symbolName) {
            uniformMap[ctx.symbolName] = ref;
        }
    }

    return uniformMap;
}

/**
 * Vite plugin that analyzes React components via @xyd-js/sources and
 * injects `__xydUniform` at build time. Self-contained — no manual
 * uniform map creation needed.
 *
 * ```ts
 * import react from '@vitejs/plugin-react';
 * import { xydSourceReactBabelRuntime } from '@xyd-js/source-react-babel-runtime';
 *
 * export default defineConfig({
 *   plugins: [
 *     xydSourceReactBabelRuntime({ root: __dirname, entryPoints: ['src/index.ts'] }),
 *     react(),
 *   ],
 * });
 * ```
 */
export function xydSourceReactBabelRuntime(
    options: XydSourceReactBabelRuntimeOptions,
): Plugin {
    let uniformMap: Record<string, Reference> = {};

    return {
        name: 'xyd-source-react-babel-runtime',
        enforce: 'pre',

        async buildStart() {
            uniformMap = await createUniformMap(options.root, options.entryPoints);
        },

        transform(code, id) {
            if (!id.match(/\.[jt]sx?$/)) return null;
            if (Object.keys(uniformMap).length === 0) return null;

            const additions: string[] = [];

            for (const [name, ref] of Object.entries(uniformMap)) {
                // Match inline exports: export function Name, export const Name
                const inlineExportPatterns = [
                    `export function ${name}`,
                    `export const ${name}`,
                    `export default function ${name}`,
                ];
                // Match declaration + re-export: function Name ... export { Name }
                const hasDeclAndReExport =
                    new RegExp(`(?:function|const|class)\\s+${name}\\b`).test(code) &&
                    new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`).test(code);

                const hasExport = inlineExportPatterns.some(p => code.includes(p)) || hasDeclAndReExport;
                if (!hasExport) continue;

                const jsonStr = JSON.stringify(ref).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                additions.push(
                    `${name}.__xydUniform = JSON.parse('${jsonStr}');`,
                );
            }

            if (additions.length === 0) return null;

            return {
                code: code + '\n' + additions.join('\n'),
                map: null,
            };
        },
    };
}
