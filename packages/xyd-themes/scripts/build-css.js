import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import postcss from 'postcss';
import postcssImport from 'postcss-import';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(__dirname, '../../..');

async function processCSS(inputFile, outputFile) {
    const css = await fs.readFile(inputFile, 'utf8');
    const result = await postcss([
        postcssImport({
            path: [
                path.join(__dirname, '../src'),
                path.join(workspaceRoot, 'packages'),
                workspaceRoot
            ],
            filter: (url) => {
                // Handle package imports
                if (url.startsWith('@xyd-js/')) {
                    const [scope, packageName, ...rest] = url.split('/');
                    // Look in dist directory for the CSS files
                    return path.join(workspaceRoot, 'packages', packageName, 'dist', ...rest);
                }
                return url;
            }
        })
    ]).process(css, {
        from: inputFile,
        to: outputFile,
        config: path.join(__dirname, '../postcss.config.cjs')
    });

    await fs.writeFile(outputFile, result.css);
}

async function main() {
    const distDir = path.join(__dirname, '../dist');
    await fs.mkdir(distDir, { recursive: true });

    await processCSS(
        path.join(__dirname, '../src/styles/index.css'),
        path.join(distDir, 'index.css')
    );

    await processCSS(
        path.join(__dirname, '../src/styles/reset.css'),
        path.join(distDir, 'tokens.css')
    );
}

main().catch(console.error); 