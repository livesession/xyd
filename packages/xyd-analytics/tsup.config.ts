import { defineConfig } from 'tsup';

export default defineConfig({
    format: ['esm'],
    target: 'node16',
    entry: {
        index: 'src/index.ts',
    },
    dts: {
        entry: {
            index: 'src/index.ts',
        },
        resolve: true,
    },
    splitting: false,
    sourcemap: true,
    clean: true,
    esbuildOptions: (options) => {
        options.platform = 'node';
        options.external = ['node:fs/promises'];
        options.loader = { '.js': 'jsx' };
    },
    ignoreWatch: ['node_modules', 'dist', '.git', 'build']
});