import {createRequire} from 'module';

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';
import {terser} from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import summary from 'rollup-plugin-summary';

const require = createRequire(import.meta.url);
const {
    dependencies,
    peerDependencies,
    devDependencies
} = require('./package.json', {assert: {type: 'json'}});

const external = [
    ...Object.keys(dependencies || {}),
    ...Object.keys(peerDependencies || {}),
    ...Object.keys(devDependencies || {}),
];

export default [
    {
        input: {
            index: 'src/index.ts',
            'components/index': 'packages/components/index.ts',
            'react/index': 'packages/react/index.ts',
            'node/index': 'packages/node/index.ts',
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
            resolve({
                extensions: ['.js', '.jsx', '.ts', '.tsx']
            }),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
                declaration: true,
                declarationDir: 'dist',
                useTsconfigDeclarationDir: true
            }),
            postcss({
                inject: true,
                plugins: [
                    require('postcss-import'),
                    require('autoprefixer')
                ],
                use: {
                    sass: null,
                    stylus: null,
                    less: null
                }
            }),
            babel({
                babelHelpers: 'bundled',
                extensions: ['.js', '.jsx'],
                exclude: ['**/*.ts', '**/*.tsx'],
                presets: [
                    '@babel/preset-env',
                    '@babel/preset-react'
                ],
            }),
            // Minify HTML template literals (Lit best practice)
            minifyHTML.default(),
            // Minify JS
            terser({
                ecma: 2022,
                module: true,
                warnings: true,
            }),
            // Print bundle summary
            summary.default(),
        ],
        external
    },
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    },
    {
        input: 'packages/components/index.ts',
        output: {
            file: 'dist/components/index.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    },
    {
        input: 'packages/react/index.ts',
        output: {
            file: 'dist/react/index.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    },
    {
        input: 'packages/node/index.ts',
        output: {
            file: 'dist/node/index.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    }
];
