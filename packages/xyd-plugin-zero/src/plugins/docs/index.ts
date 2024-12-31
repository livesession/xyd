import fs from 'fs';
import path from 'path';

import {Plugin as VitePlugin} from "vite";
import {route} from "@react-router/dev/routes";

import {Settings} from "@xyd/core";

import {Plugin} from "../../types";
import {readSettings} from "./settings";
import path from "node:path";

interface docsPluginOptions {
    urlPrefix?: string
}

function preinstall() {
    return async function docsPluginInner() {
        const settings = await readSettings()

        return {
            settings
        }
    }
}

// TODO: maybe later as a separate plugin?
function vitePluginSettings() {
    return async function ({preinstall}): Promise<VitePlugin> {
        return {
            name: 'virtual:xyd-settings',
            resolveId(id) {
                if (id === 'virtual:xyd-settings') {
                    return id + '.jsx'; // Return the module with .jsx extension
                }
                return null;
            },
            async load(id) {
                if (id === 'virtual:xyd-settings.jsx') {
                    if (typeof preinstall.settings === "string") {
                        return preinstall.settings
                    }

                    return `export default ${JSON.stringify(preinstall.settings)};`
                }
                return null;
            },
        };
    }
}

export function vitePluginThemeCSS() {
    return async function ({preinstall}: { preinstall: { settings: Settings } }): Promise<VitePlugin> {
        return {
            name: 'virtual:xyd-theme-css',

            resolveId(source) {
                // TODO: BAD SOLUTION
                if (source === 'virtual:xyd-theme/index.css') {
                    switch (preinstall.settings.styling?.theme) {
                        // TODO: support another themes
                        case "gusto": {
                            const gustoCss = import.meta.url.split("packages/")[0] += "node_modules/@xyd/theme-gusto/dist/index.css"
                            return gustoCss.replace("file://", "")
                        }
                        default: {
                            const gustoCss = import.meta.url.split("packages/")[0] += "node_modules/@xyd/theme-gusto/dist/index.css"
                            return gustoCss.replace("file://", "")
                        }
                    }
                }
                return null;
            },
        };
    };
}

export function vitePluginTheme() {
    return async function ({
                               preinstall
                           }: {
        preinstall: {
            settings: Settings
        }
    }): Promise<VitePlugin> {
        return {
            name: 'virtual:xyd-theme',
            resolveId(id) {
                if (id === 'virtual:xyd-theme') {
                    return id;
                }
                return null;
            },
            async load(id) {
                if (id === 'virtual:xyd-theme') {
                    switch (preinstall.settings.styling?.theme) {
                        // TODO: support another themes
                        case "gusto": {
                            return `import Theme from '@xyd/theme-gusto'; export default Theme;`;
                        }
                        default: {
                            return `import Theme from '@xyd/theme-gusto'; export default Theme;`;
                        }
                    }
                }
                return null;
            }
        };
    }
}

// TODO: custom route?
function plugin(_, options: docsPluginOptions) {
    return {
        preinstall: [
            preinstall
        ],
        routes: [
            route(options.urlPrefix ? `${options.urlPrefix}/*` : "*", "../../../xyd-plugin-zero/src/pages/docs.tsx", { // TODO: absolute paths does not works
                id: "xyd-plugin-zero/docs",
            }),
        ],
        vitePlugins: [
            vitePluginSettings,
            vitePluginTheme,
            vitePluginThemeCSS,
        ]
    }
}

export const docsPlugin = plugin as Plugin<unknown>
