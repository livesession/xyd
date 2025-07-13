import { promises as fs } from 'fs';
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createServer, Plugin as VitePlugin } from "vite";
import { route } from "@react-router/dev/routes";

import { Settings } from "@xyd-js/core";

import { Preset, PresetData } from "../../types";
import { readSettings } from "./settings";
import { DEFAULT_THEME, THEME_CONFIG_FOLDER } from "../../const";
import { getDocsPluginBasePath, getHostPath } from "../../utils";

interface docsPluginOptions {
    urlPrefix?: string
    appInit: any
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
        if (settings && !settings.theme) {
            settings.theme = {
                name: DEFAULT_THEME
            }
        }

        let themeRoutesExists = false
        try {
            await fs.access(path.join(root, THEME_CONFIG_FOLDER, "./routes.ts"))
            themeRoutesExists = true
        } catch (_) {
        }

        if (themeRoutesExists) {
            const routeMod = await loadModule(path.join(root, THEME_CONFIG_FOLDER, "./routes.ts"))

            const routes = routeMod((routePath, routeFile, routeOptions) => {
                return route(routePath, path.join(root, THEME_CONFIG_FOLDER, routeFile), routeOptions)
            })

            data.routes.push(...routes)
        }

        return {
            settings
        }
    }
}

// TODO: maybe later as a separate plugin?
// function vitePluginSettings() {
//     return async function ({ preinstall }): Promise<VitePlugin> {
//         return {
//             name: 'virtual:xyd-settings',
//             resolveId(id) {
//                 if (id === 'virtual:xyd-settings') {
//                     return id + '.jsx'; // Return the module with .jsx extension
//                 }
//                 return null;
//             },
//             async load(id) { // TODO: better cuz we probably dont neeed `get settings()`
//                 if (id === 'virtual:xyd-settings.jsx') {
//                     return `
//                         export default {
//                             get settings() {
//                                 return globalThis.__xydSettings || ${typeof preinstall.settings === "string" ? preinstall.settings : JSON.stringify(preinstall.settings)}
//                             }
//                         }
//                     `
//                 }
//                 return null;
//             },
//         };
//     }
// }


function vitePluginSettings(options: docsPluginOptions) {
    return function () {
        return async function ({ preinstall }): Promise<VitePlugin> {
            const virtualId = 'virtual:xyd-settings';
            const resolvedId = virtualId + '.jsx';

            let currentSettings = globalThis.__xydSettings
            if (!currentSettings && preinstall?.settings) {
                currentSettings = typeof preinstall?.settings === "string" ? preinstall?.settings : JSON.stringify(preinstall?.settings || {})
            }

            return {
                name: 'xyd:virtual-settings',

                resolveId(id) {
                    if (id === virtualId) {
                        return resolvedId;
                    }
                    return null;
                },


                async load(id) {
                    if (id === 'virtual:xyd-settings.jsx') {
                        return `
                        // Always get the latest settings from globalThis
                        const getCurrentSettings = () => {
                            return globalThis.__xydSettings || ${typeof currentSettings === "string" ? currentSettings : JSON.stringify(currentSettings)}
                        };
                        
                        export default {
                            get settings() {
                                return getCurrentSettings();
                            }
                        }
                        `
                    }
                    return null;
                },

                async hotUpdate(ctx) {
                    const isConfigfileUpdated = ctx.file.includes('react-router.config.ts')
                    if (isConfigfileUpdated) {
                        return
                    }

                    const newSettings = await readSettings();
                    if (!newSettings) {
                        console.log('⚠️ Failed to read new settings');
                        return
                    }

                    if (options.appInit) {
                        // TODO: better way to handle that - we need this cuz otherwise its inifiite reloads
                        if (newSettings.engine?.uniform?.store) {
                            await options.appInit({
                                disableFSWrite: true,
                            })
                        } else {
                            await options.appInit() // TODO: !!! IN THE FUTURE MORE EFFICIENT WAY !!!
                        }
                    }

                    currentSettings = globalThis.__xydSettings

                    return
                },
            };
        }
    }
}


export function vitePluginThemeCSS() {
    return async function ({
        preinstall
    }: {
        preinstall: {
            settings: Settings
        }
    }): Promise<VitePlugin> {
        return {
            name: 'virtual:xyd-theme/index.css',

            resolveId(source) {
                if (source === 'virtual:xyd-theme/index.css') {
                    const __filename = fileURLToPath(import.meta.url);
                    const __dirname = path.dirname(__filename);

                    const themeName = preinstall.settings.theme?.name || DEFAULT_THEME
                    let themePath = ""

                    if (process.env.XYD_CLI) {
                        themePath = path.join(getHostPath(), `node_modules/@xyd-js/theme-${themeName}/dist`)
                    } else {
                        themePath = path.join(path.resolve(__dirname, "../../"), `xyd-theme-${themeName}/dist`)
                    }

                    return path.join(themePath, "index.css")
                }

                return null;
            }
        };
    }
}

export function vitePluginThemeOverrideCSS() {
    return async function ({ preinstall }: { preinstall: { settings: Settings } }): Promise<VitePlugin> {
        return {
            name: 'virtual:xyd-theme-override-css',

            async resolveId(id) {
                if (id === 'virtual:xyd-theme-override/index.css') {
                    const root = process.cwd();
                    const filePath = path.join(root, THEME_CONFIG_FOLDER, "./index.css");

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
                    // return ''
                    const __filename = fileURLToPath(import.meta.url);
                    const __dirname = path.dirname(__filename);

                    const themeName = preinstall.settings.theme?.name || DEFAULT_THEME
                    let themePath = ""

                    if (process.env.XYD_CLI) {
                        themePath = `@xyd-js/theme-${themeName}`
                    } else {
                        themePath = path.join(path.resolve(__dirname, "../../"), `xyd-theme-${themeName}/src`)
                    }

                    // Return a module that imports the theme from the local workspace
                    return `
                        import Theme from '${themePath}';
                        
                        export default Theme;
                    `;
                }
                return null;
            }
        };
    }
}

function preset(settings: Settings, options: docsPluginOptions) {
    const basePath = getDocsPluginBasePath()

    return {
        preinstall: [
            preinstall,
        ],
        routes: [
            route("", path.join(basePath, "src/pages/docs.tsx")),
            // TODO: custom routes
            route(options.urlPrefix ? `${options.urlPrefix}/*` : "*", path.join(basePath, "src/pages/docs.tsx"), {
                id: "xyd-plugin-docs/docs",
            }),
        ],
        vitePlugins: [
            vitePluginSettings(options),
            vitePluginTheme,
            vitePluginThemeCSS,
            vitePluginThemeOverrideCSS
        ],
        basePath
    }
}

export const docsPreset = preset as Preset<unknown>
