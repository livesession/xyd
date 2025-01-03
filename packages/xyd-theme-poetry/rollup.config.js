import {createRequire} from "module";

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';
import wyw from '@wyw-in-js/rollup';

const require = createRequire(import.meta.url);
const {dependencies} = require('./package.json', {assert: {type: 'json'}});

// unify theme build system
const external = [
    ...Object.keys(dependencies),
    'react',
    'react-router',

    // TODO: another `@xyd` packages?
    '@xyd/framework/react'
];

export default [
    {
        input: {
            index: './src/index.ts'
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
            wyw({
                include: ['**/*.{ts,tsx}'],
                babelOptions: {
                    presets: [
                        '@babel/preset-typescript',
                        '@babel/preset-react'
                    ],
                },
            }),
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
        input: './src/index.ts',
        output: {
            file: 'dist/index.d.ts',
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