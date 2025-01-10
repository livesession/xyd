import type {StorybookConfig} from "@storybook/react-vite";
import remarkGfm from 'remark-gfm';
import {visit} from 'unist-util-visit';

import {join, dirname} from "path";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, "package.json")));
}

function remarkInjectMeta() { // TODO: move to @xyd-js/content
    return (tree) => {
        visit(tree, 'code', (node) => {
            if (node.meta) {
                node.data = node.data || {};
                node.data.hProperties = {
                    ...(node.data.hProperties || {}),
                    meta: node.meta,
                };
            }
        });
    };
}

const config: StorybookConfig = {
    stories: ["../src/docs/**/*.mdx", "../src/docs/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    addons: [
        getAbsolutePath("@storybook/addon-onboarding"),
        getAbsolutePath("@storybook/addon-links"),
        getAbsolutePath("@storybook/addon-essentials"),
        getAbsolutePath("@chromatic-com/storybook"),
        getAbsolutePath("@storybook/addon-interactions"),
        {
            name: '@storybook/addon-docs',
            options: {
                mdxPluginOptions: {
                    mdxCompileOptions: {
                        remarkPlugins: [
                            remarkGfm,
                            remarkInjectMeta
                        ],
                    },
                },
            },
        },
    ],
    framework: {
        name: getAbsolutePath("@storybook/react-vite"),
        options: {},
    },
};
export default config;
