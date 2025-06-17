import path from "path";
import {promises as fs} from "fs";
import {fileURLToPath} from "node:url";

import matterStringify from "gray-matter/lib/stringify";
import {Plugin as VitePlugin} from "vite"
import {route} from "@react-router/dev/routes";

import {
    Settings,
    APIFile,
    Sidebar,
    SidebarRoute,
    Metadata
} from "@xyd-js/core";
import uniform, {
    pluginNavigation,
    Reference,
    ReferenceType,
    OpenAPIReferenceContext,
    GraphQLReferenceContext
} from "@xyd-js/uniform";
import {uniformPluginXDocsSidebar} from "@xyd-js/openapi";

import {Preset, PresetData} from "../../types";

import {createRequire} from 'module';
import {VIRTUAL_CONTENT_FOLDER} from "../../const";
import {getHostPath} from "../../utils";

const require = createRequire(import.meta.url);
const matter = require('gray-matter'); // TODO: !!! BETTER SOLUTION !!!

export async function ensureAndCleanupVirtualFolder() {
    try {
        // Create directory recursively if it doesn't exist
        await fs.mkdir(VIRTUAL_CONTENT_FOLDER, {recursive: true});

        // Read all files and directories in the folder
        const entries = await fs.readdir(VIRTUAL_CONTENT_FOLDER, {withFileTypes: true});

        // Delete each entry recursively
        for (const entry of entries) {
            const fullPath = path.join(VIRTUAL_CONTENT_FOLDER, entry.name);
            if (entry.isDirectory()) {
                await fs.rm(fullPath, {recursive: true, force: true});
            } else {
                await fs.unlink(fullPath);
            }
        }
    } catch (error) {
        console.error('Error managing virtual folder:', error);
    }
}

// TODO: !!!!! REFACTOR PLUGIN-ZERO AND ITS DEPS FOR MORE READABLE CODE AND BETTER API !!!!

export interface uniformPresetOptions {
    urlPrefix?: string
    sourceTheme?: boolean
    disableFSWrite?: boolean
}

function flatPages(
    sidebar: (SidebarRoute | Sidebar)[],
    groups: { [key: string]: string },
    resp: string[] = [],
) {
    sidebar.map(async side => {
        if ("route" in side) {
            side.items.map(item => {
                return flatPages([item], groups, resp)
            })

            return
        }

        if (groups[side.group || ""]) {
            const link = groups[side.group || ""]

            resp.push(link)
        }

        side?.pages?.map(async page => {
            if (typeof page === "string") {
                resp.push(page)
                return
            }

            if ("virtual" in page) {
                resp.push(page.virtual)
                return
            }

            return flatPages([page], groups, resp)
        })
    })

    return resp
}

function flatGroups(
    sidebar: (SidebarRoute | Sidebar)[],
    resp: { [key: string]: string } = {}
) {
    sidebar.map(async side => {
        if ("route" in side) {
            side.items.map(item => {
                return flatGroups([item], resp)
            })

            return
        }

        if (side.group) {
            if (resp[side.group]) {
                console.error('group already exists', side.group)
            }

            const first = side?.pages?.[0]
            if (first && typeof first === "string") {
                const chunks = first.split("/")
                chunks[chunks.length - 1] = side.group || ""
                const groupLink = chunks.join("/")

                resp[side.group] = groupLink
            }
        }

        side?.pages?.map(async page => {
            if (typeof page === "string") {
                return
            }

            if ("virtual" in page) {
                return
            }

            return flatGroups([page], resp)
        })
    })

    return resp
}

function uniformSidebarLevelMap(pages: string[]) {
    const out = {};
    let level = 0;

    function recursive(items: string[]) {
        for (const item of items) {
            out[item] = level++;
        }
    }

    recursive(pages);
    return out;
}

// Helper function to read markdown files with support for both .mdx and .md extensions
async function readMarkdownFile(root: string, page: string): Promise<string> {
    try {
        // Try .mdx first
        return await fs.readFile(path.join(root, page + '.mdx'), "utf-8");
    } catch (e) {
        // If .mdx fails, try .md
        try {
            return await fs.readFile(path.join(root, page + '.md'), "utf-8");
        } catch (e) {
        }
    }

    return ""
}

