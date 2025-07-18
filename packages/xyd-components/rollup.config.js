import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import {terser} from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import wyw from '@wyw-in-js/rollup';
import copy from 'rollup-plugin-copy';

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
    const ext = path.extname(file);
    
    // Only process TypeScript files for the main build
    if (ext === '.ts') {
        acc[`coder/themes/${themeName}`] = path.join(themesDir, file);
    }
    return acc;
}, {});

const packages = ["coder", "content", "layouts", "pages", "system", "views", "writer"];

export default [
    {
        input: {
            index: 'index.ts',
            ...Object.keys(packages).reduce((acc, i) => {
                const pkg = packages[i];
                acc[pkg] = `${pkg}.ts`;
                return acc;
            }, {}),
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
            // Copy CSS files from themes directory
            copy({
                targets: [
                    { 
                        src: 'src/coder/themes/*.css', 
                        dest: 'dist/coder/themes' 
                    }
                ]
            })
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
    ...packages.map(pkg => ({
        input: `${pkg}.ts`,
        output: {
            file: `dist/${pkg}.d.ts`,
            format: 'es',
        },
        plugins: [dts()],
        external
    })),
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