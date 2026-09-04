import { Navigation, Settings, LanguageNavigation, TranslationCatalog, asTocEnabled } from "@xyd-js/core";
import type { Plugin as VitePlugin } from "vite";
import { RouteConfigEntry } from "@react-router/dev/routes";
import type { PageURL, Sidebar, SidebarRoute } from "@xyd-js/core";
import fs from "fs";
import path from "path";

// i18n derived state — populated by pluginDocs() when navigation.languages[]
// is configured. Read by routing, sitemap, prehydration, search, llms.txt.
export interface I18nDerived {
    defaultLocale: string;
    locales: string[];
    byLocale: Record<string, LanguageNavigation>;
    detectLanguage: boolean;
}

declare global {
    var __xydI18n: I18nDerived | undefined;
    var __xydI18nTranslations: Record<string, TranslationCatalog> | undefined;
}

export function deriveI18n(settings: Settings): I18nDerived | undefined {
    const langs = settings?.navigation?.languages;
    if (!langs || langs.length === 0) return undefined;
    const explicit = settings.i18n?.defaultLocale;
    const flagged = langs.find(l => l.default)?.language;
    const defaultLocale = explicit ?? flagged ?? langs[0].language;
    const locales = langs.map(l => l.language);
    const byLocale: Record<string, LanguageNavigation> = {};
    for (const l of langs) byLocale[l.language] = l;
    return {
        defaultLocale,
        locales,
        byLocale,
        detectLanguage: settings.i18n?.detectLanguage ?? false
    };
}

// Catalog keys prefixed with `$` are not translation keys — they encode
// per-locale settings overrides applied to the matching language entry.
// Splits each catalog into pure translations + an overrides object (flat
// dot-key map) and MUTATES the input catalogs to remove `$`-keys.
//
// Example:
//   { "sidebar.greet": "Hi", "$components.footer.props.children": "Hi PL" }
//
// Returns:
//   { "components.footer.props.children": "Hi PL" }
//
// And the catalog becomes:
//   { "sidebar.greet": "Hi" }
export function extractCatalogOverrides(
    catalogs: Record<string, TranslationCatalog>
): Record<string, Record<string, any>> {
    const out: Record<string, Record<string, any>> = {};

    for (const locale of Object.keys(catalogs)) {
        const catalog = catalogs[locale] as Record<string, any>;
        if (!catalog || typeof catalog !== "object") continue;

        const overrides: Record<string, any> = {};
        for (const key of Object.keys(catalog)) {
            if (key.startsWith("$")) {
                overrides[key.slice(1)] = catalog[key];
                delete catalog[key];
            }
        }

        if (Object.keys(overrides).length > 0) {
            out[locale] = overrides;
        }
    }

    return out;
}

// Load per-locale translation catalogs from i18n.catalogs config (or
// auto-discover i18n/<locale>.json at the project root). Catalogs accept
// either flat dot-keys ({"footer.x.label": "..."}) or nested objects.
export function loadI18nTranslations(
    settings: Settings,
    locales: string[]
): Record<string, TranslationCatalog> {
    const catalogs: Record<string, TranslationCatalog> = {};
    const declared = settings.i18n?.catalogs;

    for (const locale of locales) {
        // Explicit declaration wins.
        if (declared && locale in declared) {
            const entry = declared[locale];
            if (typeof entry === "string") {
                const filePath = path.isAbsolute(entry)
                    ? entry
                    : path.join(process.cwd(), entry);
                if (fs.existsSync(filePath)) {
                    try {
                        catalogs[locale] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
                    } catch (e) {
                        console.warn(`[xyd:i18n] failed to parse ${filePath}: ${(e as Error).message}`);
                    }
                } else {
                    console.warn(`[xyd:i18n] translation file not found: ${filePath}`);
                }
            } else if (entry && typeof entry === "object") {
                catalogs[locale] = entry;
            }
            continue;
        }

        // Convention fallback: i18n/<locale>.json
        const conv = path.join(process.cwd(), "i18n", `${locale}.json`);
        if (fs.existsSync(conv)) {
            try {
                catalogs[locale] = JSON.parse(fs.readFileSync(conv, "utf-8"));
            } catch (e) {
                console.warn(`[xyd:i18n] failed to parse ${conv}: ${(e as Error).message}`);
            }
        }
    }

    return catalogs;
}

import { docsPreset } from "./presets/docs";
import { graphqlPreset } from "./presets/graphql";
import { openapiPreset } from "./presets/openapi";
import { sourcesPreset } from "./presets/sources";
import { mcpPreset } from "./presets/mcp";
import { cliPreset } from "./presets/cli";

