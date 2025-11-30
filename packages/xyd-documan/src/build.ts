import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { build as viteBuild, Plugin as VitePlugin, PluginOption } from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";

import {
    appInit,
    calculateFolderChecksum,
    commonPostInstallVitePlugins,
    commonVitePlugins,
    getAppRoot,
    getBuildPath,
    getHostPath,
    getXydFolderPath,
    postWorkspaceSetup,
    preWorkspaceSetup,
    storeChecksum
} from "./utils";

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

    const commonRunVitePlugins = await commonVitePlugins(respPluginDocs, resolvedPlugins)
    const appRoot = getAppRoot();

    if (!skip) {
        await postWorkspaceSetup(respPluginDocs.settings)

        const newChecksum = calculateFolderChecksum(getHostPath());
        storeChecksum(newChecksum);
    }
    const postInstallVitePlugins = commonPostInstallVitePlugins(respPluginDocs, resolvedPlugins)

    {
        await setupInstallableEnvironmentV2()
    }

    // Determine conditional externals based on settings
    const enableMermaid = !!respPluginDocs?.settings?.integrations?.diagrams
    const externalPackages = enableMermaid ? [] : ["rehype-mermaid", "rehype-graphviz", "@hpcc-js/wasm"]

    try {
        // Build the client-side bundle
        await viteBuild({
            mode: "production",
            root: appRoot,
            plugins: [
                ...(commonRunVitePlugins as PluginOption[]),
                ...(postInstallVitePlugins as PluginOption[]),

                tsconfigPaths(),
            ],
            optimizeDeps: {
                include: ["react/jsx-runtime"],
            },
            define: {
                'process.env.NODE_ENV': JSON.stringify('production'),
            },
            resolve: {
                alias: {
                    process: 'process/browser',
                    // When rehype-mermaid is externalized, resolve it from CLI's node_modules
                    ...(enableMermaid ? {} : { 
                        "rehype-mermaid": path.resolve(getHostPath(), "./node_modules/rehype-mermaid"),
                        "rehype-graphviz": path.resolve(getHostPath(), "./node_modules/rehype-graphviz"),
                        "@hpcc-js/wasm": path.resolve(getHostPath(), "./node_modules/@hpcc-js/wasm"),
                    }),
                }
            },
            build: {
                rollupOptions: {
                    external: externalPackages,
                },
            },
            ssr: {
                external: externalPackages,
            },
            // ssr: {
            //     noExternal: ["react", "react-dom", "react-router"]
            // }
        });

        // Build the SSR bundle
        await viteBuild({
            mode: "production",
            root: appRoot,
            build: {
                ssr: true,
                rollupOptions: {
                    external: externalPackages,
                },
                // rollupOptions: {
                //     external: ["@xyd-js/framework/hydration", "fs"]
                // }
            },
            plugins: [
                fixManifestPlugin(appRoot),
                ...(commonRunVitePlugins as PluginOption[]),
                ...(postInstallVitePlugins as PluginOption[]),

                tsconfigPaths(),
                finishBuild({
                    exit: true,
                    log: false,
                    delayMs: 1000 * 1,
                }),
            ],
            optimizeDeps: {
                include: ["react/jsx-runtime"],
                // include: ["react", "react-dom", "react/jsx-runtime", "react-router"],
                // force: true
            },
            define: {
                'process.env.NODE_ENV': JSON.stringify('production'),
                'process.env': {}
            },
            resolve: {
                alias: {
                    process: 'process/browser',
                    // When rehype-mermaid is externalized, resolve it from CLI's node_modules
                    ...(enableMermaid ? {} : { 
                        "rehype-mermaid": path.resolve(getHostPath(), "./node_modules/rehype-mermaid"),
                        "rehype-graphviz": path.resolve(getHostPath(), "./node_modules/rehype-graphviz"),
                        "@hpcc-js/wasm": path.resolve(getHostPath(), "./node_modules/@hpcc-js/wasm"),
                    }),
                }
            },
            ssr: {
                external: externalPackages,
            },
            // ssr: {
            //     noExternal: ["react", "react-dom", "react-router"]
            // }
        });
    } catch (error) {
        console.error('Build failed:', error);  // TODO: better message
    }
}

function setupInstallableEnvironmentV2() {
    const symbolicXydNodeModules = path.join(getXydFolderPath(), "node_modules")
    const hostNodeModules = path.join(getHostPath(), "node_modules")

    if (fs.existsSync(symbolicXydNodeModules)) {
        if (fs.lstatSync(symbolicXydNodeModules).isSymbolicLink()) {
            fs.unlinkSync(symbolicXydNodeModules);
        } else {
            fs.rmSync(symbolicXydNodeModules, { recursive: true, force: true });
        }
    }
    fs.symlinkSync(hostNodeModules, symbolicXydNodeModules, 'dir');

    // const buildDir = getBuildPath();
    // const packageJsonPath = path.join(buildDir, 'package.json');

    // const packageJsonContent = {
    //     type: "module",
    //     scripts: {},
    //     dependencies: {},
    //     devDependencies: {}
    // };

    // if (!fs.existsSync(buildDir)) {
    //     fs.mkdirSync(buildDir, {recursive: true});
    // }

    // fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2), 'utf8');

    // const buildNodeModulesPath = path.join(buildDir, 'node_modules');
    // const dirname = path.dirname(fileURLToPath(import.meta.url));

    // let workspaceNodeModulesPath = '';
    // if (process.env.XYD_DEV_MODE) {
    //     workspaceNodeModulesPath = path.resolve(dirname, '../../../node_modules');
    // } else {
    //     // TODO: check if works for npm
    //     workspaceNodeModulesPath = getXydFolderPath()
    // }

    // console.log("workspaceNodeModulesPath", workspaceNodeModulesPath);

    // if (fs.existsSync(buildNodeModulesPath)) {
    //     if (fs.lstatSync(buildNodeModulesPath).isSymbolicLink()) {
    //         fs.unlinkSync(buildNodeModulesPath);
    //     } else {
    //         fs.rmSync(buildNodeModulesPath, { recursive: true, force: true });
    //     }
    // }
    // fs.symlinkSync(workspaceNodeModulesPath, buildNodeModulesPath, 'dir');

    // return workspaceNodeModulesPath;
}


