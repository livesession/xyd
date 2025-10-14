import {defineConfig} from 'tsup';

const entry = ["index.ts", "build.ts"];

export default defineConfig([
    {
        clean: true,
        bundle: true,
        entry,
        format: ['esm'],
        platform: "node",
        outDir: "dist",
        dts: true,
        plugins: []
    },
]);

