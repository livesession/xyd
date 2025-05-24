import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

import {defineConfig} from 'tsup';

export default defineConfig({
    entry: ['index.ts'],
    format: ['esm'], // Output both ESM and CJS formats
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
        options.loader = {'.js': 'jsx'}; // Ensure proper handling of .js files
    },
    onSuccess: async () => {
        // Copy opendocs.graphql to dist
        copyFileSync(
            join('src', 'opendocs.graphql'),
            join('dist', 'opendocs.graphql')
        );
        return Promise.resolve();
    }
});