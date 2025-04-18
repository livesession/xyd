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
    SidebarMulti
} from "@xyd-js/core";
import uniform, {pluginNavigation, Reference} from "@xyd-js/uniform";
import {
    compile as compileMarkdown,
    referenceAST
} from "@xyd-js/uniform/markdown";
import {Preset, PresetData} from "../../types";


// TODO: REFACTOR PLUGIN-ZERO AND ITS DEPS FOR MORE READABLE CODE AND BETTER API

export interface uniformPresetOptions {
    urlPrefix?: string
    root?: string
    sourceTheme?: boolean
}

function flatPages(
    sidebar: (SidebarMulti | Sidebar) [],
    groups: { [key: string]: string },
    resp: string[] = [],
) {
    sidebar.map(async side => {
        if ("match" in side) {
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

            return flatPages([page], groups, resp)
        })
    })

    return resp
}

function flatGroups(
    sidebar: (SidebarMulti | Sidebar) [],
    resp: { [key: string]: string } = {}
) {
    sidebar.map(async side => {
        if ("match" in side) {
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

            return flatGroups([page], resp)
        })
    })

    return resp
}

function uniformSidebarLevelMap(pages: string []) {
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

async function uniformResolver(
    root: string,
    matchRoute: string,
    apiFile: string,
    uniformApiResolver: (filePath: string) => Promise<Reference[]>,
    sidebar?: (SidebarMulti | Sidebar)[],
    options?: uniformPresetOptions
) {
    let urlPrefix = ""

    if (matchRoute && sidebar) {
        sidebar.forEach((sidebar) => {
            if ("match" in sidebar) {
                if (sidebar.match === matchRoute) {
                    if (urlPrefix) {
                        throw new Error('multiple sidebars found for apiFile match')
                    }
                    urlPrefix = sidebar.match
                }
            }
        })
    }

    if (!urlPrefix && options?.urlPrefix) {
        urlPrefix = options.urlPrefix
    }

    if (!urlPrefix) {
        throw new Error('urlPrefix not found')
    }

    const apiFilePath = path.join(root, apiFile); // TODO: support https
    const uniformRefs = await uniformApiResolver(apiFilePath)
    const uniformWithNavigation = uniform(uniformRefs, {
        plugins: [pluginNavigation({
            urlPrefix,
        })]
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

    const uniformSidebars: SidebarMulti[] = []

    if (sidebar && matchRoute) {
        // TODO: DRY
        sidebar.forEach((sidebar) => {
            if ("match" in sidebar) {
                if (sidebar.match === matchRoute) {
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
                const content = await fs.readFile(path.join(root, page + '.mdx'), "utf-8") // TODO: support .md
                uniformData.set(page, content + "\n")
            }))

            await Promise.all(Object.keys(groups).map(async (group) => {
                try {
                    // TODO: only if `group_index`
                    const page = groups[group]
                    const content = await fs.readFile(path.join(root, page + '.mdx'), "utf-8") // TODO: support .md
                    uniformData.set(page, content + "\n")
                } catch (e) {
                }
            }))
        }

    }

    await Promise.all(
        uniformWithNavigation.references.map(async (ref) => {
            const ast = referenceAST(ref)
            const md = compileMarkdown(ast)

            const byCanonical = path.join(urlPrefix, ref.canonical)
            const mdPath = path.join(root, byCanonical + '.md')

            const frontmatter = uniformWithNavigation.out.pageFrontMatter[byCanonical]

            if (!frontmatter) {
                console.error('frontmatter not found', byCanonical)
                return
            }
            const content = matterStringify({content: md}, {
                title: frontmatter.title,
            });

            await fs.writeFile(mdPath, content)

            uniformData.set(byCanonical, md + "\n") // // TODO: group chunks like previously but + loading fs content?
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
    }
}

// preinstall adds uniform navigation to settings
function preinstall(
    id: string,
    uniformApiResolver: (filePath: string) => Promise<Reference[]>,
    apiFile: APIFile,
) {
    return function preinstallInner(options: uniformPresetOptions) {
        return async function uniformPluginInner(settings: Settings, data: PresetData) {
            const root = options.root ?? process.cwd()

            if (!apiFile) {
                return
            }

            const resp: any[] = []

            // TODO: support NOT ROUTE MATCH

            if (typeof apiFile === "string") {
                const routeMatch = settings.api?.match?.[id] || ""

                const resolved = await uniformResolver(
                    root,
                    routeMatch,
                    apiFile,
                    uniformApiResolver,
                    settings?.structure?.sidebar,
                    options
                )

                if (resolved.sidebar) {
                    settings.structure = {
                        ...settings?.structure,
                        sidebar: !settings.structure?.sidebar
                            ? resolved.sidebar
                            : [
                                ...resolved.sidebar,
                                ...!settings.structure?.sidebar || [],
                            ]
                    }
                }

                resp.push({
                    urlPrefix: routeMatch.startsWith("/") ? routeMatch : `/${routeMatch}`,
                    data: resolved.data,
                })
            } else {
                for (const openapiKey in apiFile) {
                    const uniform = apiFile?.[openapiKey]
                    const routeMatch = settings.api?.match?.[id]?.[openapiKey] || ""

                    if (!routeMatch) {
                        throw new Error(`route match not found for ${openapiKey}`)
                    }
                    if (!uniform) {
                        throw new Error(`uniform not found for ${openapiKey}`)
                    }

                    const resolved = await uniformResolver(
                        root,
                        routeMatch,
                        uniform,
                        uniformApiResolver,
                        settings?.structure?.sidebar
                    )

                    if (resolved.sidebar) {
                        settings.structure = {
                            ...settings?.structure,
                            sidebar: !settings.structure?.sidebar
                                ? resolved.sidebar
                                : [
                                    ...resolved.sidebar,
                                    ...!settings.structure?.sidebar || [],
                                ]
                        }
                    }

                    resp.push({
                        urlPrefix: routeMatch.startsWith("/") ? routeMatch : `/${routeMatch}`,
                        data: resolved.data,
                    })
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
                name: `virtual:xyd-plugin-zero/${pluginId}`, // TODO: unique name per plugin ?
                resolveId(id) {
                    if (id == `virtual:xyd-plugin-zero/${pluginId}`) {
                        return id;
                    }
                },
                async load(id) {
                    if (id === `virtual:xyd-plugin-zero/${pluginId}`) {
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

function uniformPreset(
    id: string,
    apiFile: APIFile,
    sidebar: (SidebarMulti | Sidebar)[],
    options: uniformPresetOptions,
    uniformApiResolver: (filePath: string) => Promise<Reference[]>
) {
    return function (settings: Settings) {
        const routeMatches: string[] = []

        if (apiFile) {
            sidebar.forEach((sidebar) => {
                if ("match" in sidebar) {
                    if (typeof apiFile === "string") {
                        const routeMatch = settings?.api?.match?.[id]

                        if (sidebar.match === routeMatch) {
                            routeMatches.push(routeMatch)
                        }

                        return
                    }

                    if (typeof apiFile === "object" && !Array.isArray(apiFile)) {
                        for (const routeMatchKey in apiFile) {
                            // TODO: is 'id' a good idea here?
                            const routeMatch = settings?.api?.match?.[id]?.[routeMatchKey]
                            if (sidebar.match === routeMatch) {
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
                throw new Error('urlPrefix not found')
            }

            routeMatches.push(`${options.urlPrefix}/*`)
        }

        let basePath = ""

        if (process.env.XYD_CLI) {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            basePath = path.join(__dirname, "./plugins/xyd-plugin-zero")
        } else {
            basePath = "../../../xyd-plugin-zero"
        }

        let pageTheme = "src/pages/api-reference.tsx"

        if (options.sourceTheme) {
            pageTheme = "src/pages/api-reference-source.tsx"
        }

        return {
            preinstall: [
                preinstall(id, uniformApiResolver, apiFile)
            ],
            routes: routeMatches.map((routeMatch, i) => route(
                    `${routeMatch}/*`,
                    path.join(basePath, pageTheme), {
                        id: `xyd-plugin-zero/${id}-${i}`,
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
    private _root: string;
    private _urlPrefix: string;
    private _sourceTheme: boolean;

    protected constructor(
        private presetId: string,
        private apiFile: APIFile,
        private sidebar: (SidebarMulti | Sidebar)[],
    ) {
    }

    protected abstract uniformRefResolver(filePath: string): Promise<Reference[]>

    protected root(root: string): this {
        this._root = root

        return this
    }

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
                root: this._root,
                urlPrefix: this._urlPrefix,
                sourceTheme: this._sourceTheme,
            },
            this.uniformRefResolver,
        )
    }

}


