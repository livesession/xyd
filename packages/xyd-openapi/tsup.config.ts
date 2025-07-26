import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['index.ts'],
    format: ['esm', 'cjs'], // Output both ESM and CJS formats
    target: 'node16', // Ensure compatibility with Node.js 16
    dts: {
        entry: 'index.ts', // Specify the entry for DTS
        resolve: true, // Resolve external types
    },
    splitting: false, // Disable code splitting
    sourcemap: true, // Generate source maps
    clean: true, // Clean the output directory before each build
    esbuildOptions: (options) => {
        options.platform = 'node'; // Ensure the platform is set to Node.js
        options.external = ['node:fs/promises']; // Mark 'node:fs/promises' as external
        options.loader = { '.js': 'jsx' }; // Ensure proper handling of .js files
    },
});