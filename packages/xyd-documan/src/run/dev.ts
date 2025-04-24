import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

import { createServer, searchForWorkspaceRoot } from "vite";

import { reactRouter } from "@react-router/dev/vite";

import { vitePlugins as xydContentVitePlugins } from "@xyd-js/content/vite";
import { pluginZero } from "@xyd-js/plugin-zero";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.XYD_PORT ? parseInt(process.env.XYD_PORT) : 5175;

export async function dev() {
    const respPluginZero = await pluginZero()
    if (!respPluginZero) {
        throw new Error("PluginZero not found")
    }

    globalThis.__xydBasePath = respPluginZero.basePath
    globalThis.__xydSettings = respPluginZero.settings

    // Write the configuration to the shared-data.ts file
    // await writeConfig(respPluginZero.settings, respPluginZero.basePath);

    const allowCwd = searchForWorkspaceRoot(process.cwd())
    const appRoot = process.env.XYD_CLI ? __dirname : process.env.XYD_DOCUMAN_HOST || path.join(__dirname, "../host")

    const preview = await createServer({
        root: appRoot,
        publicDir: '/public',
        server: {
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
        plugins: [ // TODO: fix plugin ts
            ...(xydContentVitePlugins({
                toc: {
                    minDepth: 2,
                },
                settings: respPluginZero.settings,
            }) as Plugin[]),
            ...respPluginZero.vitePlugins,
            reactRouter(),
        ]
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