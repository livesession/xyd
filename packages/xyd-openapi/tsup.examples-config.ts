import { defineConfig } from 'tsup';

// TODO: multiple entry points + outputs

const isDebugMode = !!process.env.DEBUG

export default defineConfig({
    entry: [
        "./examples/semi/index.ts"
    ],
    format: ['esm', 'cjs'], // Output both ESM and CJS formats
    target: 'node16', // Ensure compatibility with Node.js 16
    dts: {
        entry: "./examples/semi/index.ts",
        resolve: true, // Resolve external types
    },
    splitting: false, // Disable code splitting
    sourcemap: true, // Generate source maps
    clean: true, // Clean the output directory before each build
    outDir: './examples/dist', // Output directory
    esbuildOptions(options) {
        options.minify = true;
        if (isDebugMode) {
            options.drop = [];
        } else {
            options.drop = [];
            options.pure = ['console.debug'];
        }
    },
});