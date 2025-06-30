import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { build as viteBuild, Plugin as VitePlugin } from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";

import { appInit, calculateFolderChecksum, commonVitePlugins, getAppRoot, getBuildPath, getHostPath, postWorkspaceSetup, preWorkspaceSetup, storeChecksum } from "./utils";

// Define the main function to run the builds
export async function build() {
    const skip = await preWorkspaceSetup({
        force: true
    })

    const inited = await appInit()
    if (!inited) {
        return
    }
    const { respPluginDocs, resolvedPlugins } = inited

    const commonRunVitePlugins = commonVitePlugins(respPluginDocs, resolvedPlugins)
    const appRoot = getAppRoot();

    if (!skip) {
        await postWorkspaceSetup(respPluginDocs.settings)

        const newChecksum = calculateFolderChecksum(getHostPath());
        storeChecksum(newChecksum);
    }

    {
        await setupInstallableEnvironmentV2()
    }

    try {
        // Build the client-side bundle
        await viteBuild({
            mode: "production",
            root: appRoot,
            plugins: [
                ...commonRunVitePlugins,

                tsconfigPaths(),
            ],
            optimizeDeps: {
                include: ["react/jsx-runtime"],
            },
            define: {
                'process.env.NODE_ENV': JSON.stringify('production'),
                'process.env': {}
            },
            resolve: {
                alias: {
                    process: 'process/browser'
                }
            },
        });

        // Build the SSR bundle
        await viteBuild({
            mode: "production",
            root: appRoot,
            build: {
                ssr: true
            },
            plugins: [
                fixManifestPlugin(appRoot),
                ...commonRunVitePlugins,
            ],
            optimizeDeps: {
                include: ["react/jsx-runtime"],
            },
            define: {
                'process.env.NODE_ENV': JSON.stringify('production'),
                'process.env': {}
            },
            resolve: {
                alias: {
                    process: 'process/browser'
                }
            },
        });
    } catch (error) {
        console.error('Build failed:', error);  // TODO: better message
    }
}

function setupInstallableEnvironmentV2() {
    // TODO: probably we should have better mechanism - maybe bundle?

    const buildDir = getBuildPath()

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

    // Create symlink to node_modules
    const buildNodeModulesPath = path.join(buildDir, 'node_modules');
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    let workspaceNodeModulesPath = '';
    if (process.env.XYD_DEV_MODE) {
        workspaceNodeModulesPath = path.resolve(dirname, '../../../node_modules');
    } else {
        workspaceNodeModulesPath = path.resolve(dirname, '../../../');
    }

    console.log("workspaceNodeModulesPath", workspaceNodeModulesPath)

    // Remove existing symlink or directory if it exists
    if (fs.existsSync(buildNodeModulesPath)) {
        if (fs.lstatSync(buildNodeModulesPath).isSymbolicLink()) {
            fs.unlinkSync(buildNodeModulesPath);
        } else {
            fs.rmSync(buildNodeModulesPath, { recursive: true, force: true });
        }
    }

    // Create symlink to workspace node_modules
    fs.symlinkSync(workspaceNodeModulesPath, buildNodeModulesPath, 'dir');

    // TOOD: symlink to node_modules
}

// TODO: not so good solution
// fixManifestPlugin is needed for fixing server manifest for react-router cuz we use different `root` and output
function fixManifestPlugin(
    appRoot: string
): VitePlugin {
    const manifestPath = path.join(
        getBuildPath(),
        "./server/.vite/manifest.json"
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