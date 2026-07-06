import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

/**
 * The single Storybook server for the apitoolchain design systems. It owns no
 * stories of its own — it aggregates the co-located `*.stories.tsx` from every
 * design-system package into one build (Option 1: one real Storybook, many
 * source packages). Add a package below to federate it in.
 */
const config: StorybookConfig = {
  stories: [
    "../../../packages/apitoolchain-design-system/src/**/*.stories.@(ts|tsx)",
    "../../../packages/apitoolchain-auth-design-system/src/**/*.stories.@(ts|tsx)",
  ],
  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../../../packages/apitoolchain-design-system/public"],
  viteFinal: async (viteConfig) => {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    return viteConfig;
  },
};

export default config;