async function uniformResolver(
    settings: Settings,
    root: string,
    matchRoute: string,
    apiFile: string,
    uniformApiResolver: (filePath: string) => Promise<Reference[]>,
    sidebar?: (SidebarRoute | Sidebar)[],
    options?: uniformPresetOptions,
    uniformType?: UniformType,
    disableFSWrite?: boolean
) {
    let urlPrefix = ""

    if (matchRoute && sidebar) {
        sidebar.forEach((sidebar) => {
            if ("route" in sidebar) {
                if (sidebar.route === matchRoute) {
                    if (urlPrefix) {
                        throw new Error('multiple sidebars found for apiFile match')
                    }
                    urlPrefix = sidebar.route
                }
            }
        })
    }

    if (!urlPrefix) {
        sidebar?.push({
            route: matchRoute,
            items: []
        })
        urlPrefix = matchRoute
    }

    if (!urlPrefix && options?.urlPrefix) {
        urlPrefix = options.urlPrefix
    }

    if (!urlPrefix) {
        throw new Error('(uniformResolver): urlPrefix not found')
    }


    const apiFilePath = path.join(root, apiFile); // TODO: support https
    const uniformRefs = await uniformApiResolver(apiFilePath)
    const plugins = globalThis.__xydUserUniformVitePlugins || []

    if (uniformType === "openapi") {
        plugins.push(uniformPluginXDocsSidebar)
    }
    const uniformWithNavigation = uniform(uniformRefs, {
        plugins: [
            ...plugins,
            pluginNavigation(settings, {
                urlPrefix,
            }),
        ]
    })

    let pageLevels = {}

    const uniformData = {
        slugs: {},
        data: [] as any[], // TODO: fix any
        i: 0,
        set: (slug, content: string, options = {}) => {
            if (uniformData.slugs[slug]) {
                console.error('slug already exists', slug)
            }
            // TODO: in the future custom sort
            const level = pageLevels[slug]

            uniformData.data[level] = {
                slug,
                content,
                options
            }
        }
    }

    const uniformSidebars: SidebarRoute[] = []

    if (sidebar && matchRoute) {
        // TODO: DRY
        sidebar.forEach((sidebar) => {
            if ("route" in sidebar) {
                if (sidebar.route === matchRoute) {
                    uniformSidebars.push(sidebar)
                }
            }
        })

        if (uniformSidebars.length > 1) {
            throw new Error('multiple sidebars found for uniform match')
        }
    }

    {
        const otherUniformPages = flatPages(uniformSidebars, {})
        const groups = flatGroups(uniformWithNavigation.out.sidebar)
        const flatUniformPages = [
            ...otherUniformPages,
            ...flatPages(
                uniformWithNavigation.out.sidebar,
                groups // TODO: we dont need groups - because it comes to structured page levels
            ),
        ]

        pageLevels = uniformSidebarLevelMap(flatUniformPages)

        {
            // TODO: below should be inside uniform?
            // TODO: custom `fn` logic?
            await Promise.all(otherUniformPages.map(async (page) => {
                const content = await readMarkdownFile(root, page);
                uniformData.set(page, content + "\n");
            }))

            await Promise.all(Object.keys(groups).map(async (group) => {
                try {
                    // TODO: only if `group_index`
                    const page = groups[group]
                    const content = await readMarkdownFile(root, page);
                    uniformData.set(page, content + "\n");
                } catch (e) {
                    // Silently continue if file not found
                }
            }))
        }
    }

    let composedFileMap: Record<string, string> = {}
    if (!settings.engine?.uniform?.store) {
        composedFileMap = await composeFileMap(root, matchRoute)
    }

    const basePath = settings.engine?.uniform?.store
        ? root
        : path.join(root, VIRTUAL_CONTENT_FOLDER)


    await Promise.all(
        uniformWithNavigation.references.map(async (ref) => {
            const byCanonical = path.join(urlPrefix, ref.canonical)
            const mdPath = path.join(basePath, byCanonical + '.md')

            const frontmatter = uniformWithNavigation.out.pageFrontMatter[byCanonical]

            if (!frontmatter) {
                console.error('frontmatter not found', byCanonical)
                return
            }

            let meta: Metadata = {
                title: frontmatter.title,
                layout: "wide"
            }

            const resolvedApiFile = path.join("~/", apiFile)
            let region = ""
            // TODO: in the future more advanced composition? - not only like `GET /users/{id}`
            switch (uniformType) {
                case "graphql": {
                    const ctx = ref.context as GraphQLReferenceContext;
                    region = `${ctx.graphqlTypeShort}.${ctx?.graphqlName}`

                    meta.graphql = `${resolvedApiFile}#${region}`

                    break
                }
                case "openapi": {
                    const ctx = ref.context as OpenAPIReferenceContext;
                    const method = (ctx?.method || "").toUpperCase()
                    if (method && ctx?.path) {
                        region = `${method} ${ctx?.path}`
                    } else if (ctx.componentSchema) {
                        region = "/components/schemas/" + ctx.componentSchema
                    }
                    meta.openapi = `${resolvedApiFile}#${region}`
                    break
                }
            }

            let composedContent = ""
            if (region && composedFileMap[region]) {
                const content = await fs.readFile(composedFileMap[region], 'utf-8');
                const resp = matter(content);

                meta = {
                    ...meta,
                    ...composyingMetaProps(resp.data, "title", "description", "layout")
                }

                composedContent = resp.content
            }

            const content = matterStringify({content: composedContent}, meta);

            if (!disableFSWrite) {
                try {
                    await fs.access(path.dirname(mdPath));
                } catch {
                    await fs.mkdir(path.dirname(mdPath), {recursive: true});
                }

                await fs.writeFile(mdPath, content)
            }
        })
    )

    if (!sidebar) {
        return {
            sidebar: uniformWithNavigation.out.sidebar,
            data: uniformData.data
        }
    }

    if (matchRoute) {
        // TODO: in the future custom position - before / after
        uniformSidebars[0].items.unshift(...uniformWithNavigation.out.sidebar)

        return {
            data: uniformData.data,
        }
    }

    sidebar.unshift(...uniformWithNavigation.out.sidebar)

    return {
        data: uniformData.data,
        composedFileMap
    }
}

