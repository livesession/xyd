import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['index.ts'],
    format: ['esm', 'cjs'],
    target: 'node16',
    dts: {
        entry: 'index.ts',
    },
    // vitest is a PEER of whatever test runner imports this harness — never bundle
    // it. Bundling creates a second collector, so describe()/it() called from
    // sdk-e2e.ts register on the wrong suite ("No test suite found").
    external: ['vitest'],
    splitting: false,
    sourcemap: true,
    clean: true,
    esbuildOptions: (options) => {
        options.platform = 'node';
        options.external = ['node:fs/promises', 'vitest'];
        options.loader = { '.js': 'jsx' };
    },
});
