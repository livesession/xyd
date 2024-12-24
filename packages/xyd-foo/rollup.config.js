import {fileURLToPath} from 'url';
import {dirname} from 'path';

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import {terser} from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import wyw from '@wyw-in-js/rollup';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import {createRequire} from 'module';

const require = createRequire(import.meta.url);
const {dependencies} = require('./package.json', {assert: {type: 'json'}});

const external = Object.keys(dependencies);

export default [
    {
        input: {
            index: 'index.ts',
            renderoll: 'renderoll.ts'
        },
        output: [
            {
                dir: 'dist',
                format: 'esm',
                sourcemap: false,
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
            postcss({
                extract: true,
                plugins: [
                    require('postcss-import'),
                    require('autoprefixer')
                ]
            }),
            resolve(),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
            }),
            babel({
                babelHelpers: 'bundled',
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
                presets: [
                    '@babel/preset-env',
                    '@babel/preset-react'
                ],
            }),
            terser(),
        ],
        external
    },
    {
        input: 'index.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    },
    {
        input: 'renderoll.ts',
        output: {
            file: 'dist/renderoll.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    }
];