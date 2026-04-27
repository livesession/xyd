import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {xydSourceReactRuntime} from '@xyd-js/source-react-runtime';

export default defineConfig({
    plugins: [
        xydSourceReactRuntime(),
        react(),
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
    },
});
