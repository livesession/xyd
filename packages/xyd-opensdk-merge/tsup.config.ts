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
});
