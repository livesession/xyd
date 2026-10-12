import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { build as viteBuild, mergeConfig, Plugin as VitePlugin, PluginOption } from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";

import {
    relocateUnderBasename,
    renamePrerenderedRoutes,
    resolveBuildBase,
} from "./buildOutput";
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
    // Start from an empty output. React Router only empties an out-dir that
    // lies inside the Vite root (ours, .xyd/build, is outside .xyd/host), so a
    // second build piled onto the first: the flatten's skip policy then kept
    // the previous <route>.html and the fresh one stayed in <route>/index.html.
    for (const dir of ["client", "server"]) {
        fs.rmSync(path.join(getBuildPath(), dir), { recursive: true, force: true });
    }

    const skip = await preWorkspaceSetup({
        force: true
    })

    const inited = await appInit()
    if (!inited) {
        return
    }
    const { respPluginDocs, resolvedPlugins } = inited
    // respPluginDocs is null only in the appInit worker-inject path (prerender pool),
    // which the Vite build never takes — narrow the type for the rest of this fn.
    if (!respPluginDocs) return

    const commonRunVitePlugins = await commonVitePlugins(respPluginDocs, resolvedPlugins)
    const appRoot = getAppRoot();

    if (!skip) {
        await postWorkspaceSetup(respPluginDocs.settings)

        const newChecksum = calculateFolderChecksum(getHostPath());
        storeChecksum(newChecksum);
    }

    // If setup was skipped but the active theme is missing, re-run setup
    if (skip && process.env.XYD_CLI) {
        const themeName = respPluginDocs.settings?.theme?.name || "poetry";
        const themePkg = `@xyd-js/theme-${themeName}`;
        const hostPath = getHostPath();
        if (!fs.existsSync(path.join(hostPath, "node_modules", themePkg))) {
            await postWorkspaceSetup(respPluginDocs.settings);
            const newChecksum = calculateFolderChecksum(getHostPath());
            storeChecksum(newChecksum);
        }
    }

    const postInstallVitePlugins = commonPostInstallVitePlugins(respPluginDocs, resolvedPlugins)

    {
        await setupInstallableEnvironmentV2()
    }

    // Determine conditional externals based on settings
    const enableMermaid = !!respPluginDocs?.settings?.integrations?.diagrams
    const externalPackages = enableMermaid ? [] : ["rehype-mermaid", "rehype-graphviz", "@hpcc-js/wasm"]

    const userViteConfig = respPluginDocs.settings?.advanced?.vite || {};

    // `advanced.basename` mounts the site under a prefix. Vite's `base` has to
    // follow it, or the prerendered HTML references `/assets/*` at the server
    // root while the pages live under the prefix. An explicit `advanced.vite.base`
    // still wins (a CDN base, say) — then the assets stay at the client root
    // for the user's own pipeline. Resolved by the helper the Bun engine shares,
    // so both engines agree on the base; selfContained = the whole site under
    // client/<basename>/ — see buildOutput.ts for the anatomy.
    const { basename, base: viteBase, selfContained } = resolveBuildBase(respPluginDocs.settings);

    try {
        // Build the client-side bundle
        let clientConfig: any = {
            mode: "production",
            root: appRoot,
            ...(viteBase ? { base: viteBase } : {}),
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
        };

        if (userViteConfig) {
            clientConfig = mergeConfig(clientConfig, userViteConfig);
        }

        await viteBuild(clientConfig);

        // Build the SSR bundle
        let ssrConfig: any = {
            mode: "production",
            root: appRoot,
            ...(viteBase ? { base: viteBase } : {}),
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
        };

        if (userViteConfig) {
            ssrConfig = mergeConfig(ssrConfig, userViteConfig);
        }

        await viteBuild(ssrConfig);
    } catch (error) {
        console.error('Build failed:', error);  // TODO: better message
        // exit non-zero — otherwise a failed build looks successful to callers
        // (CI, deploy tooling, @xyd-js/vite-plugin)
        process.exit(1);
    }

    // Only reached when both bundles closed cleanly. This used to run from a
    // `closeBundle` hook — but Vite fires closeBundle from its `finally` after
    // a failed write too (a prerender that 404s, say), and Rollup passes no
    // error on that path, so the hook's exit(0) pre-empted Vite's rethrow and
    // a failed build exited 0. Now a failure rejects viteBuild and lands in the
    // catch above.
    await finishBuild({
        basename,
        selfContained,
        log: false,
        delayMs: 1000 * 1,
    });
}

