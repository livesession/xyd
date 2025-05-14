import { defineConfig } from 'tsup';
import pkg from './package.json' assert { type: 'json' }

const deps = [
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
]

export default defineConfig({
    entry: {
        index: 'src/index.ts'
    },
    format: ['esm'],
    target: 'node16',
    dts: {
        entry: {
            index: 'src/index.ts'
        },
        resolve: true,
    },
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [
        ...deps
    ],
    esbuildOptions: (options) => {
        options.platform = 'node';
        options.external = ['node:fs/promises', 'react-router'];
        options.loader = { '.js': 'jsx' };
    },
    ignoreWatch: ['node_modules', 'dist', '.git', 'build']
});