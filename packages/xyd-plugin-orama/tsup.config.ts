import {copyFile} from 'node:fs/promises';
import {join} from 'node:path';

import {defineConfig, Options} from 'tsup';

const config: Options = {
    entry: {
        index: 'src/index.ts'
    },
    dts: {
        entry: {
            index: 'src/index.ts'
        },
        resolve: true, // Resolve external types
    },
    format: ['esm'],
    platform: 'node',
    shims: false,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [
        'virtual:xyd-plugin-orama-data'
    ],
    onSuccess: async () => {
        await copyFile(
            join(process.cwd(), 'src', 'Search.tsx'),
            join(process.cwd(), 'dist', 'Search.tsx')
        );
    }
}

export default defineConfig(config);
