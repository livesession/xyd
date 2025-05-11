import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

import { Parser } from 'acorn'
import jsx from 'acorn-jsx'
import { full } from 'acorn-walk'

import { createServer, PluginOption, Plugin as VitePlugin, searchForWorkspaceRoot, ViteDevServer } from "vite";
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'

import { reactRouter } from "@react-router/dev/vite";


import { vitePlugins as xydContentVitePlugins } from "@xyd-js/content/vite";
import { readSettings, pluginZero, type PluginZeroOptions } from "@xyd-js/plugin-zero";
import { API, APIFile, Integrations, Plugins, Settings } from "@xyd-js/core";
import type { Plugin, PluginConfig } from "@xyd-js/plugins";
import { type UniformPlugin } from "@xyd-js/uniform";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.XYD_PORT ? parseInt(process.env.XYD_PORT) : 5175;

// TODO: !!! BETTER TIMER / DEBUG API !!!
if (!process.env.ENABLE_TIMERS) {
    ['time', 'timeLog', 'timeEnd'].forEach(method => {
        console[method] = () => { };
    });
}

export async function dev() {
    const { respPluginZero, resolvedPlugins } = await appInit()
    const allowCwd = searchForWorkspaceRoot(process.cwd())
    const appRoot = process.env.XYD_CLI ? __dirname : process.env.XYD_DOCUMAN_HOST || path.join(__dirname, "../host")

    let server: ViteDevServer | null = null

    const userVitePlugins = resolvedPlugins.map(p => p.vite).flat() || []

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
        define: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'process.env': {}
        },
        resolve: {
            alias: {
                process: 'process/browser'
            }
        },
        build: {
            rollupOptions: {
                external: ["@xyd-js/uniform", "@xyd-js/uniform/content", "@xyd-js/plugin-zero"]
            },
        },
        ssr: {
            external: ["@xyd-js/uniform", "@xyd-js/uniform/content", "@xyd-js/plugin-zero"],
        },
        optimizeDeps: {
            include: ["react/jsx-runtime"]
        },
        plugins: [
            ...(xydContentVitePlugins({
                toc: {
                    maxDepth: respPluginZero.settings.theme?.maxTocDepth || 2,
                },
                settings: respPluginZero.settings,
            }) as VitePlugin[]),     // TODO: fix plugin ts
            ...respPluginZero.vitePlugins,

            reactRouter(),
            // iconify({
            //     rotate: 3000,
            //     local: [],
            // }),
            // Icons({
            //     compiler: 'jsx',
            //     jsx: 'react',
            //   }),
            //   AutoImport({
            //     imports: ['react'],
            //     dts: './src/auto-imports.d.ts',
            //     // dirs: ['src/layouts', 'src/views'],
            //     eslintrc: {
            //       enabled: true,
            //     },
            //     defaultExportByFilename: true,
            //     resolvers: [
            //       IconsResolver({
            //         componentPrefix: 'Icon',
            //       }),
            //     ],
            // }),
            virtualComponentsPlugin(),

            ...userVitePlugins,

            {
                name: 'xyd-configureServer',
                configureServer(s) {
                    server = s
                }
            },
        ],
    });

    // Set up manual file watcher for markdown files TODO: better way? + HMR only for specific components instead or reload a pag
    const watcher = fs.watch(allowCwd, { recursive: true }, async (eventType, filename) => {
        if (!filename) {
            console.log("[xyd:dev] Received empty filename");
            return;
        }

        const filePath = path.join(allowCwd, filename);
        if (filePath.includes('.xyd/.cache')) {
            return
        }

        const suppotedSettingsFiles = ['xyd.json', 'xyd.yaml', 'xyd.yml', 'xyd.ts', 'xyd.tsx']
        const suppotedWatchFiles = ['.md', '.mdx', ...suppotedSettingsFiles]

        let apiPaths: { [path: string]: boolean } = {}
        if (respPluginZero?.settings?.api) {
            apiPaths = resolveApiFilePaths(process.cwd(), respPluginZero.settings.api)
        }
        const apiChanged = !!apiPaths[filePath]

        if (filePath.includes(path.join(process.cwd(), 'public'))) {
            console.log("RELOAD")
            const relativePath = path.relative(allowCwd, filePath);
            const urlPath = '/' + relativePath.replace(/\\/g, '/');

            preview.ws.send({
                type: 'full-reload',
                path: urlPath,
            });
            return
        }

        if (suppotedWatchFiles.some(ext => filePath.endsWith(ext)) || apiChanged) {
            const relativePath = path.relative(allowCwd, filePath);
            const urlPath = '/' + relativePath.replace(/\\/g, '/');

            // TODO: better way to handle that - we need this cuz otherwise its inifiite reloads
            if (respPluginZero?.settings.engine?.uniform?.store) {
                await appInit({
                    disableFSWrite: true,
                })
            } else {
                await appInit() // TODO: !!! IN THE FUTURE MORE EFFICIENT WAY !!!
            }

            // TODO: !!! BETTER HMR !!!

            if (server) {
                let s: ViteDevServer = server
                let basePath = ""
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);

                if (process.env.XYD_CLI) {
                    basePath = path.join(__dirname, "./plugins/xyd-plugin-zero")
                } else {
                    basePath = path.join(__dirname, "../../xyd-plugin-zero")
                }

                const resolved = path.resolve(process.cwd(), basePath, "src/pages/layout.tsx")
                const module = s.moduleGraph.getModuleById(resolved);

                const resolved2 = path.resolve(process.cwd(), basePath, "src/pages/page.tsx")
                const module2 = s.moduleGraph.getModuleById(resolved2);

                if (module && module2) {
                    server.moduleGraph.invalidateModule(module);
                    server.moduleGraph.invalidateModule(module2);
                    try {
                        let rrConfigPath = ""

                        if (process.env.XYD_CLI) {
                            rrConfigPath = path.join(__dirname, ".")
                        } else {
                            rrConfigPath = path.join(__dirname, "../host")
                        }

                        const hostReactRouterConfig = path.resolve(process.cwd(), rrConfigPath, "react-router.config.ts")
                        await fs.promises.utimes(hostReactRouterConfig, new Date(), new Date());
                    } catch (e) {
                        console.error("config update error")
                        console.error(e)
                    }

                    server.ws.send({ type: 'full-reload' });

                    return
                }
            }

            preview.ws.send({
                type: 'full-reload',
                path: urlPath,
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

// TODO: !!! in the future it should be created at different level !!!
function resolveApiFilePaths(basePath: string, api: API): { [path: string]: boolean } {
    const paths: { [path: string]: boolean } = {}

    const addPaths = (pathOrPaths: APIFile | undefined) => {
        if (!pathOrPaths) return
        if (typeof pathOrPaths === 'string') {
            paths[path.resolve(basePath, pathOrPaths)] = true
        } else if (Array.isArray(pathOrPaths)) {
            pathOrPaths.forEach(p => {
                if (typeof p === 'string') {
                    paths[path.resolve(basePath, p)] = true
                }
            })
        } else if (typeof pathOrPaths === 'object') {
            Object.entries(pathOrPaths).forEach(([_, p]) => {
                if (typeof p === 'string') {
                    paths[path.resolve(basePath, p)] = true
                }
            })
        }
    }

    addPaths(api.openapi)
    addPaths(api.graphql)
    addPaths(api.sources)

    return paths
}


async function appInit(options?: PluginZeroOptions) {
    const readPreloadSettings = await readSettings() // TODO: in the future better solution - currently we load settings twice (pluginZero and here)
    if (!readPreloadSettings) {
        throw new Error("cannot preload settings")
    }

    const preloadSettings = typeof readPreloadSettings === "string" ? JSON.parse(readPreloadSettings) : readPreloadSettings

    {
        if (!preloadSettings.integrations?.search) {
            preloadSettings.integrations = {
                ...(preloadSettings.integrations || {}),
                search: {
                    orama: true
                }
            }
        }

        const plugins = integrationsToPlugins(preloadSettings.integrations)
        if (preloadSettings.plugins) {
            preloadSettings.plugins = [...plugins, ...preloadSettings.plugins]
        } else {
            preloadSettings.plugins = plugins
        }
    }

    let resolvedPlugins: PluginConfig[] = []
    {
        resolvedPlugins = await loadPlugins(preloadSettings) || []
        const userUniformVitePlugins: UniformPlugin<any>[] = []

        resolvedPlugins?.forEach(p => {
            if (p.uniform) {
                userUniformVitePlugins.push(...p.uniform)
            }
        })
        globalThis.__xydUserUniformVitePlugins = userUniformVitePlugins
    }

    const respPluginZero = await pluginZero(options)
    if (!respPluginZero) {
        throw new Error("PluginZero not found")
    }
    if (!respPluginZero.settings) {
        throw new Error("Settings not found in respPluginZero")
    }
    respPluginZero.settings.plugins = [
        ...(respPluginZero.settings?.plugins || []),
        ...(preloadSettings.plugins || [])
    ]

    globalThis.__xydBasePath = respPluginZero.basePath
    globalThis.__xydSettings = respPluginZero.settings
    globalThis.__xydPagePathMapping = respPluginZero.pagePathMapping

    return {
        respPluginZero,
        resolvedPlugins
    }
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
    const resolvedPlugins: PluginConfig[] = []

    for (const plugin of settings.plugins || []) {
        let pluginName: string
        let pluginArgs: any[] = []

        if (typeof plugin === "string") {
            pluginName = plugin
            pluginArgs = []
        } else if (Array.isArray(plugin)) {
            pluginName = plugin[0]
            pluginArgs = plugin.slice(1)
        } else {
            console.error(`Currently only string and array plugins are supported, got: ${plugin}`)
            return []
        }

        let mod: any // TODO: fix type
        try {
            mod = await import(pluginName)
        } catch (e) {
            pluginName = path.join(process.cwd(), pluginName)

            // TODO: find better solution? use this every time?
            const pluginPreview = await createServer({
                optimizeDeps: {
                    include: [],
                },
            });
            mod = await pluginPreview.ssrLoadModule(pluginName);
        }

        if (!mod.default) {
            console.error(`Plugin ${plugin} has no default export`)
            continue
        }

        let pluginInstance = mod.default(...pluginArgs) as (PluginConfig | Plugin)
        if (typeof pluginInstance === "function") {
            const plug = pluginInstance(settings)

            resolvedPlugins.push(plug)

            continue
        }

        resolvedPlugins.push(pluginInstance)

    }

    return resolvedPlugins
}