const allowedMetaProps = ['title', 'description', 'layout'] as const;

type AllowedMetaProps = Pick<Metadata, typeof allowedMetaProps[number]>;

function composyingMetaProps(meta: Metadata, ...props: (keyof AllowedMetaProps)[]) {
    let newProps = {}
    props.forEach(prop => {
        if (allowedMetaProps.includes(prop as typeof allowedMetaProps[number]) && typeof meta[prop] === "string") {
            newProps[prop] = meta[prop] as string;
        }
    });

    return newProps;
}

async function composeFileMap(basePath: string, matchRoute: string) {
    const routeMap: Record<string, string> = {};

    async function processDirectory(dirPath: string) {
        const entries = await fs.readdir(dirPath, {withFileTypes: true});

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                await processDirectory(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
                try {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    const {data: frontmatter} = matter(content);

                    if (frontmatter && frontmatter.openapi) {
                        const route = frontmatter.openapi;
                        routeMap[route] = path.join(matchRoute, entry.name);
                    }
                } catch (error) {
                    console.error(`Error processing file ${fullPath}:`, error);
                }
            }
        }
    }

    await processDirectory(path.join(basePath, matchRoute));
    return routeMap;
}

// preinstall adds uniform navigation to settings
function preinstall(
    id: string,
    uniformApiResolver: (filePath: string) => Promise<Reference[]>,
    apiFile: APIFile,
    uniformType: UniformType,
    disableFSWrite?: boolean
) {
    return function preinstallInner(options: uniformPresetOptions) {
        return async function uniformPluginInner(settings: Settings, data: PresetData) {
            const root = process.cwd()

            if (!apiFile) {
                return
            }

            const resp: any[] = []

            // TODO: support NOT ROUTE MATCH

            if (typeof apiFile === "string") {
                const routeMatch = id

                const resolved = await uniformResolver(
                    settings,
                    root,
                    routeMatch,
                    apiFile,
                    uniformApiResolver,
                    settings?.navigation?.sidebar,
                    options,
                    uniformType,
                    disableFSWrite
                )

                if (resolved.sidebar) {
                    settings.navigation = {
                        ...settings?.navigation,
                        sidebar: !settings.navigation?.sidebar
                            ? resolved.sidebar
                            : [
                                ...resolved.sidebar,
                                ...!settings.navigation?.sidebar || [],
                            ]
                    }
                }

                resp.push({
                    urlPrefix: routeMatch.startsWith("/") ? routeMatch : `/${routeMatch}`,
                    data: resolved.data,
                })
            } else {
                async function resolve(
                    routeMatch: string,
                    uniform: string,
                ) {
                    const resolved = await uniformResolver(
                        settings,
                        root,
                        routeMatch,
                        uniform,
                        uniformApiResolver,
                        settings?.navigation?.sidebar,
                        options,
                        uniformType,
                        disableFSWrite
                    )

                    if (resolved.sidebar) {
                        settings.navigation = {
                            ...settings?.navigation,
                            sidebar: !settings.navigation?.sidebar
                                ? resolved.sidebar
                                : [
                                    ...resolved.sidebar,
                                    ...!settings.navigation?.sidebar || [],
                                ]
                        }
                    }

                    resp.push({
                        urlPrefix: routeMatch.startsWith("/") ? routeMatch : `/${routeMatch}`,
                        data: resolved.data,
                    })
                }

                if (apiFile["source"]) {
                    await resolve(apiFile["route"], apiFile["source"])
                } else {
                    for (const apiKey in apiFile) {
                        const uniform = apiFile?.[apiKey]?.source || ""
                        const routeMatch = settings.api?.[id]?.[apiKey]?.route || ""

                        if (!routeMatch) {
                            throw new Error(`route match not found for ${apiKey}`)
                        }
                        if (!uniform) {
                            throw new Error(`uniform not found for ${apiKey}`)
                        }

                        await resolve(routeMatch, uniform)
                    }
                }
            }

            return resp
        }
    }
}

