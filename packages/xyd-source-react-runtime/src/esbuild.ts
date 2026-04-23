import * as fs from 'node:fs';
import type {Plugin as EsbuildPlugin} from 'esbuild';
import {xydSourceReactRuntime, type XydSourceReactRuntimeOptions} from './index';

/**
 * esbuild plugin adapter for xyd-source-react-runtime.
 *
 * ```js
 * import {xydSourceReactRuntimeEsbuild} from '@xyd-js/source-react-runtime/esbuild';
 *
 * await esbuild.build({
 *     entryPoints: ['src/index.ts'],
 *     plugins: [xydSourceReactRuntimeEsbuild({tsconfig: './tsconfig.json'})],
 * });
 * ```
 */
export function xydSourceReactRuntimeEsbuild(options?: XydSourceReactRuntimeOptions): EsbuildPlugin {
    const vitePlugin = xydSourceReactRuntime(options);

    return {
        name: 'xyd-source-react-runtime',
        setup(build) {
            build.onStart(async () => {
                if (typeof (vitePlugin as any).buildStart === 'function') {
                    await (vitePlugin as any).buildStart.call(vitePlugin);
                }
            });

            build.onLoad({filter: /\.[jt]sx?$/}, async (args) => {
                const code = fs.readFileSync(args.path, 'utf-8');
                const result = (vitePlugin as any).transform?.call?.(vitePlugin, code, args.path)
                    ?? (vitePlugin as any).load?.call?.(vitePlugin, args.path);

                if (result) {
                    const contents = typeof result === 'string' ? result : result.code;
                    return {
                        contents,
                        loader: args.path.endsWith('.tsx') ? 'tsx' : args.path.endsWith('.ts') ? 'ts' : 'js',
                    };
                }
                return undefined;
            });
        },
    };
}
