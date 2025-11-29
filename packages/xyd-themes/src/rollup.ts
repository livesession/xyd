import {createRequire} from "module";

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import dts from 'rollup-plugin-dts';
import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';
import postcssMixins from 'postcss-mixins';
import wyw from '@wyw-in-js/rollup';

import {copyPresetsPlugin} from './copyPresetsPlugin';

export default function (importPath: string) {
    const require = createRequire(importPath);

    const {
        dependencies,
        peerDependencies,
        devDependencies
    } = require('./package.json');

    const external = [
        ...Object.keys(dependencies),
        ...Object.keys(peerDependencies),
        ...Object.keys(devDependencies),
        "@xyd-js/framework/react",
        "@xyd-js/components/brand",
        "@xyd-js/components/coder",
        "@xyd-js/components/content",
        "@xyd-js/components/layouts",
        "@xyd-js/components/pages",
        "@xyd-js/components/views",
    ];

    return [
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
                    outDir: 'dist',
                }),
                babel({
                    babelHelpers: 'bundled',
                    extensions: ['.js', '.jsx', '.ts', '.tsx'],
                    presets: [
                        '@babel/preset-env',
                        '@babel/preset-react'
                    ],
                }),
                postcss({
                    extensions: ['.css'],
                    plugins: [postcssImport(), postcssMixins()],
                    extract: true, // Extract CSS into a separate file
                    minimize: true, // Minify the CSS
                }),
                copyPresetsPlugin(),
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
}