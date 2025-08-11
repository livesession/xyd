import {defineConfig} from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        react: 'packages/react/index.ts',
        hydration: 'packages/hydration/index.ts',
    },
    format: ['esm'], // Output both ESM and CJS formats
    target: 'node16', // Ensure compatibility with Node.js 16
    dts: {
        entry: {
            index: 'src/index.ts',
            react: 'packages/react/index.ts',
            hydration: 'packages/hydration/index.ts',
        },
        resolve: true, // Resolve external types
    },
    splitting: false, // Disable code splitting
    sourcemap: true, // Generate source maps
    clean: true, // Clean the output directory before each build
    esbuildOptions: (options) => {
        options.platform = 'node'; // Ensure the platform is set to Node.js
        options.external = ['node:fs/promises', 'react-router']; // Mark 'node:fs/promises' as external
        options.loader = {'.js': 'jsx'}; // Ensure proper handling of .js files
    },
    ignoreWatch: ['node_modules', 'dist', '.git', 'build'] // Exclude unnecessary directories
});