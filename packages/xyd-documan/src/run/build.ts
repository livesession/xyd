import path from "node:path";
import fs from "node:fs";
import {fileURLToPath} from "node:url";

import {build as viteBuild} from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";

import {reactRouter} from "@xyd-js/react-router-dev/vite";
// import { reactRouter } from "@react-router/dev/vite";

import {vitePlugins as xydContentVitePlugins} from "@xyd-js/content"
import {pluginZero} from "@xyd-js/plugin-zero";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the main function to run the builds
export async function build() {
    const resp = await pluginZero()
    if (!resp) {
        throw new Error("PluginZero not found")
    }

    const buildDir = path.join(process.cwd(), ".xyd/build");

    {
        const packageJsonPath = path.join(buildDir, 'package.json');

        const packageJsonContent = {
            type: "module",
            scripts: {},
            dependencies: {},
            devDependencies: {}
        };

        // Ensure the build directory exists
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, {recursive: true});
        }

        // Write the package.json file
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2), 'utf8');
    }

    try {
        // Build the client-side bundle
        await viteBuild({
            root: path.join(__dirname, "../host"),
            // @ts-ignore
            plugins: [
                ...(xydContentVitePlugins({
                    toc: {
                        minDepth: 2,
                    }
                }) as Plugin[]),
                reactRouter({
                    outDir: buildDir,
                    routes: resp.routes
                }),
                tsconfigPaths(),
                ...resp.vitePlugins
            ],
            optimizeDeps: {
                include: ["react/jsx-runtime"],
            },
        });

        // Build the SSR bundle
        await viteBuild({
            root: path.join(__dirname, "../host"),
            build: {
                ssr: true,
            },
            // @ts-ignore
            plugins: [
                ...(xydContentVitePlugins({
                    toc: {
                        minDepth: 2,
                    }
                }) as Plugin[]),
                reactRouter({
                    outDir: buildDir,
                    routes: resp.routes
                }),
                tsconfigPaths(),
                ...resp.vitePlugins
            ],
            optimizeDeps: {
                include: ["react/jsx-runtime"],
            },
        });

        console.log('Build completed successfully.'); // TODO: better message
    } catch (error) {
        console.error('Build failed:', error);  // TODO: better message
    }
}

