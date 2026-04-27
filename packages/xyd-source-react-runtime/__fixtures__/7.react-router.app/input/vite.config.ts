import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { resolve } from "node:path";
import { xydSourceReactRuntime } from "@xyd-js/source-react-runtime";

export default defineConfig({
  plugins: [
    xydSourceReactRuntime(),
    reactRouter(),
  ],
  build: {
    minify: false,
  },
});
