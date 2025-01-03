import {promises as fs} from 'fs';
import path from "node:path";

import {createServer, Plugin as VitePlugin} from "vite";
import {route} from "@react-router/dev/routes";

import {Settings} from "@xyd/core";

import {Preset, PresetData} from "../../types";
import {readSettings} from "./settings";

interface docsPluginOptions {
    urlPrefix?: string
}

// TODO: find better solution - maybe something what rr7 use?
async function loadModule(filePath: string) {
    const server = await createServer({
        optimizeDeps: {
            include: ["react/jsx-runtime"],
        },
    });

    try {
        const module = await server.ssrLoadModule(filePath);
        return module.default;
    } finally {
        await server.close();
    }
}

function preinstall() {
    return async function docsPluginInner(_, data: PresetData) {
        // TODO: configurable root?
        const root = process.cwd()

        const settings = await readSettings()

        let themeRoutesExists = false
        try {
            await fs.access(path.join(root, ".xyd/theme/routes.ts"))
            themeRoutesExists = true
        } catch (_) {
        }

        if (themeRoutesExists) {
            const routeMod = await loadModule(path.join(root, ".xyd/theme/routes.ts"))

            const routes = routeMod((routePath, routeFile, routeOptions) => {
                return route(routePath, path.join(root, ".xyd/theme", routeFile), routeOptions)
            })

            data.routes.push(...routes)
        }

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
                        // TODO: support another themes + custom themes
                        case "gusto": {
                            const gustoCss = import.meta.url.split("xyd/packages")[0] += "xyd/node_modules/@xyd/theme-gusto/dist/index.css"
                            return gustoCss.replace("file://", "")
                        }
                        case "poetry": {
                            const poetryCss = import.meta.url.split("xyd/packages")[0] += "xyd/node_modules/@xyd/theme-poetry/dist/index.css"
                            return poetryCss.replace("file://", "")
                        }
                        default: {
                            const fableCss = import.meta.url.split("xyd/packages")[0] += "xyd/node_modules/@xyd/fable-wiki/dist/theme.css"
                            return fableCss.replace("file://", "")
                        }
                    }
                }
                return null;
            },
        };
    };
}

export function vitePluginThemeOverrideCSS() {
    return async function ({preinstall}: { preinstall: { settings: Settings } }): Promise<VitePlugin> {
        return {
            name: 'virtual:xyd-theme-override-css',

            resolveId(id) {
                if (id === 'virtual:xyd-theme-override/index.css') {
                    // TODO: configurable root?
                    const root = process.cwd()
                    return path.join(root, ".xyd/theme/index.css")
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
                        // TODO: support another themes + custom themes
                        case "gusto": {
                            return `import Theme from '@xyd/theme-gusto'; export default Theme;`;
                        }
                        case "poetry": {
                            return `import Theme from '@xyd/theme-poetry'; export default Theme;`;
                        }
                        default: {
                            // TODO: in the future custom theme loader
                            return `import Theme from '@xyd/fable-wiki/theme'; export default Theme;`;
                        }
                    }
                }
                return null;
            }
        };
    }
}

function preset(settings: Settings, options: docsPluginOptions) {
    return {
        preinstall: [
            preinstall
        ],
        routes: [
            route("", "../../../xyd-plugin-zero/src/pages/docs.tsx"),
            // TODO: custom routes
            route(options.urlPrefix ? `${options.urlPrefix}/*` : "*", "../../../xyd-plugin-zero/src/pages/docs.tsx", { // TODO: absolute paths does not works
                id: "xyd-plugin-zero/docs",
            }),
        ],
        vitePlugins: [
            vitePluginSettings,
            vitePluginTheme,
            vitePluginThemeCSS,
            vitePluginThemeOverrideCSS,
        ]
    }
}

export const docsPreset = preset as Preset<unknown>
