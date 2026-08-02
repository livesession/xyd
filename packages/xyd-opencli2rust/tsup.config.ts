import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['index.ts'],
    format: ['esm', 'cjs'],
    target: 'node16',
    dts: {
        entry: 'index.ts',
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
});
