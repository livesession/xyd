import { defineConfig } from "vite";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { xydSourceReactRuntime } from "@xyd-js/source-react-runtime";

export default defineConfig({
  plugins: [
    xydSourceReactRuntime(),
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
  ],
  build: {
    outDir: "dist",
    minify: false,
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
      external: ["react", "react/jsx-runtime", "react/jsx-dev-runtime", "react-dom", "@tanstack/react-router"],
    },
  },
});
