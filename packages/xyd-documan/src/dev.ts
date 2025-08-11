import path from "node:path";
import fs from "node:fs";

import { createServer, searchForWorkspaceRoot, ViteDevServer, Plugin as VitePlugin } from "vite";

import { readSettings } from "@xyd-js/plugin-docs";
import { API, APIFile, Navigation, Settings, SidebarNavigation, } from "@xyd-js/core";

import { appInit, calculateFolderChecksum, commonPostInstallVitePlugins, commonVitePlugins, getAppRoot, getDocsPluginBasePath, getHostPath, getPublicPath, postWorkspaceSetup, preWorkspaceSetup, storeChecksum } from "./utils";
import { CACHE_FOLDER_PATH, SUPPORTED_SETTINGS_FILES, SUPPORTED_CONTENT_FILES } from "./const";
import { CLI } from "./cli";

// TODO: !!! BETTER TIMER / DEBUG API !!!
if (!process.env.ENABLE_TIMERS) {
    ['time', 'timeLog', 'timeEnd'].forEach(method => {
        console[method] = () => {
        };
    });
}

// TODO: !!! IN THE FUTURE BETTER SOLUTION !!!
const fullReloadOptions = {
    "theme.name": true,
    "plugins": true, // TODO: in the future better
}

/**
 * Extracts a nested property from an object using dot notation
 * @param obj - The object to extract from
 * @param path - The dot-notation path (e.g., "theme.banner")
 * @returns The value at the path or null if not found
 */
function extractNestedProperty(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return null;
        }
    }

    return current;
}

/**
 * Compares two values for changes, handling deep comparison for objects
 */
function hasValueChanged(oldValue: any, newValue: any): boolean {
    // If one is null/undefined and the other isn't, there's a change
    if (!oldValue && newValue) return true;
    if (oldValue && !newValue) return true;
    if (!oldValue && !newValue) return false;

    // Deep comparison using JSON.stringify for objects/arrays
    const oldStr = JSON.stringify(oldValue);
    const newStr = JSON.stringify(newValue);

    return oldStr !== newStr;
}

/**
 * Checks if any of the properties in fullReloadOptions have changed
 */
function hasFullReloadPropertiesChanged(oldSettings: any, newSettings: any): boolean {
    // Handle null/undefined settings
    if (!oldSettings || !newSettings) {
        return oldSettings !== newSettings;
    }

    for (const [propertyPath, shouldCheck] of Object.entries(fullReloadOptions)) {
        if (shouldCheck) {
            const oldValue = extractNestedProperty(oldSettings, propertyPath);
            const newValue = extractNestedProperty(newSettings, propertyPath);

            if (hasValueChanged(oldValue, newValue)) {
                return true;
            }
        }
    }

    return false;
}

interface DevOptions {
    port?: number
}

let RELOADING = false

