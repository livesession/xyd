import { promises as fs } from 'fs';
import path from "node:path";

import { createServer, Plugin as VitePlugin } from "vite";
import { route } from "@react-router/dev/routes";

import { Settings } from "@xyd-js/core";

import { Preset, PresetData } from "../../types";
import { readSettings } from "./settings";
import { fileURLToPath } from "node:url";

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
    return async function ({ preinstall }): Promise<VitePlugin> {
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

                    const themeName = preinstall.settings.theme?.name || 'poetry';
                    let themePath = ""

                    if (process.env.XYD_CLI) { // TODO: if cli prod / cli dev ?
                        themePath = path.join(__dirname, `node_modules/@xyd-js/theme-${themeName}/dist`)
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
                    // return ''
                    const __filename = fileURLToPath(import.meta.url);
                    const __dirname = path.dirname(__filename);

                    const themeName = preinstall.settings.theme?.name || 'poetry';
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
        ],
        basePath
    }
}

export const docsPreset = preset as Preset<unknown>
