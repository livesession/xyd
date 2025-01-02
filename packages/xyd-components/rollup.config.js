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
            brand: 'src/brand/index.ts',
            coder: 'coder.ts',
            content: 'content.ts',
            layouts: 'layouts.ts',
            views: 'src/views/index.ts',
            writer: 'writer.ts',
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
        input: 'src/brand/index.ts',
        output: {
            file: 'dist/brand.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    },
    {
        input: 'coder.ts',
        output: {
            file: 'dist/coder.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    },
    {
        input: 'content.ts',
        output: {
            file: 'dist/content.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    },
    {
        input: 'layouts.ts',
        output: {
            file: 'dist/layouts.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    },
    {
        input: 'src/views/index.ts',
        output: {
            file: 'dist/views.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    },
    {
        input: 'writer.ts',
        output: {
            file: 'dist/writer.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    }
];