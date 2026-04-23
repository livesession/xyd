import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import react from '@vitejs/plugin-react';
import {xydSourceReactRuntime} from '@xyd-js/source-react-runtime';

export default defineConfig({
    plugins: [
        xydSourceReactRuntime(),
        react({jsxRuntime: 'automatic'}),
    ],
    build: {
        lib: {
            entry: 'src/index.ts',
            formats: ['es'],
            fileName: 'index',
        },
        rollupOptions: {
            external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'],
        },
        minify: false,
        sourcemap: false,
    },
});
