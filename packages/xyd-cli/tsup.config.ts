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
        // Bundle the small OpenCLI helpers into the CLI so the published package
        // is self-contained (they aren't published as installable runtime deps).
        noExternal: ['@xyd-js/opencli', '@xyd-js/opencli-completion'],
        plugins: []
    },
]);

