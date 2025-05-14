import {defineConfig, Options} from 'tsup';

import pkg from './package.json';

const deps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
].filter((dep) => [
   
].indexOf(dep) === -1)

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
        ...deps,

    //     "@graphql-markdown/core": "^1.12.0",
    // "@graphql-markdown/graphql": "^1.1.4",
    // "@graphql-markdown/types": "^1.4.0",
    // "graphql-config": "^5.1.2",
    // "gray-matter": "^4.0.3",
    // "json-to-graphql-query": "^2.3.0"

        // Externalize gql modules
        // '@graphql-markdown/core',
        // '@graphql-markdown/graphql',
        // '@graphql-markdown/types',
        // 'graphql-config',
        // 'gray-matter',
        // 'json-to-graphql-query',

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
