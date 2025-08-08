import { Navigation, Settings } from "@xyd-js/core";
import type { Plugin as VitePlugin } from "vite";
import { RouteConfigEntry } from "@react-router/dev/routes";
import type { PageURL, Sidebar, SidebarRoute } from "@xyd-js/core";
import fs from "fs";
import path from "path";

import { docsPreset } from "./presets/docs";
import { graphqlPreset } from "./presets/graphql";
import { openapiPreset } from "./presets/openapi";
import { sourcesPreset } from "./presets/sources";

import type { PluginOutput, Plugin } from "./types";
import { ensureAndCleanupVirtualFolder } from "./presets/uniform";

export { readSettings } from "./presets/docs/settings"

export interface PluginDocsOptions {
    disableAPIGeneration?: boolean
    disableFSWrite?: boolean
    appInit?: any
    onUpdate?: (callback: (settings: Settings) => void) => void
    doNotInstallPluginDependencies?: boolean
}

// TODO: better plugin runner
// TODO: REFACTOR
export async function pluginDocs(options?: PluginDocsOptions): Promise<PluginOutput | null> {
    let settings: Settings | null = null
    const vitePlugins: VitePlugin[] = []
    const routes: RouteConfigEntry[] = []
    let basePath = ""

    // base docs preset setup
    {
        const presetOptions = {
            urlPrefix: "", // TODO: configurable,
            appInit: options?.appInit,
            onUpdate: options?.onUpdate
        }

        const docs = docsPreset(undefined, presetOptions)
        docs.preinstall = docs.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of docs.preinstall) {
            const resp = await preinstall()({}, {
                routes: docs.routes
            })

            if (resp && typeof resp === 'object') {
                preinstallMerge = {
                    ...preinstallMerge,
                    ...resp
                }
            }
        }

        docs.vitePlugins = docs.vitePlugins || []
        for (const vitePlugin of docs.vitePlugins) {
            const vitePlug = await vitePlugin()({
                preinstall: preinstallMerge
            })

            vitePlugins.push(vitePlug)
        }

        if ("settings" in preinstallMerge) {
            settings = preinstallMerge.settings as Settings
        }

        docs.routes = docs.routes || []
        routes.push(...docs.routes)
        basePath = docs.basePath
    }

    if (!settings) {
        return null
    }

    await ensureAndCleanupVirtualFolder()

    // graphql preset setup
    if (!options?.disableAPIGeneration && settings?.api?.graphql) {
        const opt = {
            disableFSWrite: options?.disableFSWrite
        }

        const gql = graphqlPreset(settings, opt)
        gql.preinstall = gql.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of gql.preinstall) {
            const resp = await preinstall(opt)(settings, {
                routes: gql.routes,
            })

            if (resp && typeof resp === 'object') {
                preinstallMerge = {
                    ...preinstallMerge,
                    ...resp
                }
            }
        }

        gql.vitePlugins = gql.vitePlugins || []
        for (const vitePlugin of gql.vitePlugins) {
            const vitePlug = await vitePlugin()({
                preinstall: preinstallMerge
            })

            vitePlugins.push(vitePlug)
        }

        gql.routes = gql.routes || []
        routes.push(...gql.routes)
    }

    // openapi preset setup
    if (!options?.disableAPIGeneration && settings?.api?.openapi) {
        const opt = {
            disableFSWrite: options?.disableFSWrite
        }

        const oap = openapiPreset(settings, opt)
        oap.preinstall = oap.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of oap.preinstall) {
            const resp = await preinstall(opt)(settings, {
                routes: oap.routes,
            })

            if (resp && typeof resp === 'object') {
                preinstallMerge = {
                    ...preinstallMerge,
                    ...resp
                }
            }
        }

        oap.vitePlugins = oap.vitePlugins || []
        for (const vitePlugin of oap.vitePlugins) {
            const vitePlug = await vitePlugin()({
                preinstall: preinstallMerge
            })

            vitePlugins.push(vitePlug)
        }

        oap.routes = oap.routes || []
        routes.push(...oap.routes)
    }

    if (!options?.disableAPIGeneration && settings?.api?.sources) {
        const opt = {
            disableFSWrite: options?.disableFSWrite
        }

        const src = sourcesPreset(settings, opt)
        src.preinstall = src.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of src.preinstall) {
            const resp = await preinstall(opt)(settings, {
                routes: src.routes,
            })

            if (resp && typeof resp === 'object') {
                preinstallMerge = {
                    ...preinstallMerge,
                    ...resp
                }
            }
        }

        src.vitePlugins = src.vitePlugins || []
        for (const vitePlugin of src.vitePlugins) {
            const vitePlug = await vitePlugin()({
                preinstall: preinstallMerge
            })

            vitePlugins.push(vitePlug)
        }

        src.routes = src.routes || []
        routes.push(...src.routes)
    }

    let pagePathMapping: Record<string, string> = {}

    if (settings?.navigation) {
        pagePathMapping = mapNavigationToPagePathMapping(settings?.navigation)
    } else {
        console.warn("No navigation found in settings")
    }

    sortSidebarGroups(settings?.navigation?.sidebar || [])

    const indexPage = await findIndexPage()

    if (indexPage) {
        pagePathMapping["index"] = indexPage
    }

    return {
        vitePlugins,
        settings,
        routes,
        basePath,
        pagePathMapping,
        hasIndexPage: !!indexPage
    }
}

