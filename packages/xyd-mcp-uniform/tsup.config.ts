import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["index.ts"],
    format: ["esm"],
    target: "node18",
    dts: {
        entry: "index.ts",
        resolve: true,
    },
    splitting: false,
    sourcemap: true,
    clean: true,
    esbuildOptions: (options) => {
        options.platform = "node";
    },
});
