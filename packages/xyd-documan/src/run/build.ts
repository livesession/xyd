import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { execSync } from 'child_process';

import { build as viteBuild, Plugin } from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";

import { reactRouter } from "@react-router/dev/vite";

import { vitePlugins as xydContentVitePlugins } from "@xyd-js/content/vite"
import { pluginZero } from "@xyd-js/plugin-zero";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the main function to run the builds
export async function build() {
    // Set NODE_ENV to production
    process.env.NODE_ENV = 'production';
    
    const resp = await pluginZero()
    if (!resp) {
        throw new Error("PluginZero not found")
    }

    globalThis.__xydBasePath = resp.basePath
    globalThis.__xydSettings = resp.settings

    // Get package versions from environment variable
    let packageVersions = {};
    if (process.env.XYD_PACKAGE_VERSIONS) {
        try {
            packageVersions = JSON.parse(process.env.XYD_PACKAGE_VERSIONS);
        } catch (error) {
            console.warn("Failed to parse XYD_PACKAGE_VERSIONS:", error);
        }
    }

    setupInstallableEnvironmentV2()
    // setupInstallableEnvironment(packageVersions) TODO:

    const appRoot = process.env.XYD_CLI ? __dirname : process.env.XYD_DOCUMAN_HOST || path.join(__dirname, "../host")

    try {
        // Build the client-side bundle
        await viteBuild({
            root: appRoot,
            plugins: [
                ...(xydContentVitePlugins({
                    toc: {
                        minDepth: 2,
                    },
                    settings: resp.settings,
                }) as Plugin[]),
                reactRouter(),
                tsconfigPaths(),
                ...resp.vitePlugins
            ],
            optimizeDeps: {
                include: ["react/jsx-runtime"],
            },
            define: {
                'process.env.NODE_ENV': JSON.stringify('production')
            }
        });

        // Build the SSR bundle
        await viteBuild({
            root: appRoot,
            build: {
                ssr: true,
            },
            plugins: [
                fixManifestPlugin(appRoot),
                ...(xydContentVitePlugins({
                    toc: {
                        minDepth: 2,
                    },
                    settings: resp.settings,
                }) as Plugin[]),
                reactRouter(),
                tsconfigPaths(),
                ...resp.vitePlugins
            ],
            optimizeDeps: {
                include: ["react/jsx-runtime"],
            },
            define: {
                'process.env.NODE_ENV': JSON.stringify('production')
            }
        });

        // console.log('Build completed successfully.'); // TODO: better message
    } catch (error) {
        console.error('Build failed:', error);  // TODO: better message
    }
}

function setupInstallableEnvironmentV2() {
    // TODO: probably we should have better mechanism - maybe bundle?

    const buildDir = path.join(process.cwd(), ".xyd/build");

    const packageJsonPath = path.join(buildDir, 'package.json');

    const packageJsonContent = {
        type: "module",
        scripts: {},
        dependencies: {
        },
        devDependencies: {}
    };

    // Ensure the build directory exists
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
    }

    // Write the package.json file
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2), 'utf8');
}

// TODO: not so good solution
// fixManifestPlugin is needed for fixing server manifest for react-router cuz we use different `root` and output
function fixManifestPlugin(
    appRoot: string
): Plugin {
    const manifestPath = path.join(
        process.cwd(),
        ".xyd/build/server/.vite/manifest.json"
    );

    return {
        name: "xyd-fix-rr-manifest",
        apply: 'build',        // run after manifest is generated
        // 2) after bundle is written, compute prefix and strip it
        writeBundle(_, bundle) {
            const cwdDir = process.cwd();
            let prefix = path.relative(appRoot, cwdDir).replace(/\\/g, "/");
            if (prefix) prefix += "/";

            // escape for RegExp
            const esc = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const stripRe = new RegExp(`^${esc}`);

            for (const fileName in bundle) {
                const asset = bundle[fileName];

                if (asset.type !== "asset") continue;

                // A) fix manifest.json (client or SSR) keys + entry.src
                if (fileName.endsWith("manifest.json")) {
                    const manifest = JSON.parse(asset.source.toString());
                    const fixed: Record<string, any> = {};

                    for (const key of Object.keys(manifest)) {
                        const entry = manifest[key];
                        const newKey = key.replace(stripRe, "");
                        if (typeof entry.src === "string") {
                            entry.src = entry.src.replace(stripRe, "");
                        }
                        fixed[newKey] = entry;
                    }

                    asset.source = JSON.stringify(fixed, null, 2);
                    fs.writeFileSync(manifestPath, asset.source, 'utf8');

                }

                // B) fix any CSS asset metadata (originalFileNames)
                // TODO: FINISH if it will be needed
                // if (fileName.endsWith(".css") && Array.isArray(asset.originalFileNames)) {
                //     asset.originalFileNames = asset.originalFileNames.map((orig) =>
                //         orig.replace(stripRe, "")
                //     );
                // }
            }

        },
    }
}