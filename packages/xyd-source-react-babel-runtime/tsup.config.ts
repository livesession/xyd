import {defineConfig, Options} from 'tsup';

const config: Options = {
    entry: {
        index: 'src/index.ts',
        'babel-plugin': 'src/babel-plugin.ts',
    },
    format: ['esm'],
    target: 'node16',
    dts: {
        entry: {
            index: 'src/index.ts',
            'babel-plugin': 'src/babel-plugin.ts',
        },
        resolve: true,
    },
    splitting: false,
    sourcemap: true,
    clean: true,
    tsconfig: 'tsconfig.tsup.json',
};

export default defineConfig(config);
