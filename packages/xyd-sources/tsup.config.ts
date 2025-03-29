import {defineConfig, Options} from 'tsup';

const config: Options = {
    entry: {
        index: 'src/index.ts',
        example: 'test-cmd/index.ts'

    },
    format: ['esm', 'cjs'], // Output both ESM and CJS formats
    target: 'node16', // Ensure compatibility with Node.js 16
    dts: {
        entry: {
            index: 'src/index.ts',
            example: 'test-cmd/index.ts'

        },
        resolve: true, // Resolve external types
    },
    splitting: false, // Disable code splitting
    sourcemap: true, // Generate source maps
    clean: true, // Clean the output directory before each build
    esbuildOptions: (options) => {
        options.platform = 'node'; // Ensure the platform is set to Node.js
        options.external = [
            'react',
            'fs',
            'path',
            'node:fs',
            'node:fs/promises',
            'typescript', // Mark typescript as external
            'codehike',
            'unist-util-visit',
            '@mdx-js/mdx'
        ]; // Mark these modules as external
        options.loader = { '.js': 'jsx' }; // Ensure proper handling of .js files
    },
}

export default defineConfig(config);