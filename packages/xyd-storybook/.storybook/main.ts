import { join, dirname } from "path";

import React from "react";
import type { StorybookConfig } from "@storybook/react-vite";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, "package.json")));
}


const config: StorybookConfig = {
    stories: ["../src/docs/**/*.mdx", "../src/docs/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    addons: [
        getAbsolutePath("@storybook/addon-essentials"),
        getAbsolutePath("@storybook/addon-storysource"),
        {
            name: '@storybook/addon-docs',
            options: {
                mdxPluginOptions: {
                    mdxCompileOptions: {
                        remarkPlugins: [
                        ]
                    },
                },
            },
        },
    ],
    framework: {
        name: getAbsolutePath("@storybook/react-vite"),
        options: {},
    },
    features: {
        experimentalRSC: true,
    }
};
export default config;
