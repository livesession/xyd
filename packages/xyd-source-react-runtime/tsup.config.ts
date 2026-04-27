import {defineConfig, Options} from 'tsup';

const config: Options = {
    entry: {
        index: 'src/index.ts',
        esbuild: 'src/esbuild.ts',
    },
    format: ['esm'],
    target: 'node16',
    dts: {
        entry: {
            index: 'src/index.ts',
            esbuild: 'src/esbuild.ts',
        },
    },
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['vite', 'esbuild', 'typia', 'typescript', '@xyd-js/openapi', '@xyd-js/uniform'],
    tsconfig: 'tsconfig.tsup.json',
};

export default defineConfig(config);
