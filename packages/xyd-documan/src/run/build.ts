import path from "node:path";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {execSync} from 'child_process';

import {build as viteBuild} from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";

import {reactRouter} from "@xyd-js/react-router-dev/vite";

import {vitePlugins as xydContentVitePlugins} from "@xyd-js/content/vite"
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
        // TODO: probably we should have better mechanism - maybe bundle?

        const packageJsonPath = path.join(buildDir, 'package.json');

        const packageJsonContent = {
            type: "module",
            scripts: {},
            dependencies: { // TODO: better
                "@xyd-js/content": "latest",
                "@xyd-js/components": "latest",
                "@xyd-js/framework": "latest",
                "@xyd-js/theme-poetry": "latest",


                "@react-router/node": "7.1.1",
                "isbot": "^5"
            },
            devDependencies: {}
        };

        if (process.env.XYD_DEV_MODE) {
            packageJsonContent.dependencies = {
                ...packageJsonContent.dependencies,
                "@xyd-js/content": "workspace:*",
                "@xyd-js/components": "workspace:*",
                "@xyd-js/framework": "workspace:*",
                "@xyd-js/theme-poetry": "workspace:*",
            }
        }

        // Ensure the build directory exists
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, {recursive: true});
        }

        // Write the package.json file
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2), 'utf8');

        // Install packages inside buildDir
        if (process.env.XYD_DEV_MODE) {
            execSync('pnpm i', {cwd: buildDir, stdio: 'inherit'});
        } else {
            execSync('npm install', {cwd: buildDir, stdio: 'inherit'});
        }
    }

    try {
        // Build the client-side bundle
        await viteBuild({
            root: process.env.XYD_CLI ? __dirname : process.env.XYD_DOCUMAN_HOST || path.join(__dirname, "../host"),
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
            root: process.env.XYD_CLI ? __dirname : process.env.XYD_DOCUMAN_HOST || path.join(__dirname, "../host"),
            build: {
                ssr: true,
            },
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

