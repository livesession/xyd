import fs from 'fs';
import {createRequire} from 'module';

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import {terser} from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import css from 'rollup-plugin-css-only';
import wyw from '@wyw-in-js/rollup';

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

// Function to copy tokens.css to dist
function copyTokensCss() {
    return {
        name: 'copy-tokens-css',
        writeBundle() {
            const tokensCss = fs.readFileSync('src/styles/tokens.css', 'utf8');
            fs.mkdirSync('dist', { recursive: true });
            fs.writeFileSync('dist/tokens.css', tokensCss);
        }
    };
}

export default [
    {
        input: {
            index: 'index.ts',
            ["atlas-index"]: 'packages/atlas-index/index.ts'
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
                classNameSlug: (hash, title, {file}) => {
                    // Get the full path after 'src/components/'
                    const pathParts = file.split('/');
                    const componentsIndex = pathParts.indexOf('components');
                    if (componentsIndex === -1) return `XydAtlas-Component-${title}`;
                    
                    // Get everything after 'components' directory
                    const componentPath = pathParts
                        .slice(componentsIndex + 1)
                        .filter(part => !part.endsWith('.styles.tsx')) // Remove styles.tsx
                        .join('-');
                    
                    // Use the title as the style name (it's already the variable name)
                    const styleName = title.replace(/^\$/, ''); // Remove $ prefix if present
                    
                    return `XydAtlas-Component-${componentPath}__${styleName}`;
                }
            }),
            css({
                output: 'index.css',
            }),
            copyTokensCss(),
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
    {
        input: 'packages/atlas-index/index.ts',
        output: {
            file: 'dist/atlas-index.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    },
];