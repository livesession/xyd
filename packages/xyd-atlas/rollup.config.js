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
function copyCss(names) {
    return {
        name: `copy-${names.join('-')}-css`,
        writeBundle() {
            names.forEach(name => {
                const css = fs.readFileSync(`src/styles/${name}.css`, 'utf8');
                fs.mkdirSync('dist', { recursive: true });
                fs.writeFileSync(`dist/${name}.css`, css);
            });
        }
    };
}

export default [
    {
        input: {
            index: 'index.ts',
            xydPlugin: 'packages/xyd-plugin/index.ts',
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
                // Prefix every generated class with its EXPORT NAME (`title`) so the
                // class encodes *which* styled block it is. wyw/Linaria's default slug
                // is a hash of `<file>:<ordinal-index>`, so inserting/removing/reordering
                // one `css` literal renumbers every LATER one in the same file and their
                // hashes all change — a stale, cached index.css then assigns the SAME short
                // class (e.g. `.aq5m3p7`) to a DIFFERENT export than a fresh build does, and
                // a browser holding both payloads corrupts the styling (observed:
                // NavbarSubtitle picking up ApiRefItemHost's flex-column + padding-bottom).
                // The `title` prefix makes that impossible: `ApiRefItemHost_*` can never be
                // applied to an ApiRefItemNavbarSubtitle element. `hash` keeps names unique.
                classNameSlug: (hash, title) => {
                    const name = String(title || '').replace(/[^a-zA-Z0-9_]/g, '');
                    return name ? `${name}_${hash}` : hash;
                },
            }),
            css({
                output: 'index.css',
            }),
            copyCss(['tokens', 'styles']),
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
        input: 'packages/xyd-plugin/index.ts',
        output: {
            file: 'dist/xydPlugin.d.ts',
            format: 'es',
        },
        plugins: [dts()],
        external
    }
];