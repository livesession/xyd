import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'index.ts', cli: 'src/cli.ts' },
    format: ['esm'],
    target: 'node16',
    dts: {
        entry: { index: 'index.ts' },
    },
    splitting: false,
    sourcemap: true,
    clean: true,
    banner: ({ format }) => (format === 'esm' ? { js: '#!/usr/bin/env node' } : {}),
    esbuildOptions: (options) => {
        options.platform = 'node';
        options.external = ['node:fs/promises'];
    },
});