import type { PluginOutput, Plugin } from "./types";
import { ensureAndCleanupVirtualFolder } from "./presets/uniform";
import { settingsNative } from "./native";
import { collectAsTocPages, mergeAsTocPages, type AsTocPages } from "./asToc";

export { readSettings } from "./presets/docs/settings"
export { setupUniformSdkEnrichment } from "./presets/uniform/sdkEnrich"
export { collectAsTocPages, mergeAsTocPages, asTocFileMap, sectionIdFor } from "./asToc"
export type { AsTocPages, AsTocHost, AsTocSection } from "./asToc"

// S6+ W6: the nav→pagepath walk (the "batched" existsSync-eliminating pass)
// runs in Rust (crates/xyd_settings) when the native core is present. The
// JS mapNavigationToPagePathMapping below stays as the fallback + fidelity
// reference. cwd is process.cwd() (the JS impl probes cwd-relative paths).
function resolvePagePathMapping(navigation: Navigation): Record<string, string> {
    if (settingsNative?.mapNavigationToPagePathMapping) {
        return JSON.parse(
            settingsNative.mapNavigationToPagePathMapping(
                JSON.stringify(navigation),
                process.cwd()
            )
        );
    }
    return mapNavigationToPagePathMapping(navigation);
}

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

    // disableFSWrite (prerender workers) reuse the content cache the main process
    // already generated — they must NOT clear it or they'd race each other (and
    // main) into ENOENT. The presets below likewise skip the file writes under this
    // flag while still building the in-memory nav/mapping.
    if (!options?.disableFSWrite) {
        await ensureAndCleanupVirtualFolder()
    }

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

    // mcp preset setup
    if (!options?.disableAPIGeneration && settings?.api?.mcp) {
        const opt = {
            disableFSWrite: options?.disableFSWrite
        }

        const mcp = mcpPreset(settings, opt)
        mcp.preinstall = mcp.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of mcp.preinstall) {
            const resp = await preinstall(opt)(settings, {
                routes: mcp.routes,
            })

            if (resp && typeof resp === 'object') {
                preinstallMerge = {
                    ...preinstallMerge,
                    ...resp
                }
            }
        }

        mcp.vitePlugins = mcp.vitePlugins || []
        for (const vitePlugin of mcp.vitePlugins) {
            const vitePlug = await vitePlugin()({
                preinstall: preinstallMerge
            })

            vitePlugins.push(vitePlug)
        }

        mcp.routes = mcp.routes || []
        routes.push(...mcp.routes)
    }

    // cli preset setup
    if (!options?.disableAPIGeneration && settings?.api?.cli) {
        const opt = {
            disableFSWrite: options?.disableFSWrite
        }

        const cli = cliPreset(settings, opt)
        cli.preinstall = cli.preinstall || []

        let preinstallMerge = {}

        for (const preinstall of cli.preinstall) {
            const resp = await preinstall(opt)(settings, {
                routes: cli.routes,
            })

            if (resp && typeof resp === 'object') {
                preinstallMerge = {
                    ...preinstallMerge,
                    ...resp
                }
            }
        }

        cli.vitePlugins = cli.vitePlugins || []
        for (const vitePlugin of cli.vitePlugins) {
            const vitePlug = await vitePlugin()({
                preinstall: preinstallMerge
            })

            vitePlugins.push(vitePlug)
        }

        cli.routes = cli.routes || []
        routes.push(...cli.routes)
    }

    let pagePathMapping: Record<string, string> = {}

    // `{ page, source }` sugar → the `{ virtual, page }` form BEFORE anything
    // walks navigation (i18n inheritance/prefixing, the JS/Rust pagemaps, the
    // client settings) — downstream only ever sees the long-supported shape.
    normalizeSourcePages(settings?.navigation)

    // Derive i18n state once. Subsequent steps (path mapping, route generation,
    // sitemap, prehydration) read from globalThis.__xydI18n.
    const i18n = deriveI18n(settings)
    globalThis.__xydI18n = i18n

    // Load translation catalogs for each declared locale. Read by the
    // resolveI18nString walker in mapSettingsToProps and by themes via the
    // useI18n() hook.
    if (i18n) {
        const loaded = loadI18nTranslations(settings, i18n.locales)
        // `$`-prefixed catalog keys are settings override paths, not
        // translation keys. Pull them out of the catalogs and merge them
        // into the matching language entry's `overrides` so applyOverrides
        // (in mapSettingsToProps) picks them up at request time.
        const catalogOverrides = extractCatalogOverrides(loaded)
        for (const lang of settings.navigation?.languages || []) {
            const fromCatalog = catalogOverrides[lang.language]
            if (!fromCatalog) continue
            lang.overrides = {
                ...(lang.overrides as any || {}),
                ...fromCatalog
            } as any
        }
        globalThis.__xydI18nTranslations = loaded
    }

    // sidebar-as-TOC data plane: which pages compose into which host page.
    // Collected alongside the pagepath walks (per locale in i18n mode) so the
    // key spaces match; empty ⇒ no asToc groups configured.
    const asTocPages: AsTocPages = { hosts: {}, pages: {} }

    if (settings?.navigation) {
        if (i18n) {
            // Catalog-only mode: when a language entry omits sidebar/tabs/etc.,
            // inherit the top-level navigation. Lets users define the structure
            // once at navigation.sidebar and only declare locales in
            // navigation.languages — translations come from i18n catalogs.
            inheritTopLevelNavigation(settings)

            // i18n mode: pre-prefix each non-default language's sidebar so
            // that page references, route strings, pagePathMapping keys,
            // and URL paths all share one key space (e.g. "pl/docs/intro").
            // Default locale stays unprefixed.
            for (const lang of settings.navigation.languages || []) {
                const isDefault = lang.language === i18n.defaultLocale
                const localePrefix = isDefault ? "" : `${lang.language}/`
                if (localePrefix) {
                    prefixSidebarPages(lang.sidebar || [], localePrefix)
                }
                const localeNav: Navigation = {
                    sidebar: lang.sidebar,
                    tabs: lang.tabs,
                    sidebarDropdown: lang.sidebarDropdown,
                    segments: lang.segments,
                    anchors: lang.anchors
                }
                const subMapping = resolvePagePathMapping(localeNav)
                Object.assign(pagePathMapping, subMapping)
                mergeAsTocPages(asTocPages, collectAsTocPages(localeNav, { hostPrefix: localePrefix }))
            }
        } else {
            pagePathMapping = resolvePagePathMapping(settings?.navigation)
            mergeAsTocPages(asTocPages, collectAsTocPages(settings?.navigation))
        }
    } else {
        console.warn("No navigation found in settings")
    }

    if (i18n) {
        for (const lang of settings.navigation?.languages || []) {
            sortSidebarGroups(lang.sidebar || [])
        }
    } else {
        sortSidebarGroups(settings?.navigation?.sidebar || [])
    }

    const indexPage = await findIndexPage()

    if (indexPage) {
        pagePathMapping["index"] = indexPage
    }

    // sidebar-as-TOC hosts: make every host slug routable. A host without its
    // own intro file maps to its first section's file — the mapping entry is
    // what drives prerender/404/sitemap; the page loaders always rebuild the
    // actual content from __xydAsTocPages.hosts[slug] (composition), so what
    // the entry points at only affects fallback metadata.
    globalThis.__xydAsTocPages = Object.keys(asTocPages.hosts).length ? asTocPages : undefined
    for (const [hostSlug, host] of Object.entries(asTocPages.hosts)) {
        if (!pagePathMapping[hostSlug]) {
            pagePathMapping[hostSlug] = host.indexFile || host.sections[0].file
        }
    }

    return {
        vitePlugins,
        settings,
        routes,
        basePath,
        pagePathMapping,
        hasIndexPage: !!indexPage || !!asTocPages.hosts["index"]
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

        // Recursively sort nested groups first
        for (const page of entry.pages) {
            if (typeof page === 'object' && 'pages' in page && page.pages) {
                sortSidebarGroups([page as Sidebar]);
            }
        }

        // Separate groups with order from other items
        const groupsWithOrder: Sidebar[] = [];
        const otherItems: (Sidebar | string)[] = [];

        for (const page of entry.pages) {
            if (typeof page === 'object' && 'group' in page && page.group && 'order' in page && page.order !== undefined) {
                groupsWithOrder.push(page as Sidebar);
            } else {
                otherItems.push(page as Sidebar | string);
            }
        }

        // Sort groups with order
        if (groupsWithOrder.length > 0) {
            const groupMap = new Map<string, Sidebar>();
            for (const group of groupsWithOrder) {
                if (group.group) {
                    groupMap.set(group.group, group);
                }
            }

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

            // Replace the original pages with sorted groups + other items
            entry.pages = [...sortedGroups, ...otherItems];
        }
    }
}

