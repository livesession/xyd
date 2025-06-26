import {defineConfig} from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts'
    },
    dts: {
        entry: {
            index: 'src/index.ts'
        },
        resolve: true, // Resolve external types
    },

    format: ["esm"],
    platform: 'node',
    shims: false,
    splitting: false,
    sourcemap: true,
    clean: true,
    bundle: true, // Enable bundling
    external: [
        // // externalize vite dependency
        "vite",
    ]
})
