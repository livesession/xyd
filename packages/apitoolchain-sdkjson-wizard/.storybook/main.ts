import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
// The dev-only middleware that runs the REAL opensdk emitters (Node) and serves
// POST /opensdk-preview. It imports @xyd-js/* — Node-only, never the browser
// bundle (only the stories' fetch client touches the endpoint).
import { opensdkPreviewPlugin } from "../src/preview/middleware";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../../apitoolchain-design-system/public"],
  viteFinal: async (viteConfig) => {
    viteConfig.plugins = [
      ...(viteConfig.plugins ?? []),
      tailwindcss(),
      opensdkPreviewPlugin(),
    ];
    return viteConfig;
  },
};

export default config;