// Catalog-only mode helper: for any language entry that omits sidebar/tabs/
// sidebarDropdown/segments/anchors, copy the top-level navigation field down
// onto the entry. This lets users write the navigation structure once at
// navigation.sidebar and only declare locales in navigation.languages —
// the per-locale strings come from i18n catalogs.
//
// Deep-cloned so the per-locale prefixing in prefixSidebarPages doesn't
// mutate the shared source. Mutates `settings` in place to match the
// existing pattern used by prefixSidebarPages.
export function inheritTopLevelNavigation(settings: Settings) {
    const nav = settings?.navigation
    const langs = nav?.languages
    if (!langs?.length) return

    const FIELDS = [
        "sidebar",
        "tabs",
        "sidebarDropdown",
        "segments",
        "anchors"
    ] as const

    for (const lang of langs) {
        for (const f of FIELDS) {
            if (lang[f] === undefined && (nav as any)[f] !== undefined) {
                ;(lang as any)[f] = JSON.parse(JSON.stringify((nav as any)[f]))
            }
        }
    }
}

// Walk a language's sidebar and prepend `${language}/` to every string page
// reference, virtual page, and SidebarRoute.route. Mutates in place. Called
// once at boot for non-default locales so that downstream code (path
// mapping, route generation, sidebar rendering) all share one key space.
/**
 * Normalize `{ page, source }` sidebar entries (the user-facing sugar for a
 * page whose URL differs from its file path) into the `{ virtual, page }`
 * form the whole engine already understands — JS + Rust pagemaps, sidebar
 * rendering, docPaths, search, i18n prefixing. Mutates in place; extra props
 * (`title`, …) are preserved. Idempotent — normalized entries have no
 * `source` left. Exported for tests.
 */