export async function dev(options?: DevOptions) {
    const spinner = new CLI('dots');
    spinner.startSpinner('Preparing local xyd instance...');

    const skip = await preWorkspaceSetup()

    let onUpdateCallback: (settings: Settings) => void = () => { }

    const inited = await appInit({
        onUpdate: (callback) => {
            // Store the callback to be called later with settings
            onUpdateCallback = callback
        }
    })
    if (!inited) {
        return
    }
    const { respPluginDocs, resolvedPlugins } = inited

    // TODO: allow only for cwd + .xyd folder
    const allowCwd = searchForWorkspaceRoot(process.cwd())
    const watchAllow = process.cwd()

    const appRoot = getAppRoot()
    const commonRunVitePlugins = await commonVitePlugins(respPluginDocs, resolvedPlugins)
    spinner.stopSpinner();

    if (!skip) {
        await postWorkspaceSetup(respPluginDocs.settings)

        const newChecksum = calculateFolderChecksum(getHostPath());
        storeChecksum(newChecksum);
    }
    const postInstallVitePlugins = commonPostInstallVitePlugins(respPluginDocs, resolvedPlugins)

    // ⚠️  
    spinner.log('✔ Local xyd instance is ready');
    spinner.log('🔄 Starting server...');

    let server: ViteDevServer | null = null

    const port = options?.port ?? parseInt(process.env.XYD_PORT ?? "5175")

    // Store initial settings for comparison
    let initialSettings = respPluginDocs.settings || {};

    let USE_CONTEXT_ISSUE_PACKAGES: string[] = []
    {
        // TODO: !!! IN THE FUTURE BETTER SOLUTION !!!
        if (process.env.XYD_DEV_MODE) {
            USE_CONTEXT_ISSUE_PACKAGES = [
                "react-github-btn",
                "radix-ui",
                "@code-hike/lighter",
                "lucide-react",
                "openux-js",
                "pluganalytics",
                "@orama/orama",
                "@orama/react-components",
                // TODO: optimize plugin deps only if loaded 
                // "@pluganalytics/provider-livesession"
            ];
        } else {
            USE_CONTEXT_ISSUE_PACKAGES = [
                "@xyd-js/theme-cosmo",
                "@xyd-js/theme-gusto",
                "@xyd-js/theme-opener",
                "@xyd-js/theme-picasso",
                "@xyd-js/theme-poetry",
                "@xyd-js/theme-solar",
                // TODO: optimize plugin deps only if loaded 
                // "@pluganalytics/provider-livesession"
            ]
        }
    }

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
            },
            // preserveSymlinks: true
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
            include: [
                "react/jsx-runtime",
                ...USE_CONTEXT_ISSUE_PACKAGES,
            ],
            // exclude: ["react", "react-dom"]
        },
        plugins: [
            ...commonRunVitePlugins,
            ...postInstallVitePlugins,
            {
                name: 'xyd-configureServer',
                configureServer(s) {
                    server = s
                }
            }
        ],
    });


    // Set up manual file watcher for markdown files TODO: better way? + HMR only for specific components instead or reload a pag
    const watcher = fs.watch(watchAllow, { recursive: true }, async (eventType, filename) => {
        // console.log("WATCHER CHANGED", RELOADING)
        if (RELOADING) {
            return
        }

        if (!filename) {
            console.log("[xyd:dev-watcher] Received empty filename");
            return;
        }

        if (!server) {
            console.log("[xyd:dev-watcher] Server not ready");
            return
        }

        const filePath = path.join(watchAllow, filename);
        if (filePath.includes(CACHE_FOLDER_PATH)) {
            return
        }

        let apiPaths: { [path: string]: boolean } = {}
        if (respPluginDocs?.settings?.api) {
            apiPaths = resolveApiFilePaths(process.cwd(), respPluginDocs.settings.api)
        }

        let iconPaths: { [path: string]: boolean } = {}
        if (respPluginDocs?.settings) {
            iconPaths = resolveIconFilePaths(process.cwd(), respPluginDocs.settings)
        }

        let syntaxHighlightPaths: { [path: string]: boolean } = {}
        if (respPluginDocs?.settings) {
            syntaxHighlightPaths = resolveSyntaxHighlightFilePaths(process.cwd(), respPluginDocs.settings)
        }

        const apiChanged = !!apiPaths[filePath]
        const iconChanged = !!iconPaths[filePath]
        const syntaxHighlightChanged = !!syntaxHighlightPaths[filePath]

        const isSettingsFile = SUPPORTED_SETTINGS_FILES.some(ext => filePath.endsWith(ext))
        const isContentFile = SUPPORTED_CONTENT_FILES.some(ext => filePath.endsWith(ext))
        const isPublicPathReload = filePath.includes(getPublicPath())
        const isEnvFile = isEnvFilePath(filePath)
        const isWatchFile = isSettingsFile ||
            isContentFile ||
            apiChanged ||
            iconChanged ||
            syntaxHighlightChanged ||
            isPublicPathReload ||
            isEnvFile

        if (!isWatchFile) {
            return
        }

        const renameContentFile = isContentFile && eventType === 'rename'

        if (isContentFile && !renameContentFile) {
            console.log('🔄 Content file changed, refresh...');

            // invalidateSettingsOnly(server) // if invalidate settings will be needed then + with composer? cuz issues with this

            invalidateSettings(server)
            await touchLayoutPage()
            // await touchRootPage()

            // server.ws.send({ type: 'full-reload' });
            // invalidateSettings(server)  // TODO: check if needed but some issues with this

            // setTimeout(() => {
            //     server && invalidateSettings(server)
            // }, 1000)
            // await touchPage()

            console.log('✔ xyd content file changed\n');

            return
        }

        const isReloadFile = isSettingsFile ||
            renameContentFile ||
            isPublicPathReload ||
            iconChanged ||
            apiChanged ||
            syntaxHighlightChanged ||
            isEnvFile

        if (isReloadFile) {
            if (renameContentFile) {
                console.log('🔄 Content file renamed, refresh...');
            } else if (isPublicPathReload) {
                console.log('🔄 Public path changed, refresh...');
            } else if (iconChanged) {
                console.log('🔄 Icon file changed, refresh...');
                invalidateIconSet(server)
            } else if (syntaxHighlightChanged) {
                console.log('🔄 Syntax highlight theme file changed, refresh...');
            } else if (apiChanged) {
                console.log('🔄 API file changed, refresh...');
            } else if (syntaxHighlightChanged) {
                console.log('🔄 Syntax highlight theme file changed, refresh...');
            } else if (isEnvFile) {
                console.log('🔄 Environment file changed, refresh...');
                // Environment variables affect settings processing, so we need a full reload
                await reloadServer(watcher, preview, options);
                return;
            } else {
                console.log('🔄 Settings file changed, refresh...');
            }

            let newSettings: Settings | null = null
            // TODO: better way to handle that - we need this cuz otherwise its inifiite reloads
            if (respPluginDocs?.settings.engine?.uniform?.store) {
                const resp = await appInit({
                    disableFSWrite: true,
                    doNotInstallPluginDependencies: true
                })

                const respSettings = resp?.respPluginDocs?.settings
                if (respSettings) {
                    newSettings = respSettings
                }
            } else {
                const resp = await appInit({
                    doNotInstallPluginDependencies: true
                }) // TODO: !!! IN THE FUTURE MORE EFFICIENT WAY !!!

                const respSettings = resp?.respPluginDocs?.settings
                if (respSettings) {
                    newSettings = respSettings
                }
            }
            if (!newSettings) {
                console.log("[xyd:dev-watcher] Settings is not an object or is null");
                return
            }

            {
                const needsFullReload = hasFullReloadPropertiesChanged(initialSettings, newSettings);

                if (needsFullReload) {
                    console.log('🔄 Full reload properties changed, restarting server...');
                    await reloadServer(watcher, preview, options);
                    return;
                }
            }

            {
                invalidateSettings(server)
                onUpdateCallback(newSettings)
                await touchReactRouterConfig()
                await touchRootPage()
                await touchLayoutPage()
                // await touchPage()
                server.ws.send({ type: 'full-reload' });
                // TODO: in the future better solution
            }

            // Re-read settings to get the updated values
            // const newSettings = await readSettings();
            // if (typeof newSettings !== 'object' || newSettings === null) {
            //     console.log("[xyd:dev-watcher] Settings is not an object or is null");
            //     return
            // }

            // Check if any full reload properties have changed
            // const needsFullReload = hasFullReloadPropertiesChanged(initialSettings, newSettings);

            // if (needsFullReload) {
            //     console.log('🔄 Full reload properties changed, restarting server...');
            //     RELOADING = true;

            //     // Close the current server
            //     watcher.close();
            //     await preview.close();
            //     RELOADING = false;

            //     // Restart the dev server
            //     await dev(options);
            //     return;
            // }

            // Update the initial settings for next comparison
            // initialSettings = newSettings;

            // invalidateSettings(server)
            // await touchReactRouterConfig()
            // await touchLayoutPage()
            // await touchRootPage()

            // // Send full reload to ensure all components update
            // server.ws.send({ type: 'full-reload' });
        }
    });

    // Log any watcher errors
    watcher.on('error', (error) => {
        console.error("[xyd:dev] File watcher error:", error);
    });

    await preview.listen(port);
    await optimizeDepsFix(port, respPluginDocs.settings.navigation)

    preview.printUrls();
    preview.bindCLIShortcuts({ print: true });

    // Clean up watcher when server is closed
    preview.httpServer?.once('close', () => {
        watcher.close();
    });
}

