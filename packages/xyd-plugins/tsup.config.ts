import {copyFile} from 'node:fs/promises';
import {join} from 'node:path';

import {defineConfig, Options} from 'tsup';

import pkg from './package.json';

const deps = [
    // ...Object.keys(pkg.dependencies || {}),
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
        resolve: true, // Resolve external types
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