export function normalizeSourcePages(navigation?: Navigation | null) {
    if (!navigation) return

    const normalizeEntry = (entry: any) => {
        if (!entry || typeof entry !== "object") return
        if (Array.isArray(entry.pages)) {
            for (const child of entry.pages) normalizeEntry(child)
            return
        }
        if (
            typeof entry.page === "string" &&
            typeof entry.source === "string" &&
            !("virtual" in entry) &&
            !("component" in entry)
        ) {
            entry.virtual = entry.source
            delete entry.source
        }
    }

    for (const item of navigation.sidebar || []) normalizeEntry(item)
    for (const lang of navigation.languages || []) {
        for (const item of lang.sidebar || []) normalizeEntry(item)
    }
}

export function prefixSidebarPages(sidebar: any[], prefix: string) {
    for (const item of sidebar) {
        if (typeof item === "string") continue // top-level handled below
        if (!item || typeof item !== "object") continue

        if ("route" in item && typeof item.route === "string") {
            const r = item.route.startsWith("/") ? item.route.slice(1) : item.route
            item.route = `/${prefix}${r}`
        }

        if (Array.isArray(item.pages)) {
            for (let i = 0; i < item.pages.length; i++) {
                const p = item.pages[i]
                if (typeof p === "string") {
                    item.pages[i] = `${prefix}${p}`
                } else if (p && typeof p === "object") {
                    if ("virtual" in p && p.virtual) {
                        p.virtual = `${prefix}${p.virtual}`
                        if (p.page) p.page = `${prefix}${p.page}`
                    } else if ("pages" in p) {
                        prefixSidebarPages([p], prefix) // nested Sidebar/SidebarRoute
                    }
                }
            }
        }
    }
    // Top-level flat strings (rare): handled by the top-level forEach in
    // `mapNavigationToPagePathMapping` already; do it here too for safety.
    for (let i = 0; i < sidebar.length; i++) {
        if (typeof sidebar[i] === "string") sidebar[i] = `${prefix}${sidebar[i]}`
    }
}

// TODO: in the future better algorithm - we should be .md/.mdx faster than checking fs here
// `cwd` scopes the file probes (defaults to process.cwd(), matching the Rust
// port's explicit cwd argument); mapping VALUES stay cwd-relative either way.
export function mapNavigationToPagePathMapping(navigation: Navigation, cwd?: string) {
    const mapping: Record<string, string> = {}

    function getExistingFilePath(basePath: string): string | null {
        const mdPath = `${basePath}.md`
        const mdxPath = `${basePath}.mdx`

        if (fs.existsSync(cwd ? path.join(cwd, mdPath) : mdPath)) {
            return mdPath
        }
        if (fs.existsSync(cwd ? path.join(cwd, mdxPath) : mdxPath)) {
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
                // asToc group: its pages are TOC sections of the host page,
                // not routable pages — skip the whole subtree (collected
                // separately by collectAsTocPages).
                if (asTocEnabled((page as Sidebar).asToc)) continue
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
            // Handle SidebarRoute — items are regular pages: strings, groups
            // (asToc-gated inside processPages), and virtual/source leaves
            // (URL ≠ file path) directly under the route.
            processPages(sidebar.pages as PageURL[])
        } else if ('pages' in sidebar) {
            // Handle Sidebar (top-level asToc group — sections, not pages)
            if (asTocEnabled((sidebar as Sidebar).asToc)) continue
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
