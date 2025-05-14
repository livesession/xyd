import path from "node:path";
import fs from "node:fs";

import { createServer, searchForWorkspaceRoot, ViteDevServer } from "vite";

import { API, APIFile, } from "@xyd-js/core";

import { appInit, commonVitePlugins, getAppRoot, getDocsPluginBasePath, getHostPath, getPublicPath, postWorkspaceSetup, preWorkspaceSetup } from "./utils";
import { CACHE_FOLDER_PATH, SUPPORTED_WATCH_FILES } from "./const";

// TODO: !!! BETTER TIMER / DEBUG API !!!
if (!process.env.ENABLE_TIMERS) {
    ['time', 'timeLog', 'timeEnd'].forEach(method => {
        console[method] = () => {
        };
    });
}

interface DevOptions {
    port?: number
}
export async function dev(options?: DevOptions) {
    // Ensure required folders exist
    await preWorkspaceSetup()

    const { respPluginDocs, resolvedPlugins } = await appInit()
    const allowCwd = searchForWorkspaceRoot(process.cwd())
    const appRoot = getAppRoot()
    const commonRunVitePlugins = commonVitePlugins(respPluginDocs, resolvedPlugins)

    await postWorkspaceSetup(respPluginDocs.settings)

    let server: ViteDevServer | null = null

    const port = options?.port ?? parseInt(process.env.XYD_PORT ?? "5175")

    const preview = await createServer({
        root: appRoot,
        publicDir: '/public',
        server: {
            allowedHosts: [],
            port: port,
            fs: {
                allow: [
                    allowCwd,
                    appRoot,
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
                external: []
            },
        },
        ssr: {
            external: [],
        },
        optimizeDeps: {
            include: ["react/jsx-runtime"]
        },
        plugins: [
            ...commonRunVitePlugins,

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
        if (filePath.includes(CACHE_FOLDER_PATH)) {
            return
        }

        let apiPaths: { [path: string]: boolean } = {}
        if (respPluginDocs?.settings?.api) {
            apiPaths = resolveApiFilePaths(process.cwd(), respPluginDocs.settings.api)
        }
        const apiChanged = !!apiPaths[filePath]

        if (filePath.includes(getPublicPath())) {
            const relativePath = path.relative(allowCwd, filePath);
            const urlPath = '/' + relativePath.replace(/\\/g, '/');

            preview.ws.send({
                type: 'full-reload',
                path: urlPath,
            });
            return
        }

        if (SUPPORTED_WATCH_FILES.some(ext => filePath.endsWith(ext)) || apiChanged) {
            const relativePath = path.relative(allowCwd, filePath);
            const urlPath = '/' + relativePath.replace(/\\/g, '/');

            // TODO: better way to handle that - we need this cuz otherwise its inifiite reloads
            if (respPluginDocs?.settings.engine?.uniform?.store) {
                await appInit({
                    disableFSWrite: true,
                })
            } else {
                await appInit() // TODO: !!! IN THE FUTURE MORE EFFICIENT WAY !!!
            }

            // TODO: !!! BETTER HMR !!!

            if (server) {
                const docsPluginBasePath = getDocsPluginBasePath()

                const layoutPath = path.join(docsPluginBasePath, "./src/pages/layout.tsx")
                const layoutModule = server.moduleGraph.getModuleById(layoutPath);

                const pagePath = path.join(docsPluginBasePath, "./src/pages/page.tsx")
                const pageModule = server.moduleGraph.getModuleById(pagePath);

                if (layoutModule && pageModule) {
                    server.moduleGraph.invalidateModule(layoutModule);
                    server.moduleGraph.invalidateModule(pageModule);
                    try {
                        const hostPath = getHostPath()
                        const hostReactRouterConfig = path.join(hostPath, "react-router.config.ts")

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