async function findIndexPage(): Promise<string> {
    if (fs.existsSync("index.md")) {
        return "index.md"
    }

    if (fs.existsSync("index.mdx")) {
        return "index.mdx"
    }

    return ""
}

export function sortSidebarGroups(sidebar: (SidebarRoute | Sidebar | string)[]) {
    // Apply recursive sorting to all routes
    for (const entry of sidebar) {
        if (typeof entry === 'string') continue;
        if (!entry.pages) continue;

        // First: Merge user-defined config into generated pages
        const pages = entry.pages;
        const groupMap = new Map<string, Sidebar>();

        for (const page of pages) {
            if (typeof page === 'object' && 'group' in page && page.group) {
                groupMap.set(page.group, page);
            }
        }

        // Rebuild sorted list
        const sortedGroups: Sidebar[] = [];

        // First pass: order: 0 (always on top)
        for (const [_, group] of groupMap) {
            if (group.order === 0) sortedGroups.push(group);
        }

        // Second pass: groups without "before/after"
        for (const [name, group] of groupMap) {
            if (!group.order || typeof group.order === 'number') {
                if (group.order !== 0 && group.order !== -1) {
                    sortedGroups.push(group);
                }
            }
        }

        // Third pass: before/after
        for (const [name, group] of groupMap) {
            if (group.order && typeof group.order === 'object' && ('before' in group.order || 'after' in group.order)) {
                const target = 'before' in group.order ? group.order.before : group.order.after;
                const idx = sortedGroups.findIndex(g => g.group === target);
                if (idx !== -1) {
                    if ('before' in group.order) {
                        sortedGroups.splice(idx, 0, group);
                    } else {
                        sortedGroups.splice(idx + 1, 0, group);
                    }
                } else {
                    sortedGroups.push(group); // fallback
                }
            }
        }

        // Last: order: -1 (always at end)
        for (const [_, group] of groupMap) {
            if (group.order === -1) sortedGroups.push(group);
        }

        // Replace groups in pages
        const final: (Sidebar | string)[] = [];
        for (const group of sortedGroups) {
            final.push(group);
        }
        entry.pages = final;
    }
}

// TODO: in the future better algorithm - we should be .md/.mdx faster than checking fs here
function mapNavigationToPagePathMapping(navigation: Navigation) {
    const mapping: Record<string, string> = {}

    function getExistingFilePath(basePath: string): string | null {
        const mdPath = `${basePath}.md`
        const mdxPath = `${basePath}.mdx`

        if (fs.existsSync(mdPath)) {
            return mdPath
        }
        if (fs.existsSync(mdxPath)) {
            return mdxPath
        }
        return null
    }

    function processPages(pages: PageURL[]) {
        for (const page of pages) {
            if (typeof page === 'string') {
                // Handle regular page
                const existingPath = getExistingFilePath(page)
                if (existingPath) {
                    mapping[page] = existingPath
                }
            } else if (typeof page === 'object' && 'virtual' in page) {
                // Handle virtual page
                const virtualPath = page.virtual
                const pagePath = page.page
                const existingPath = getExistingFilePath(virtualPath)
                if (existingPath) {
                    mapping[pagePath] = existingPath
                }
            } else if (typeof page === 'object' && 'pages' in page) {
                // Handle nested sidebar
                processPages(page.pages || [])
            }
        }
    }

    let sidebarFlatOnly = false
    // Process each sidebar route
    for (const sidebar of navigation?.sidebar || []) {
        if (typeof sidebar === 'string') {
            sidebarFlatOnly = true
            break
        } else if ('pages' in sidebar && "route" in sidebar) {
            // Handle SidebarRoute
            for (const item of sidebar.pages) {
                if (item?.pages) {
                    processPages(item.pages)
                } else if (typeof item === 'string') {
                    // Handle direct string pages in SidebarRoute
                    const existingPath = getExistingFilePath(item)
                    if (existingPath) {
                        mapping[item] = existingPath
                    }
                }
            }
        } else if ('pages' in sidebar) {
            // Handle Sidebar
            processPages(sidebar.pages || [])
        }
    }

    if (sidebarFlatOnly) {
        const sidebar = navigation?.sidebar as string[] || []
        processPages(sidebar)
    }

    return mapping
}

export type {
    Plugin,
    PluginOutput
}
