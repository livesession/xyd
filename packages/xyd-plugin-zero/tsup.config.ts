import {defineConfig, Options} from 'tsup';

// TODO: use src/index.ts and src/<pkg>/index.ts pattern everywhere

// const config: Options = {
//     entry: {
//         index: 'src/index.ts',
//     },
//     format: ['esm', 'cjs'], // Output both ESM and CJS formats
//     target: 'node16', // Ensure compatibility with Node.js 16
//     dts: {
//         entry: {
//             index: 'src/index.ts',
//         },
//         resolve: true, // Resolve external types
//     },
//     splitting: false, // Disable code splitting
//     sourcemap: true, // Generate source maps
//     clean: true, // Clean the output directory before each build
//     esbuildOptions: (options) => {
//         options.platform = 'node'; // Ensure the platform is set to Node.js
//         options.external = ['node:fs/promises', 'vite']; // Mark 'node:fs/promises' as external
//         options.loader = {'.js': 'jsx'}; // Ensure proper handling of .js files
//     },
//
//     ignoreWatch: ['node_modules', 'dist', '.git', 'build'] // Exclude unnecessary directories
// }

import pkg from './package.json';

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
    // outDir: 'dist',
    // target: 'node16',
    platform: 'node',
    shims: false,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [
        // Externalize all dependencies from package.json
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
        // Externalize Node.js built-in modules
        /^node:.*/,
        'fs',
        'path',
        'url',
        'os',
        'http',
        'https',
        'stream',
        'zlib',
        'util',
        'crypto',
        'tty',
        // Add other built-in modules as needed
    ],
    esbuildPlugins: [
        {
            name: 'external-node-builtins',
            setup(build) {
                const filter = /^node:/;
                build.onResolve({filter}, args => {
                    return {path: args.path, external: true};
                });
            },
        },
    ],
}

export default defineConfig(config);
