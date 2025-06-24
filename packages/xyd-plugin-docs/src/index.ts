import {Navigation, Settings} from "@xyd-js/core";
import type {Plugin as VitePlugin} from "vite";
import {RouteConfigEntry} from "@react-router/dev/routes";
import type {PageURL, Sidebar, SidebarRoute} from "@xyd-js/core";
import fs from "fs";
import path from "path";

import {docsPreset} from "./presets/docs";
import {graphqlPreset} from "./presets/graphql";
import {openapiPreset} from "./presets/openapi";
import {sourcesPreset} from "./presets/sources";

import type {PluginOutput, Plugin} from "./types";
import {ensureAndCleanupVirtualFolder} from "./presets/uniform";

export {readSettings} from "./presets/docs/settings"

export interface PluginDocsOptions {
    disableAPIGeneration?: boolean
    disableFSWrite?: boolean
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
        const options = {
            urlPrefix: "" // TODO: configurable
        }

        const docs = docsPreset(undefined, options)
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
    
    return {
        vitePlugins,
        settings,
        routes,
        basePath,
        pagePathMapping
    }
}

function sortSidebarGroups(sidebar: (SidebarRoute | Sidebar | string)[]) {
    // Sort items within each SidebarRoute
    for (const group of sidebar) {
        if (typeof group === 'string') {
            continue // Skip string entries
        }
        if ('pages' in group && Array.isArray(group.pages)) {
            group.pages.sort((a, b) => {
                // If both have numeric sort values, compare them
                if (typeof a.sort === 'number' && typeof b.sort === 'number') {
                    return a.sort - b.sort
                }
                // If only a has numeric sort, it comes first
                if (typeof a.sort === 'number') {
                    return -1
                }
                // If only b has numeric sort, it comes first
                if (typeof b.sort === 'number') {
                    return 1
                }
                // If neither has numeric sort, maintain original order
                return 0
            })
        }
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
    for (const sidebar of navigation.sidebar) {
        if (typeof sidebar === 'string') {
            sidebarFlatOnly = true
            break
        } else if ('pages' in sidebar && "route" in sidebar) {
            // Handle SidebarRoute
            for (const item of sidebar.pages) {
                if (item?.pages) {
                    processPages(item.pages)
                }
            }
        } else if ('pages' in sidebar) {
            // Handle Sidebar
            processPages(sidebar.pages || [])
        }
    }

    if (sidebarFlatOnly) {
        const sidebar = navigation.sidebar as string[]
        processPages(sidebar)
    }

    return mapping
}

export type {
    Plugin,
    PluginOutput
}
