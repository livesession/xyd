import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import typescript from '@rollup/plugin-typescript';
import {xydSourceReactRuntime} from '@xyd-js/source-react-runtime';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
    input: 'src/index.ts',
    external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'],
    output: {
        dir: 'dist',
        format: 'es',
        entryFileNames: 'index.js',
    },
    plugins: [
        xydSourceReactRuntime(),
        typescript({tsconfig: resolve(__dirname, 'tsconfig.json'), compilerOptions: {declaration: false}}),
    ],
};