function setupInstallableEnvironmentV2() {
    const symbolicXydNodeModules = path.join(getXydFolderPath(), "node_modules")
    const hostNodeModules = path.join(getHostPath(), "node_modules")

    // lstat, not existsSync: existsSync FOLLOWS symlinks, so a dangling link
    // (target cleaned away) reports "absent" and symlinkSync then throws EEXIST
    let existing: fs.Stats | undefined;
    try { existing = fs.lstatSync(symbolicXydNodeModules); } catch { /* absent */ }
    if (existing) {
        if (existing.isSymbolicLink()) {
            fs.unlinkSync(symbolicXydNodeModules);
        } else {
            fs.rmSync(symbolicXydNodeModules, { recursive: true, force: true });
        }
    }
    fs.symlinkSync(hostNodeModules, symbolicXydNodeModules, 'dir');

    // In XYD_DEV_MODE the host (.xyd/host) lives in the monorepo, but
    // <cwd>/.xyd/build/server/index.js — the file react-router's prerender
    // plugin dynamically imports — sits in the user's CWD. Node's module
    // resolution walks up from that file and reaches .xyd/node_modules
    // (symlinked above to the host's node_modules, which only carries the
    // host's *direct* deps as pnpm symlinks). It never sees the monorepo's
    // root node_modules where shamefully-hoist makes every transitive dep
    // (radix-ui, vfile, lucide-react, …) resolvable. Without this fallback,
    // the prerender's `import()` blows up with "Cannot find package …" and
    // the build silently emits no HTML — surfacing only as
    // "✗ Build failed in N.NNs". A real install path (CI, published xyd-js)
    // doesn't need this because pnpm install in .xyd/host produces a
    // fully-populated node_modules.
    if (process.env.XYD_DEV_MODE) {
        // <documan>/dist/index.js → packages/xyd-documan → packages → monorepo
        const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
        const monorepoNodeModules = path.join(monorepoRoot, "node_modules")
        const cwdNodeModules = path.join(process.cwd(), "node_modules")
        const insideMonorepo = process.cwd() === monorepoRoot ||
            process.cwd().startsWith(monorepoRoot + path.sep)

        if (!insideMonorepo && fs.existsSync(monorepoNodeModules)) {
            if (fs.existsSync(cwdNodeModules) && fs.lstatSync(cwdNodeModules).isSymbolicLink()) {
                fs.unlinkSync(cwdNodeModules)
            }
            // Don't clobber a real node_modules the user already manages.
            if (!fs.existsSync(cwdNodeModules)) {
                fs.symlinkSync(monorepoNodeModules, cwdNodeModules, 'dir')
            }
        }
    }

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
 * Shape the client output after the bundles closed, then exit: flatten the
 * prerendered routes (keeping the basename's own index.html in place) and,
 * when the site is mounted under `advanced.basename`, gather the root-level
 * Vite output (assets/, __spa-fallback.html) under it.
 */
async function finishBuild(options: {
    basename: string;
    /** the Vite base equals the basename: assets live under it, so move them there */
    selfContained: boolean;
    log?: boolean, // default true
    onBeforeExit?: (activeHandles: string[]) => void;
    exit?: boolean; // default true
    delayMs?: number; // default 50
}) {
    const log = options.log ?? true;
    const exit = options.exit ?? true;
    const delayMs = options.delayMs ?? 50;
    const clientDir = path.join(getBuildPath(), "client");

    console.log('Processing build completion...');

    // https://github.com/remix-run/react-router/discussions/12596
    renamePrerenderedRoutes({
        rootDir: clientDir,
        basename: options.basename,
    });

    if (options.selfContained && options.basename) {
        const moved = relocateUnderBasename(clientDir, options.basename);
        if (moved.length) {
            console.log(`Moved ${moved.join(", ")} under ${options.basename}`);
        }
    }

    // Give Vite a tick to finish any async write operations
    // TODO: better solution
    await new Promise(resolve => setTimeout(resolve, delayMs));

    const handles =
        (process as any)._getActiveHandles?.()
            ?.map((h: any) => h?.constructor?.name || typeof h) || [];

    options.onBeforeExit?.(handles);

    // If anything is still keeping the event loop alive, you can force-exit.
    if (exit) {
        // Optional: print what's keeping Node alive to help you fix root cause
        if (handles.length) {
            log && console.log('[stop-on-build] Active handles:', handles);
        }

        console.log('Build completed, exiting...');
        process.exit(0);
    }
}
