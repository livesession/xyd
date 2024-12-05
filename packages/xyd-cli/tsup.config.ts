// import * as fsp from "fs/promises";

import {defineConfig} from "tsup";

// import {createBanner} from "../../build.utils.js";
// import pkg from "./package.json";

const entry = ["index.ts"];

const external = [];

export default defineConfig([
    {
        clean: true,
        bundle: true,
        entry,
        format: ['esm'], // Output both ESM and CJS formats
        outDir: "dist",
        dts: true,
        external,
        // banner: {
        //     js: createBanner(pkg.name, pkg.version),
        // },
        plugins: [],
    },
]);

// export default defineConfig({
//     // TODO: does not work
//     // format: ['esm'],
//     // entry: ['./index.ts'],
//     // dts: false,
//     // shims: true,
//     // skipNodeModulesBundle: true,
//     // clean: true,
//     // target: 'node20',
//     // platform: 'node',
//     // minify: true,
//     // bundle: true,
//     // external: [
//     //     "lightningcss"
//     // ],
//     // // https://github.com/egoist/tsup/issues/619
//     // noExternal: [/(.*)/, "lightningcss"],
//     // splitting: false,
//
//     // format: ["esm"],
//     // entry: ['./index.ts'],
//     // platform: 'node',
//     // shims: false,
//     // splitting: false,
//     // sourcemap: true,
//     // clean: true,
//     // external: [
//     //     // "lightningcss"
//     // ],
//
//
//     // format: ["esm"],
//     // entry: ['./index.ts'],
//     // platform: 'node',
//     // shims: false,
//     // splitting: false,
//     // sourcemap: true,
//     // clean: true,
//     // bundle: true, // Enable bundling
//     // external: [
//     //     "lightningcss",
//     //     "vite",
//     //     "vite-tsconfig-paths",
//     //     "react-router",
//     //     "@react-router/serve",
//     //     "@react-router/dev",
//     //     "@xydjs/react-router-dev",
//     //     "@mdx-js/rollup",
//     //     "@graphql-markdown"
//     // ], // Ensure no dependencies are marked as external
// });