import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import react from '@vitejs/plugin-react';
import {xydSourceReactRuntime} from '@xyd-js/source-react-runtime';

export default defineConfig({
    plugins: [
        xydSourceReactRuntime(),
        react(),
    ],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                'sample-app': resolve(__dirname, 'sample-app.html'),
            },
        },
        minify: false,
    },
});
