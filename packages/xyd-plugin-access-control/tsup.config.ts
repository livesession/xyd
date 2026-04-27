import { defineConfig, type Options } from "tsup";

const config: Options = {
  entry: {
    index: "src/index.ts",
    AuthGuard: "src/components/AuthGuard.tsx",
    LoginPage: "src/components/LoginPage.tsx",
    AuthCallbackPage: "src/components/AuthCallbackPage.tsx",
    AccessControlContext: "src/components/AccessControlContext.tsx",
  },
  dts: {
    entry: {
      index: "src/index.ts",
    },
  },
  format: ["esm"],
  platform: "node",
  shims: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  loader: {
    ".css": "text",
  },
  external: [
    "@xyd-js/content",
    "@xyd-js/content/md",
    "@xyd-js/core",
    "@xyd-js/plugins",
    "@xyd-js/framework",
    "react",
    "react/jsx-runtime",
    "vite",
    "node:path",
    "node:fs",
    "node:http",
    "node:crypto",
    "dotenv",
  ],
};

export default defineConfig(config);
