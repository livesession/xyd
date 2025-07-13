import { createRequire } from "module";

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';
import wyw from '@wyw-in-js/rollup';

import { copyPresetsPlugin } from '@xyd-js/themes';

const require = createRequire(import.meta.url);

const {
    dependencies,
    peerDependencies,
    devDependencies
} = require('./package.json', { assert: { type: 'json' } });

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
