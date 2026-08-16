import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  // Router runs in BOTH the browser and (SSR) the bun server — keep it neutral
  // and let the consuming Bun.build set the platform. React stays external.
  external: ["react", "react-dom", "react/jsx-runtime"],
});
