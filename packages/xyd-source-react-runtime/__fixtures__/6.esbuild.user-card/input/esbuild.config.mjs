import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as esbuild from 'esbuild';
import {xydSourceReactRuntimeEsbuild} from '@xyd-js/source-react-runtime/esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));

await esbuild.build({
    entryPoints: [resolve(__dirname, 'src/index.ts')],
    outfile: resolve(__dirname, 'dist/index.js'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'],
    minify: false,
    plugins: [
        xydSourceReactRuntimeEsbuild(),
    ],
});
