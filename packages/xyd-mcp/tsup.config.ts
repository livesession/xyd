import { defineConfig } from "tsup";

// ESM for Node (no bun needed). Every dependency and peer stays external, and
// the resource renderer and the llms.txt tools land in their own chunks, loaded
// by the dynamic imports in lib/index.ts — a tools-only consumer never loads them.
export default defineConfig({
    entry: ["index.ts"],
    format: ["esm"],
    platform: "node",
    target: "node20",
    outDir: "dist",
    splitting: true,
    sourcemap: true,
    clean: true,
    dts: false,
});
