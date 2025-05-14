import {defineConfig} from 'tsup';

import pkg from './package.json';

const deps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
].filter((dep) => [
    "@xyd-js/core",
    "@xyd-js/content",
    "@xyd-js/framework",
    "@xyd-js/ui",
    "@xyd-js/themes",
    "@xyd-js/components",
    "@xyd-js/openapi",
    "@xyd-js/uniform",
    "@xyd-js/theme-gusto",
    "@xyd-js/theme-opener",
    "@xyd-js/theme-poetry",
    "@xyd-js/theme-cosmo",
].indexOf(dep) === -1)

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        dev: 'packages/dev/dev.ts',
        build: 'packages/dev/build.ts',
    },
    dts: {
        entry: {
            index: 'src/index.ts',
            dev: 'packages/dev/dev.ts',
            build: 'packages/dev/build.ts',
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
        ...deps,

        // needed by @xyd-js/plugin-docs
        "react-router",
        "@react-router/dev",
        "@react-router/express",

        // "@xyd-js/react-router-dev",

        "@readme/json-schema-ref-parser",
        "@apidevtools/json-schema-ref-parser",
        //

        // neede by @xyd-js/sources

        //
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

        // "lightningcss",
        // "vite",
        // "vite-tsconfig-paths",
        // "react-router",
        // "@react-router/serve",
        // "@react-router/dev",
        // "@xydjs/react-router-dev",
        // "@mdx-js/rollup",
        // "@graphql-markdown"
    ], // Ensure no dependencies are marked as external
})
