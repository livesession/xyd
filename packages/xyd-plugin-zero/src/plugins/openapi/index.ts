import path from "path";
import {promises as fs} from "fs";
import matterStringify from "gray-matter/lib/stringify";
import {Plugin as VitePlugin} from "vite"
import {route} from "@react-router/dev/routes";

import {Settings} from "@xyd/core";
import {deferencedOpenAPI, oapSchemaToReferences} from "@xyd/openapi";
import uniform, {pluginNavigation} from "@xyd/uniform";
import {
    compile as compileMarkdown,
    referenceAST
} from "@xyd/uniform/markdown";

import {Plugin} from "../../types"
import {SidebarMulti} from "@xyd/core/src/types/settings";

interface openapiPluginOptions {
    urlPrefix?: string
    root?: string
}

// TODO: it should also have vite plugin to have this merged files + theme

// preinstall adds openapi navigation to settings
function preinstall(options: openapiPluginOptions) {
    return async function openapiPluginInner(settings: Settings) {
        const root = options.root ?? process.cwd()

        if (!settings?.api?.openapi) {
            return
        }

        if (typeof settings.api?.openapi != 'string') {
            console.error('currently only string is supported for openapi');
            return
        }

        let urlPrefix = ""

        if (settings?.api?.match?.openapi) {
            settings?.structure?.sidebar.forEach((sidebar) => {
                if ("match" in sidebar) {
                    if (sidebar.match === settings?.api?.match?.openapi) {
                        if (urlPrefix) {
                            throw new Error('multiple sidebars found for openapi match')
                        }
                        urlPrefix = sidebar.match
                    }
                }
            })
        }

        if (!urlPrefix) {
            throw new Error('urlPrefix not found')
        }

        const openApiPath = path.join(root, settings.api?.openapi);
        const schema = await deferencedOpenAPI(openApiPath)

        const uniformRefs = oapSchemaToReferences(schema)
        const uniformWithNavigation = uniform(uniformRefs, {
            plugins: [pluginNavigation({
                urlPrefix,
            })]
        })

        const mergedChunks = [] as string[]
        let chunkId = 0

        // TODO: title can be different than navigation page
        // TODO: get mapping from plugin?
        // TODO: !!! FINISH !!!
        await Promise.all(
            uniformWithNavigation.references.map(async (ref, i) => {
                const ast = referenceAST(ref)
                const md = compileMarkdown(ast)

                const byCanonical = path.join(urlPrefix, ref.canonical) // TODO: get canoncial name from uniformWithNavigation ?
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

                // TODO: check based on size? but remember its only a hot-fix
                if (i % 5 === 0) {
                    chunkId++
                    mergedChunks[chunkId] = ""
                }

                mergedChunks[chunkId] += md + "\n" // TODO: fix
            })
        )

        if (settings.structure?.sidebar) {
            if (settings?.api?.match?.openapi) {
                const sidebars: SidebarMulti[] = []

                settings.structure.sidebar.forEach((sidebar) => {
                    if ("match" in sidebar) {
                        if (sidebar.match === settings?.api?.match?.openapi) {
                            sidebars.push(sidebar)
                        }
                    }
                })

                if (sidebars.length > 1) {
                    throw new Error('multiple sidebars found for openapi match')
                }

                sidebars[0].items.push(...uniformWithNavigation.out.sidebar)

                return {
                    openapiMerged: mergedChunks
                }
            }

            settings.structure.sidebar.push(...uniformWithNavigation.out.sidebar)

            return {
                openapiMerged: mergedChunks
            }
        }

        settings.structure = {
            sidebar: uniformWithNavigation.out.sidebar
        }

        return {
            openapiMerged: mergedChunks
        }
    }
}


// TODO: use import.meta to support same page for different virtual loaders?
// import.meta.loaders["plugin"]
function vitePluginOapContent() {
    return async function ({
                               preinstall
                           }): Promise<VitePlugin> {
        return {
            name: 'virtual:xyd-plugin-zero/openapi', // TODO: unique name per plugin ?
            resolveId(id) {
                if (id === 'virtual:xyd-plugin-zero/openapi') {
                    return id;
                }
            },
            async load(id) {
                if (id === 'virtual:xyd-plugin-zero/openapi') {
                    return `export default ${JSON.stringify(preinstall.openapiMerged)}`;
                }
            }
        };
    }
}

// TODO: custom route?
function plugin(
    settings: Settings,
    options: openapiPluginOptions
) {
    let routeMatch = ""

    if (settings?.api?.match?.openapi) {
        settings?.structure?.sidebar.forEach((sidebar) => {
            if ("match" in sidebar) {
                if (sidebar.match === settings?.api?.match?.openapi) {
                    if (routeMatch) {
                        throw new Error('multiple sidebars found for graphql match')
                    }
                    routeMatch = sidebar.match.endsWith("/") ? `${sidebar.match}*` : `${sidebar.match}/*`
                }
            }
        })
    } else {
        routeMatch = options.urlPrefix ? `${options.urlPrefix}/*` : "/rest/*"
    }

    return {
        preinstall: [
            preinstall
        ],
        routes: [
            route(routeMatch, "../../../xyd-plugin-zero/src/pages/api-reference.tsx", {
                id: "xyd-plugin-zero/openapi",
            }),
        ],
        vitePlugins: [
            vitePluginOapContent,
        ]
    }
}

export const openapiPlugin = plugin satisfies Plugin<unknown>