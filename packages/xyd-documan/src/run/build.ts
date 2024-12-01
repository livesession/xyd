import path from "node:path";
import {fileURLToPath} from "node:url";
import {build as viteBuild} from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";
import {reactRouter} from "@xydjs/react-router-dev/vite";

import {vitePlugins as xydContentVitePlugins} from "@xyd/content"
import {Navigation, Settings} from "@xyd/core";
import {pluginZero} from "@xyd/plugin-zero";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TODO: refactor?
function fsNavPages(nav: Navigation): string[] {
    const resp: string[] = []

    nav?.pages?.map((page) => {
        if (typeof page === 'string') {
            resp.push(path.join(process.cwd(), page))
        } else {
            resp.push(...fsNavPages(page))
        }
    })

    return resp
}


// export interface buildOptions { // TODO: finish
//     toc?: RemarkMdxTocOptions
// }

// Define the main function to run the builds
export async function build() {
    const resp = await pluginZero()
    if (!resp) {
        throw new Error("PluginZero not found")
    }

    const settings = resp.settings

    const fsAllPages = settings?.structure?.navigation.reduce((acc: string[], nav: Navigation) => {
        return [
            ...acc,
            ...fsNavPages(nav)
        ]
    }, [] as string[]) || []

    try {
        // Build the client-side bundle
        await viteBuild({
            configFile: path.join(__dirname, "../src/vite/empty-config.ts"), // TODO: bundler
            root: path.join(__dirname, "../host"), // TODO: bundler
            // @ts-ignore
            plugins: [
                ...(xydContentVitePlugins({
                    toc: {
                        minDepth: 2,
                    }
                }) as Plugin[]),
                reactRouter({
                    async prerender() {
                        return [
                            "/",
                            ...fsAllPages,
                        ]
                    },
                }),
                tsconfigPaths(),
                ...resp.vitePlugins
                // injectSettingsPlugin(settings),
            ],
            optimizeDeps: {
                include: ["react/jsx-runtime"],
            }
        });

        // Build the SSR bundle
        await viteBuild({
            configFile: path.join(__dirname, "../src/vite/empty-config.ts"), // TODO: bundler
            root: path.join(__dirname, "../host"), // TODO: bundler
            // @ts-ignore
            plugins: [
                ...(xydContentVitePlugins({
                    toc: {
                        minDepth: 2,
                    }
                }) as Plugin[]),
                reactRouter(),
                reactRouter({
                    async prerender() {
                        return [
                            "/",
                            ...fsAllPages,
                        ]
                    },
                }),
                tsconfigPaths(),
                ...resp.vitePlugins
                // injectSettingsPlugin(settings),
            ],
            build: {
                ssr: true,
            },
            optimizeDeps: {
                include: ["react/jsx-runtime"],
            }
        });

        console.log('Build completed successfully.'); // TODO: better message
    } catch (error) {
        console.error('Build failed:', error);  // TODO: better message
    }
}

