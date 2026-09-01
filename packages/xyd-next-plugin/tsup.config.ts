import { defineConfig, Options } from 'tsup';

import pkg from './package.json';

const deps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
]

const config: Options = {
    entry: {
        index: 'src/index.ts',
    },
    dts: {
        entry: {
            index: 'src/index.ts',
        },
        resolve: true,
    },
    format: ['esm'],
    platform: 'node',
    shims: false,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [
        ...deps,
    ]
}

export default defineConfig(config);
