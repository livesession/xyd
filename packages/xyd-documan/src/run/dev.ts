import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

import { createServer, PluginOption, searchForWorkspaceRoot } from "vite";

import { reactRouter } from "@react-router/dev/vite";

import { vitePlugins as xydContentVitePlugins } from "@xyd-js/content/vite";
import { pluginZero } from "@xyd-js/plugin-zero";
import { Integrations, Plugins, Settings } from "@xyd-js/core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.XYD_PORT ? parseInt(process.env.XYD_PORT) : 5175;

export async function dev() {
    const respPluginZero = await pluginZero()
    if (!respPluginZero) {
        throw new Error("PluginZero not found")
    }

    if (!respPluginZero.settings.integrations?.search) {
        respPluginZero.settings.integrations = {
            ...(respPluginZero.settings.integrations || {}),
            search: {
                orama: true
            }
        }
    }

    const plugins = integrationsToPlugins(respPluginZero.settings.integrations)
    if (respPluginZero.settings.plugins) {
        respPluginZero.settings.plugins = [...plugins, ...respPluginZero.settings.plugins]
    } else {
        respPluginZero.settings.plugins = plugins
    }
    const resolvedPlugins = await loadPlugins(respPluginZero.settings) || []

    globalThis.__xydBasePath = respPluginZero.basePath
    globalThis.__xydSettings = respPluginZero.settings
    globalThis.__xydPagePathMapping = respPluginZero.pagePathMapping

    const allowCwd = searchForWorkspaceRoot(process.cwd())
    const appRoot = process.env.XYD_CLI ? __dirname : process.env.XYD_DOCUMAN_HOST || path.join(__dirname, "../host")

    const preview = await createServer({
        root: appRoot,
        publicDir: '/public',
        server: {
            allowedHosts: [],
            port: port,
            fs: {
                allow: [
                    allowCwd,
                    process.env.XYD_CLI ? __dirname : path.join(__dirname, "../host"),
                ]
            }
        },
        build: {
            rollupOptions: {
                // Exclude package `B` from the client-side bundle
                external: ["@xyd-js/uniform", "@xyd-js/uniform/content", "@xyd-js/plugin-zero"],
            },
        },
        ssr: {
            external: ["@xyd-js/uniform", "@xyd-js/uniform/content", "@xyd-js/plugin-zero"],
        },
        optimizeDeps: {
            include: ["react/jsx-runtime"],
        },
        plugins: [
            ...(xydContentVitePlugins({
                toc: {
                    minDepth: 2,
                },
                settings: respPluginZero.settings,
            }) as Plugin[]),     // TODO: fix plugin ts
            ...respPluginZero.vitePlugins,

            reactRouter(),

            virtualComponentsPlugin(),

            ...resolvedPlugins,
        ],
    });

    // Set up manual file watcher for markdown files TODO: better way? + HMR only for specific components instead or reload a pag
    const watcher = fs.watch(allowCwd, { recursive: true }, (eventType, filename) => {
        if (!filename) {
            console.log("[xyd:dev] Received empty filename");
            return;
        }

        const filePath = path.join(allowCwd, filename);

        if (filePath.endsWith('.md') || filePath.endsWith('.mdx')) {
            const relativePath = path.relative(allowCwd, filePath);
            const urlPath = '/' + relativePath.replace(/\\/g, '/');

            preview.ws.send({
                type: 'full-reload',
                path: urlPath
            });
        }
    });

    // Log any watcher errors
    watcher.on('error', (error) => {
        console.error("[xyd:dev] File watcher error:", error);
    });

    await preview.listen(port);

    preview.printUrls();
    preview.bindCLIShortcuts({ print: true });

    // Clean up watcher when server is closed
    preview.httpServer?.once('close', () => {
        watcher.close();
    });
}

function virtualComponentsPlugin(): PluginOption {
    return {
        name: 'xyd-plugin-virtual-components',
        enforce: 'pre',
        config: () => {
            // TODO: different for build
            const componentsDist = path.resolve(__dirname, "../node_modules/@xyd-js/components/dist")

            return {
                resolve: {
                    alias: {
                        'virtual-component:Search': path.resolve(componentsDist, "system.js")
                    }
                }
            }
        },
    }
}

function integrationsToPlugins(integrations: Integrations) {
    const plugins: Plugins = []
    let foundSearchIntegation = 0

    if (integrations?.search?.orama) {
        if (typeof integrations.search.orama === "boolean") {
            plugins.push("@xyd-js/plugin-orama")
        } else {
            plugins.push(["@xyd-js/plugin-orama", integrations.search.orama])
        }
        foundSearchIntegation++
    }

    if (integrations?.search?.algolia) {
        plugins.push(["@xyd-js/plugin-algolia", integrations.search.algolia])
        foundSearchIntegation++
    }

    if (foundSearchIntegation > 1) {
        throw new Error("Only one search integration is allowed")
    }

    return plugins
}

async function loadPlugins(
    settings: Settings,
) {
    const resolvedPlugins: any[] = []

    for (const plugin of settings.plugins || []) {
        if (typeof plugin === "string") {
            const mod = await import(plugin)
            if (!mod.default) {
                console.error(`Plugin ${plugin} has no default export`)
                continue
            }

            const pluginInstance = mod.default()

            if (typeof pluginInstance === "function") {
                resolvedPlugins.push(pluginInstance(settings))
            } else {
                resolvedPlugins.push(pluginInstance)
            }
            continue
        }

        const [pluginName, ...pluginArgs] = plugin

        const pluginModule = await import(pluginName)
        const pluginInstance = pluginModule.default(...pluginArgs)

        if (typeof pluginInstance === "function") {
            resolvedPlugins.push(pluginInstance(settings))
        } else {
            resolvedPlugins.push(pluginInstance)
        }
    }

    return resolvedPlugins
}