function vitePluginUniformContent(pluginId: string) {
    return function vitePluginUniformContentInner() {
        return async function ({
                                   preinstall
                               }): Promise<VitePlugin> {
            return {
                name: `virtual:xyd-plugin-docs/${pluginId}`, // TODO: unique name per plugin ?
                resolveId(id) {
                    if (id == `virtual:xyd-plugin-docs/${pluginId}`) {
                        return id;
                    }
                },
                async load(id) {
                    if (id === `virtual:xyd-plugin-docs/${pluginId}`) {
                        if (!preinstall.data) {
                            return `export default ${JSON.stringify(preinstall)}`;
                        }

                        return `export default ${JSON.stringify(preinstall.data)}`;
                    }
                }
            };
        }
    }
}

type UniformType = "graphql" | "openapi" | "sources"

function uniformPreset(
    id: string,
    apiFile: APIFile,
    sidebar: (SidebarRoute | Sidebar)[],
    options: uniformPresetOptions,
    uniformApiResolver: (filePath: string) => Promise<Reference[]>,
    disableFSWrite?: boolean
) {
    return function (settings: Settings, uniformType: UniformType) {
        const routeMatches: string[] = []

        if (apiFile) {
            sidebar.forEach((sidebar) => {
                if ("route" in sidebar) {
                    if (typeof apiFile === "string") {
                        const routeMatch = id

                        if (sidebar.route === routeMatch) {
                            routeMatches.push(routeMatch)
                        }

                        return
                    }

                    if (typeof apiFile === "object" && !Array.isArray(apiFile)) {
                        for (const routeMatchKey in apiFile) {
                            // TODO: is 'id' a good idea here?
                            const routeMatch = settings?.api?.[id]?.[routeMatchKey]?.route || ""
                            if (sidebar.route === routeMatch) {
                                routeMatches.push(routeMatch)
                            }
                        }
                    }

                    return
                }
                // TODO: support NOT match sidebar
            })
        } else {
            if (!options.urlPrefix) {
                throw new Error('(uniformPreset): urlPrefix not found')
            }

            routeMatches.push(`${options.urlPrefix}/*`)
        }

        const basePath = path.join(getHostPath(), "./plugins/xyd-plugin-docs")
        const pageTheme = "src/pages/docs.tsx"

        return {
            preinstall: [
                preinstall(id, uniformApiResolver, apiFile, uniformType, disableFSWrite)
            ],
            routes: routeMatches.map((routeMatch, i) => route(
                    `${routeMatch}/*`,
                    path.join(basePath, pageTheme), {
                        id: `xyd-plugin-docs/${id}-${i}`,
                    }
                ),
            ),
            vitePlugins: [
                vitePluginUniformContent(id),
            ]
        }
    } satisfies Preset<unknown>
}


// TODO: refactor to use class methods + separate functions if needed?
export abstract class UniformPreset {
    private _urlPrefix: string;
    private _sourceTheme: boolean;

    protected constructor(
        private presetId: string,
        private apiFile: APIFile,
        private sidebar: (SidebarRoute | Sidebar)[],
        private disableFSWrite?: boolean
    ) {
    }

    protected abstract uniformRefResolver(filePath: string): Promise<Reference[]>

    protected urlPrefix(urlPrefix: string): this {
        this._urlPrefix = urlPrefix

        return this
    }

    protected sourceTheme(v: boolean): this {
        this._sourceTheme = v

        return this
    }

    protected newUniformPreset() {
        return uniformPreset(
            this.presetId,
            this.apiFile,
            this.sidebar,
            {
                urlPrefix: this._urlPrefix,
                sourceTheme: this._sourceTheme,
            },
            this.uniformRefResolver,
            this.disableFSWrite
        )
    }
}


