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
import postcssInlineUrl from 'postcss-url';
import wyw from '@wyw-in-js/rollup';
import copy from 'rollup-plugin-copy';
import postcssProcessor from 'postcss';

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
            }),
            {
                name: 'postcss-dist',
                async writeBundle() {
                  const cssFile = path.resolve(__dirname, 'dist/index.css');

                  if (!fs.existsSync(cssFile)) return;
                  const css = fs.readFileSync(cssFile, 'utf8');
                  
                  // Custom PostCSS plugin to handle CSS custom properties with local file paths
                  const customInlinePlugin = {
                    postcssPlugin: 'custom-inline-svg',
                    async Declaration(decl) {
                      if (decl.value && decl.value.includes('url(')) {
                        // Find all url() patterns in the declaration value
                        const urlRegex = /url\(([^)]+)\)/g;
                        let match;
                        let newValue = decl.value;
                        
                        while ((match = urlRegex.exec(decl.value)) !== null) {
                          const urlPath = match[1].replace(/['"]/g, '');
                          
                          // Check if it's a local file path
                          if (urlPath.startsWith('/') && urlPath.includes('.svg')) {
                            try {
                              const fullPath = path.resolve(__dirname, urlPath);
                              if (fs.existsSync(fullPath)) {
                                const svgContent = fs.readFileSync(fullPath, 'utf8');
                                const encodedSvg = encodeURIComponent(svgContent);
                                const dataUrl = `data:image/svg+xml,${encodedSvg}`;
                                
                                // Replace the url() with the data URL
                                newValue = newValue.replace(match[0], `url("${dataUrl}")`);
                              }
                            } catch (error) {
                              console.warn(`Failed to inline SVG: ${urlPath}`, error.message);
                            }
                          }
                        }
                        
                        decl.value = newValue;
                      }
                    }
                  };
                  
                  const result = await postcssProcessor([
                    customInlinePlugin,
                    postcssInlineUrl({
                      url: 'inline',
                      encodeType: 'encodeURIComponent',
                      maxSize: Infinity,
                      filter: '**/*.svg',
                    })
                  ]).process(css, { from: cssFile, to: cssFile });
                  
                  fs.writeFileSync(cssFile, result.css);
                }
              },
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