async function reloadServer(
    watcher: fs.FSWatcher,
    preview: ViteDevServer,
    options?: DevOptions
) {
    RELOADING = true;
    watcher.close();
    await preview.close();
    RELOADING = false;
    await dev(options);
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
 * @todo: !!! in the future it should be created at different level !!!
 * 
 * Walks theme.icons.library, 
 * resolves all referenced local files under `basePath`,
 * and returns a set of absolute paths.
 */
export function resolveIconFilePaths(
    basePath: string,
    settings: any
): Record<string, true> {
    const result: Record<string, true> = {}

    const icons = settings?.theme?.icons?.library
    if (!icons) {
        return result
    }

    // Helper function to check if a path is a local file path
    const isLocalPath = (path: string): boolean => {
        // Must start with ./ or / to be a local file path
        return path.startsWith('./') || path.startsWith('/')
    }

    // Handle single icon library
    if (typeof icons === 'string') {
        if (isLocalPath(icons)) {
            const iconAbsPath = path.resolve(basePath, icons)
            result[iconAbsPath] = true
        }
        return result
    }

    // Handle array of icon libraries
    if (Array.isArray(icons)) {
        icons.forEach(library => {
            if (typeof library === 'string') {
                if (isLocalPath(library)) {
                    const iconAbsPath = path.resolve(basePath, library)
                    result[iconAbsPath] = true
                }
            } else if (typeof library === 'object' && library.name) {
                if (isLocalPath(library.name)) {
                    const iconAbsPath = path.resolve(basePath, library.name)
                    result[iconAbsPath] = true
                }
            }
        })
    } else if (typeof icons === 'object' && icons.name) {
        // Handle single icon library object
        if (isLocalPath(icons.name)) {
            const iconAbsPath = path.resolve(basePath, icons.name)
            result[iconAbsPath] = true
        }
    }

    return result
}

/**
 * @todo: !!! in the future it should be created at different level !!!
 * 
 * Walks theme.coder.syntaxHighlight, 
 * resolves all referenced local files under `basePath`,
 * and returns a set of absolute paths.
 */
export function resolveSyntaxHighlightFilePaths(
    basePath: string,
    settings: any
): Record<string, true> {
    const result: Record<string, true> = {}

    const syntaxHighlight = settings?.theme?.coder?.syntaxHighlight
    if (!syntaxHighlight) {
        return result
    }

    // Helper function to check if a path is a local file path
    const isLocalPath = (path: string): boolean => {
        // Must start with ./ or / to be a local file path
        return path.startsWith('./') || path.startsWith('/')
    }

    // Handle single syntax highlight theme
    if (typeof syntaxHighlight === 'string') {
        if (isLocalPath(syntaxHighlight)) {
            const syntaxHighlightAbsPath = path.resolve(basePath, syntaxHighlight)
            result[syntaxHighlightAbsPath] = true
        }
        return result
    }

    // Handle array of syntax highlight themes
    if (Array.isArray(syntaxHighlight)) {
        syntaxHighlight.forEach(theme => {
            if (typeof theme === 'string') {
                if (isLocalPath(theme)) {
                    const syntaxHighlightAbsPath = path.resolve(basePath, theme)
                    result[syntaxHighlightAbsPath] = true
                }
            } else if (typeof theme === 'object' && theme.name) {
                if (isLocalPath(theme.name)) {
                    const syntaxHighlightAbsPath = path.resolve(basePath, theme.name)
                    result[syntaxHighlightAbsPath] = true
                }
            }
        })
    } else if (typeof syntaxHighlight === 'object' && syntaxHighlight.name) {
        // Handle single syntax highlight theme object
        if (isLocalPath(syntaxHighlight.name)) {
            const syntaxHighlightAbsPath = path.resolve(basePath, syntaxHighlight.name)
            result[syntaxHighlightAbsPath] = true
        }
    }

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

/**
 * Checks if a file path is an environment file
 */
function isEnvFilePath(filePath: string): boolean {
    return filePath.endsWith('.env') ||
        filePath.endsWith('.env.local') ||
        filePath.endsWith('.env.development') ||
        filePath.endsWith('.env.production');
}

/**
 * Extracts the first page from navigation settings
 */
function getFirstPageFromNavigation(navigation: Navigation): string | null {
    if (!navigation?.sidebar?.length) {
        return null;
    }

    function extractFirstPage(pages: SidebarNavigation): string | null {
        for (const page of pages) {
            if (typeof page === 'string') {
                return normalizePagePath(page);
            }

            if (typeof page === 'object') {
                // Handle SidebarRoute
                if ('route' in page && page.pages) {
                    const firstPage = extractFirstPage(page.pages);
                    if (firstPage) return firstPage;
                }

                // Handle Sidebar with pages
                if ('pages' in page && page.pages) {
                    const firstPage = extractFirstPage(page.pages as SidebarNavigation);
                    if (firstPage) return firstPage;
                }

                // Handle VirtualPage
                if ('page' in page && typeof page.page === 'string') {
                    return normalizePagePath(page.page);
                }
            }
        }
        return null;
    }

    return extractFirstPage(navigation.sidebar || []);
}

/**
 * Normalizes a page path by removing .md/.mdx extensions and handling index pages
 */
function normalizePagePath(pagePath: string): string {
    // Remove .md or .mdx extension if present
    let normalized = pagePath.replace(/\.(md|mdx)$/, '');

    // If the path ends with 'index', remove it to get the directory
    if (normalized.endsWith('/index') || normalized === 'index') {
        normalized = normalized.replace(/\/?index$/, '');
    }

    // Ensure it doesn't start with a slash for consistency
    if (normalized.startsWith('/')) {
        normalized = normalized.slice(1);
    }

    return normalized;
}

/**
 * Fetches the first page to preload it
 */
async function fetchFirstPage(firstPage: string, port: number) {
    const urlsToTry = [
        `http://localhost:${port}/${firstPage}`,
        `http://localhost:${port}/${firstPage}/`,
        `http://localhost:${port}/${firstPage}.html`,
        `http://localhost:${port}/${firstPage}/index.html`
    ];

    for (const url of urlsToTry) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return; // Success, exit early
            }
        } catch (error) {
            // Continue to next URL if this one fails
            continue;
        }
    }
}

