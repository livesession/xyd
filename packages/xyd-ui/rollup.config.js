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

export default [
    {
        input: {
            index: 'index.ts'
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
                // classNameSlug: (hash, title, {file}) => {
                //     // Get the full path after 'src/components/'
                //     const pathParts = file.split('/');
                //     const componentsIndex = pathParts.indexOf('components');
                //     if (componentsIndex === -1) return `XydUi-Component-${title}`;

                //     // Get everything after 'components' directory
                //     const componentPath = pathParts
                //         .slice(componentsIndex + 1)
                //         .filter(part => !part.endsWith('.styles.tsx')) // Remove styles.tsx
                //         .join('-');

                //     // Use the title as the style name (it's already the variable name)
                //     const styleName = title.replace(/^\$/, ''); // Remove $ prefix if present

                //     return `XydUi-Component-${componentPath}__${styleName}`;
                // }
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
    }
];