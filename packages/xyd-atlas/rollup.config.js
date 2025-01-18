import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import {terser} from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import css from 'rollup-plugin-css-only';
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

export default [
    {
        input: 'index.ts',
        output: {
            dir: 'dist',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            // alias({ TODO: finish?
            //     entries: [
            //         {find: '@', replacement: resolve(__dirname, 'src')}
            //     ]
            // }),
            wyw({
                include: ['**/*.{ts,tsx}'],
                babelOptions: {
                    presets: [
                        '@babel/preset-typescript',
                        '@babel/preset-react'
                    ],
                },
            }),
            css({
                output: 'index.css',
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
            dir: 'dist',
            format: 'es',
        },
        plugins: [dts()],
        external
    },
];