function invalidateSettings(server: ViteDevServer) {
    const resolvedId = invalidateSettingsOnly(server)

    server.ws.send({
        type: 'update',
        updates: [
            {
                type: 'js-update',
                path: `/@id/${resolvedId}`,
                acceptedPath: `/@id/${resolvedId}`,
                timestamp: Date.now(),
            },
        ],
    });
    console.debug('✅ [xyd:dev-watcher] Settings module invalidated and HMR update sent');
}

function invalidateSettingsOnly(server: ViteDevServer) {
    const virtualId = 'virtual:xyd-settings';
    const resolvedId = virtualId + '.jsx';
    const mod = server.moduleGraph.getModuleById(resolvedId);
    if (!mod) {
        console.log("[xyd:dev-watcher] Settings module not found");
        return
    }

    // console.debug('🔄 [xyd:dev-watcher] Invalidating settings module...');
    server.moduleGraph.invalidateModule(mod);

    return resolvedId
}

function invalidateIconSet(server: ViteDevServer) {
    const virtualId = 'virtual:xyd-icon-set';
    const mod = server.moduleGraph.getModuleById(virtualId);

    // console.log("[xyd:dev-watcher] Looking for icon set module:", virtualId);
    // console.log("[xyd:dev-watcher] Module found:", !!mod);

    if (!mod) {
        console.log("[xyd:dev-watcher] Icon set module not found");
        return
    }

    console.debug('🔄 [xyd:dev-watcher] Invalidating icon set module...');
    server.moduleGraph.invalidateModule(mod);
    server.ws.send({
        type: 'update',
        updates: [
            {
                type: 'js-update',
                path: `/@id/${virtualId}`,
                acceptedPath: `/@id/${virtualId}`,
                timestamp: Date.now(),
            },
        ],
    });
    console.debug('✅ [xyd:dev-watcher] Icon set module invalidated and HMR update sent');
}

