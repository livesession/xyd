import {resolve} from 'path';

import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import wyw from '@wyw-in-js/vite';

// https://vitejs.dev/config/

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    plugins: [
        wyw({
            include: ['**/*.{ts,tsx}'],
            babelOptions: {
                presets: ['@babel/preset-typescript', '@babel/preset-react'],
            },
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});