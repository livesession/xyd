import path from "node:path";
import {fileURLToPath} from "node:url";
import {createServer, searchForWorkspaceRoot} from "vite";

import {reactRouter} from "@xyd-js/react-router-dev/vite";
// import { reactRouter } from "@react-router/dev/vite";

import {vitePlugins as xydContentVitePlugins} from "@xyd/content";
import {pluginZero} from "@xyd/plugin-zero";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.XYD_PORT ? parseInt(process.env.XYD_PORT) : 5175;

export async function dev() {
    const resp = await pluginZero()
    if (!resp) {
        throw new Error("PluginZero not found")
    }

    const allowCwd = searchForWorkspaceRoot(process.cwd())

    const preview = await createServer({
        // any valid user config options, plus `mode` and `configFile`
        // configFile: path.join(__dirname, "../src/vite/empty-config.ts"), // TODO: bundler??
        // configFile: path.join(__dirname, "../"), // TODO: bundler??
        // root: path.join(__dirname, "../"), // TODO: bundler?
        root: process.env.XYD_DOCUMAN_HOST || path.join(__dirname, "../host"), // TODO: bundler?
        server: {
            port: port,
            fs: {
                allow: [
                    allowCwd,
                    // path.join(__dirname, "../node_modules") // Ensure node_modules from xyd-documan is included
                ]
            }
        },
        build: {
            rollupOptions: {
                // Exclude package `B` from the client-side bundle
                external: ["@xyd/uniform", "@xyd/uniform/content", "@xyd/plugin-zero"],
            },
        },
        ssr: {
            external: ["@xyd/uniform", "@xyd/uniform/content", "@xyd/plugin-zero"],
            // noExternal: [
            //     "@xyd/uniform",
            //     "@xyd/uniform/content",
            //     "@xyd/plugin-zero"
            // ],
        },
        optimizeDeps: {
            include: ["react/jsx-runtime"],
        },
        // @ts-ignore
        plugins: [ // TODO: fix plugin ts
            ...(xydContentVitePlugins({
                toc: {
                    minDepth: 2,
                }
            }) as Plugin[]),
            reactRouter({
                routes: resp.routes
            }),
            // reactRouter(),
            ...resp.vitePlugins
        ],
    });

    await preview.listen(port);

    preview.printUrls();
    preview.bindCLIShortcuts({print: true});

}