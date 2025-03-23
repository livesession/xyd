import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import {terser} from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import wyw from '@wyw-in-js/rollup';

import {createRequire} from 'module';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const themesDir = path.resolve(__dirname, 'src/coder/themes');
const themes = fs.readdirSync(themesDir).reduce((acc, file) => {
    const themeName = path.basename(file, path.extname(file));
    acc[`coder/themes/${themeName}`] = path.join(themesDir, file);
    return acc;
}, {});

export default [
    {
        input: {
            index: 'index.ts',
            brand: 'src/brand/index.ts',
            coder: 'coder.ts',
            content: 'content.ts',
            layouts: 'layouts.ts',
            pages: 'src/pages/index.ts',
            views: 'src/views/index.ts',
            writer: 'writer.ts',
            ...themes
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
        input: 'src/pages/index.ts',
        output: {
            file: 'dist/pages.d.ts',
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
    },
    ...Object.keys(themes).map(theme => ({
        input: themes[theme],
        output: {
            file: `dist/${theme}.d.ts`,
            format: 'es',
        },
        plugins: [dts()],
        external
    }))
];