// TODO: not so good solution
// fixManifestPlugin is needed for fixing server manifest for react-router cuz we use different `root` and output
function fixManifestPlugin(
    appRoot: string
): VitePlugin {
    const manifestPath = path.join(
        getBuildPath(),
        // getAppRoot(),
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

/**
 * Vite plugin that runs the route renaming after the build completes.
 */
function finishBuild(options?: {
    log?: boolean, // default true
    onBeforeExit?: (activeHandles: string[]) => void;
    exit?: boolean; // default true
    delayMs?: number; // default 50
}): VitePlugin {
    const log = options?.log ?? true;
    const exit = options?.exit ?? true;
    const delayMs = options?.delayMs ?? 50;
    return {
        name: 'rename-routes',
        apply: 'build',
        async closeBundle() {
            console.log('Processing build completion...');

            // Run the route renaming
            // https://github.com/remix-run/react-router/discussions/12596
            renamePrerenderedRoutes();

            // Give Vite a tick to finish any async write operations
            // TODO: better solution
            await new Promise(resolve => setTimeout(resolve, delayMs));

            const handles =
                (process as any)._getActiveHandles?.()
                    ?.map((h: any) => h?.constructor?.name || typeof h) || [];

            options?.onBeforeExit?.(handles);

            // If anything is still keeping the event loop alive, you can force-exit.
            if (exit) {
                // Optional: print what's keeping Node alive to help you fix root cause
                if (handles.length) {
                    log && console.log('[stop-on-build] Active handles:', handles);
                }

                console.log('Build completed, exiting...');
                process.exit(0);
            }
        },
    };
}


type ConflictPolicy = "skip" | "overwrite" | "suffix";

interface Options {
    rootDir?: string;                         // defaults to <build>/client
    ext?: string;                             // defaults to ".html"
    onConflict?: ConflictPolicy;              // defaults to "skip"
    dryRun?: boolean;                         // defaults to false
    removeEmptyDirs?: boolean;                // defaults to true
}

function renamePrerenderedRoutes(opts: Options = {}) {
    const {
        rootDir = path.join(getBuildPath(), "client"),
        ext = ".html",
        onConflict = "skip",
        dryRun = false,
        removeEmptyDirs = true,
    } = opts;

    if (!fs.existsSync(rootDir)) {
        // console.log(`[flatten] Skip: ${rootDir} does not exist.`);
        return;
    }

    let moved = 0, skipped = 0, overwritten = 0, removedDirs = 0;

    const isIgnorableJunk = (name: string) =>
        name === ".DS_Store" || name === "Thumbs.db";

    const dirIsEmpty = (dir: string) => {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true })
                .filter(e => !isIgnorableJunk(e.name));
            return entries.length === 0;
        } catch {
            return false;
        }
    };

    const uniqueWithSuffix = (targetPath: string) => {
        const { dir, name, ext: e } = path.parse(targetPath);
        let i = 1;
        let candidate = targetPath;
        while (fs.existsSync(candidate)) {
            candidate = path.join(dir, `${name}-${i}${e}`);
            i++;
        }
        return candidate;
    };

    const moveIndexUp = (parentDir: string, subdirName: string) => {
        const folderPath = path.join(parentDir, subdirName);
        const indexHtmlPath = path.join(folderPath, "index.html");
        if (!fs.existsSync(indexHtmlPath)) return;

        let newHtmlPath = path.join(parentDir, `${subdirName}${ext}`);

        if (fs.existsSync(newHtmlPath)) {
            if (onConflict === "skip") {
                // console.log(`[flatten] Skip (exists): ${newHtmlPath}`);
                skipped++;
                return;
            }
            if (onConflict === "overwrite") {
                // console.log(`[flatten] Overwrite: ${newHtmlPath}`);
                if (!dryRun) fs.rmSync(newHtmlPath);
                overwritten++;
            }
            if (onConflict === "suffix") {
                const suffixed = uniqueWithSuffix(newHtmlPath);
                // console.log(`[flatten] Conflict → suffix: ${path.basename(newHtmlPath)} -> ${path.basename(suffixed)}`);
                newHtmlPath = suffixed;
            }
        }

        // console.log(`[flatten] ${path.relative(rootDir, indexHtmlPath)} -> ${path.relative(rootDir, newHtmlPath)}`);
        if (!dryRun) fs.renameSync(indexHtmlPath, newHtmlPath);
        moved++;

        if (removeEmptyDirs && dirIsEmpty(folderPath)) {
            // console.log(`[flatten] Removing empty dir: ${path.relative(rootDir, folderPath)}`);
            if (!dryRun) fs.rmSync(folderPath, { recursive: true });
            removedDirs++;
        }
    };

    const dfs = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subdir = path.join(dir, entry.name);
                // 1) descend first (process children)
                dfs(subdir);
                // 2) then flatten this subdir's index.html up into 'dir'
                moveIndexUp(dir, entry.name);
            }
        }
    };

    dfs(rootDir);

    // console.log(`[flatten] Done. moved=${moved}, skipped=${skipped}, overwritten=${overwritten}, removedDirs=${removedDirs}, dryRun=${dryRun}`);
}
