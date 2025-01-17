import {createRequire} from "module";

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';

const require = createRequire(import.meta.url);
const {
    dependencies,
    peerDependencies,
    devDependencies
} = require('./package.json', {assert: {type: 'json'}});

const external = [
    ...Object.keys(dependencies),
    ...Object.keys(peerDependencies),
    ...Object.keys(devDependencies),
];

export default [
    {
        input: {
            theme: './packages/theme/index.ts'
        },
        output: [
            {
                dir: 'dist',
                format: 'esm',
                sourcemap: true,
                entryFileNames: '[name].js'
            }
        ],
        plugins: [
            resolve(),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
            }),
            postcss({
                extensions: ['.css'],
                plugins: [postcssImport()],
                extract: true, // Extract CSS into a separate file
                minimize: true, // Minify the CSS
            }),
        ],
        external
    },
    {
        input: './packages/theme/index.ts',
        output: {
            file: 'dist/theme.d.ts',
            format: 'es',
        },
        plugins: [
            dts({
                respectExternal: true, // Ignore unresolved imports
            }),
        ],
        external: [
            ...external,
            /\.css$/ // Mark CSS imports as external
        ],
    },
];