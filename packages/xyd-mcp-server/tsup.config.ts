import { defineConfig } from "tsup";

// ESM for Node (no bun needed); dependencies stay external.
export default defineConfig({
    entry: ["src/index.ts", "src/cli.ts", "src/mcp.ts"],
    format: ["esm"],
    platform: "node",
    target: "node20",
    outDir: "dist",
    splitting: true,
    sourcemap: true,
    clean: true,
    dts: false,
});