async function touchReactRouterConfig() {
    const hostPath = getHostPath()
    const hostReactRouterConfig = path.join(hostPath, "react-router.config.ts")
    await fs.promises.utimes(hostReactRouterConfig, new Date(), new Date());
}

async function touchLayoutPage() {
    const docsPluginBasePath = getDocsPluginBasePath()
    const layoutPath = path.join(docsPluginBasePath, "./src/pages/layout.tsx")
    await fs.promises.utimes(layoutPath, new Date(), new Date());
}

async function touchPage() {
    const docsPluginBasePath = getDocsPluginBasePath()
    const pagePath = path.join(docsPluginBasePath, "./src/pages/page.tsx")
    await fs.promises.utimes(pagePath, new Date(), new Date());
}

async function touchRootPage() {
    const hostPath = getHostPath()
    const hostReactRouterConfig = path.join(hostPath, "./app/root.tsx")
    await fs.promises.utimes(hostReactRouterConfig, new Date(), new Date());
}

async function experimentalInvalidateAndTouchPages(server: ViteDevServer) {
    const docsPluginBasePath = getDocsPluginBasePath()

    const layoutPath = path.join(docsPluginBasePath, "./src/pages/layout.tsx")
    const layoutModule = server.moduleGraph.getModuleById(layoutPath);

    const pagePath = path.join(docsPluginBasePath, "./src/pages/page.tsx")
    const pageModule = server.moduleGraph.getModuleById(pagePath);

    const pageModules = layoutModule && pageModule
    if (!pageModules) {
        console.log("[xyd:dev-watcher] Pages modules not found");
        return
    }

    server.moduleGraph.invalidateModule(layoutModule);
    server.moduleGraph.invalidateModule(pageModule);

    await fs.promises.utimes(layoutPath, new Date(), new Date());
    await fs.promises.utimes(pagePath, new Date(), new Date());
}

