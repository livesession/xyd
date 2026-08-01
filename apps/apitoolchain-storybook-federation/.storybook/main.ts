import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
// The sdkjson-wizard's live preview runs the real opensdk emitters (Node) via a
// dev middleware; add it here so the aggregated view can run LivePreview too.
import { opensdkPreviewPlugin } from "../../../packages/apitoolchain-sdkjson-wizard/src/preview/middleware";

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
    "../../../packages/apitoolchain-sdkjson-wizard/src/**/*.stories.@(ts|tsx)",
  ],
  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../../../packages/apitoolchain-design-system/public"],
  viteFinal: async (viteConfig) => {
    viteConfig.plugins = [
      ...(viteConfig.plugins ?? []),
      tailwindcss(),
      opensdkPreviewPlugin(),
    ];
    // These are source-linked workspace packages (TS source, not built dists).
    // Pre-bundling them makes their optimized-deps bundle go STALE when their
    // source changes (e.g. a newly-added design-system export), causing runtime
    // "does not provide an export named X" errors that survive restarts. Serve
    // them as source so they always reflect the latest.
    viteConfig.optimizeDeps ??= {};
    viteConfig.optimizeDeps.exclude = [
      ...(viteConfig.optimizeDeps.exclude ?? []),
      "@apitoolchain/design-system",
      "@apitoolchain/auth-design-system",
      "@apitoolchain/sdkjson-wizard",
    ];
    return viteConfig;
  },
};

export default config;
