// import {defineConfig} from 'tsup';

// export default defineConfig({
//     entry: {
//         index: 'src/index.ts',
//         dev: 'src/commands/dev.ts',
//         build: 'src/commands/dev.ts',
//     },
//     format: ['esm'], // ESM output
//     // target: 'node16', // Target Node.js 16 environment
//     dts: {
//         entry: {
//             index: 'src/index.ts',
//             dev: 'src/commands/dev.ts',
//             build: 'src/commands/dev.ts',
//         },
//         resolve: true, // Resolve external types
//     },
//     splitting: false, // No code splitting
//     sourcemap: true, // Generate source maps
//     clean: true, // Clean output directory before build
//     esbuildOptions: (options) => {
//         // options.platform = 'node'; // Set platform to Node.js
//         // options.external = ['lightningcss', 'node:*', 'rollup', "fs"]; // Exclude modules from the bundle
//         // options.external = []; // Exclude modules from the bundle
//         // options.bundle = true; // Bundle non-external dependencies
//         options.bundle = false
//     },
//     ignoreWatch: ['node_modules', 'dist', '.git', 'build'], // Exclude unnecessary files from watch
// });

import {defineConfig} from 'tsup';
import pkg from './package.json';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        dev: 'src/commands/dev.ts',
        build: 'src/commands/build.ts',
    },
    dts: {
        entry: {
            index: 'src/index.ts',
            dev: 'src/commands/dev.ts',
            build: 'src/commands/build.ts',
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
});
