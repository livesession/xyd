import { defineConfig, Options } from 'tsup';

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
        // // externalize vite dependency
        "vite",
    ]
}

export default defineConfig(config);
