import { defineConfig, type Options } from "tsup";

const config: Options = {
  entry: {
    index: "src/index.ts",
  },
  dts: {
    entry: {
      index: "src/index.ts",
    },
  },
  format: ["esm"],
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    "@xyd-js/framework",
    "@xyd-js/framework/react",
    "@xyd-js/analytics",
    "@xyd-js/plugin-access-control",
    "@xyd-js/plugin-access-control/AccessControlContext",
    "@xyd-js/content",
    "@xyd-js/content/search",
    "react",
    "react/jsx-runtime",
  ],
};

export default defineConfig(config);
