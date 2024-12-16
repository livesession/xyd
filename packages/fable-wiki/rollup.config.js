import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

import * as atlas from './src/tokens/atlas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function writeTokenCss(options = {}) {
    return {
        name: 'write-token-css',
        async generateBundle() {
            const css = atlas.generateCSS();
            const outputPath = path.resolve(__dirname, options.output || 'dist/atlas.css');
            const outputDir = path.dirname(outputPath);

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, {recursive: true});
            }

            fs.writeFileSync(outputPath, css);
        }
    };
}

export default [
    {
        input: {
            index: 'index.ts',
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
            resolve(),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
            }),
            writeTokenCss()
        ]
    },
    {
        input: 'index.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'es',
        },
        plugins: [dts()]
    },
];