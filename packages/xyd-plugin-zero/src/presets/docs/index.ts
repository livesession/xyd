import {promises as fs} from 'fs';
import path from "node:path";

import {createServer, Plugin as VitePlugin} from "vite";
import {route} from "@react-router/dev/routes";

import {Settings} from "@xyd-js/core";

import {Preset, PresetData} from "../../types";
import {readSettings} from "./settings";
import {fileURLToPath} from "node:url";

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
                    let basePath = ""

                    if (process.env.XYD_CLI) {
                        const __filename = fileURLToPath(import.meta.url);
                        const __dirname = path.dirname(__filename);
                        basePath = __dirname + "/"
                    } else {
                        basePath = import.meta.url.split("xyd/packages")[0] += "xyd/"
                    }

                    switch (preinstall.settings.styling?.theme) {
                        // TODO: support another themes + custom themes
                        case "gusto": {
                            const gustoCss = basePath += "node_modules/@xyd-js/theme-gusto/dist/index.css"
                            return gustoCss.replace("file://", "")
                        }
                        case "poetry": {
                            const poetryCss = basePath += "node_modules/@xyd-js/theme-poetry/dist/index.css"
                            return poetryCss.replace("file://", "")
                        }
                        default: {
                            const fableCss = basePath += "node_modules/@xyd-js/fable-wiki/dist/theme.css"
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
    return async function ({ preinstall }: { preinstall: { settings: Settings } }): Promise<VitePlugin> {
        return {
            name: 'virtual:xyd-theme-override-css',

            async resolveId(id) {
                if (id === 'virtual:xyd-theme-override/index.css') {
                    const root = process.cwd();
                    const filePath = path.join(root, ".xyd/theme/index.css");

                    try {
                        await fs.access(filePath);
                        return filePath;
                    } catch {
                        // File does not exist, omit it
                        return 'virtual:xyd-theme-override/empty.css';
                    }
                }
                return null;
            },

            async load(id) {
                if (id === 'virtual:xyd-theme-override/empty.css') {
                    // Return an empty module
                    return '';
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
                            return `import Theme from '@xyd-js/theme-gusto'; export default Theme;`;
                        }
                        case "poetry": {
                            return `import Theme from '@xyd-js/theme-poetry'; export default Theme;`;
                        }
                        default: {
                            // TODO: in the future custom theme loader
                            return `import Theme from '@xyd-js/fable-wiki/theme'; export default Theme;`;
                        }
                    }
                }
                return null;
            }
        };
    }
}

function preset(settings: Settings, options: docsPluginOptions) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // TODO: !!! IN THE FUTURE BETTER SOLUTION !!!
    let basePath = ""

    if (process.env.XYD_CLI) {
        basePath = path.join(__dirname, "./plugins/xyd-plugin-zero")
    } else {
        basePath = "../../../xyd-plugin-zero"
    }

    return {
        preinstall: [
            preinstall
        ],
        routes: [
            route("", path.join(basePath, "src/pages/docs.tsx")),
            // TODO: custom routes
            route(options.urlPrefix ? `${options.urlPrefix}/*` : "*", path.join(basePath, "src/pages/docs.tsx"), { // TODO: absolute paths does not works
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
