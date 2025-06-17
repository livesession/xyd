import path from "node:path";
import fs from "node:fs";

import { createServer, searchForWorkspaceRoot, ViteDevServer } from "vite";

import { API, APIFile, } from "@xyd-js/core";

import { appInit, calculateFolderChecksum, commonVitePlugins, getAppRoot, getDocsPluginBasePath, getHostPath, getPublicPath, postWorkspaceSetup, preWorkspaceSetup, storeChecksum } from "./utils";
import { CACHE_FOLDER_PATH, SUPPORTED_WATCH_FILES } from "./const";
import {CLI} from "./cli";

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
    const spinner = new CLI('dots');
    spinner.startSpinner('Preparing local xyd instance...');

    const skip = await preWorkspaceSetup()

    const { respPluginDocs, resolvedPlugins } = await appInit()
    const allowCwd = searchForWorkspaceRoot(process.cwd())
    const appRoot = getAppRoot()
    const commonRunVitePlugins = commonVitePlugins(respPluginDocs, resolvedPlugins)
    spinner.stopSpinner();

    if (!skip) {
        await postWorkspaceSetup(respPluginDocs.settings)

        const newChecksum = calculateFolderChecksum(getHostPath());
        storeChecksum(newChecksum);
    }

    // ⚠️  
    spinner.log('✔ Local xyd instance is ready');

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


/**
 * @todo: !!! in the future it should be created at different level !!!
 * 
 * Walks api.*, 
 * resolves all referenced files under `basePath`,
 * and returns a set of absolute paths.
 */
export function resolveApiFilePaths(
    basePath: string,
    api: API
): Record<string, true> {
    const result: Record<string, true> = {}

    const apis = [api.openapi, api.graphql, api.sources].filter((s): s is APIFile => s !== undefined)

    apis.forEach(section => {
        flattenApiFile(section).forEach(p => {
            const apiAbsPath = path.resolve(basePath, p)
            result[apiAbsPath] = true
        })
    })

    return result
}


/**
 * Given any APIFile-ish value, returns an array of the raw source-paths.
 */
function flattenApiFile(file?: APIFile): string[] {
    if (!file) return []

    // single string
    if (typeof file === 'string') {
        return [file]
    }

    // array of anything
    if (Array.isArray(file)) {
        return file.flatMap(flattenApiFile)
    }

    // object: either a nested config, or a map of name→file
    if (typeof file === 'object') {
        const obj = file as Record<string, any>

        // explicit nested entry
        if (typeof obj.source === 'string') {
            return [obj.source]
        }

        // fallback: treat as { key: APIFile } map
        return Object.values(obj).flatMap(flattenApiFile)
    }

    // everything else (e.g. numbers, booleans) gets dropped
    return []
}