// TODO: finish
async function experimentalInvalidateVite(server: ViteDevServer) {
    // Get all modules from the module graph and invalidate them
    const allModules = Array.from(server.moduleGraph.urlToModuleMap.values());
    let invalidatedCount = 0;

    for (const module of allModules) {
        if (module) {
            server.moduleGraph.invalidateModule(module);
            invalidatedCount++;
        }
    }

    // Also invalidate the host router config
    try {
        const hostPath = getHostPath()
        const hostReactRouterConfig = path.join(hostPath, "react-router.config.ts")
        await fs.promises.utimes(hostReactRouterConfig, new Date(), new Date());
    } catch (e) {
        console.error(e)
    }

    server.ws.send({ type: 'full-reload' });
    return;
}

// TODO: !!! IN THE FUTURE BETTER SOLUTION !!!
async function optimizeDepsFix(port: number, navigation?: Navigation) {
    // TODO: ITS A WORKAROUND FOR NOW, IN THE FUTURE WE NEED TO DO IT BETTER 
    // ITS FOR OPTIMZE DEPS FIX
    // find first page from respPluginDocs.settings navigation and do fetch for it 
    let firstPage: null | string = ""
    if (navigation) {
        firstPage = getFirstPageFromNavigation(navigation);
    }
    await fetchFirstPage(firstPage || "", port);
}
