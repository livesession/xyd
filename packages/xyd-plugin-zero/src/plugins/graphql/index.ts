import path from "path";
import {promises as fs} from "fs";

import matterStringify from "gray-matter/lib/stringify";
import {Plugin as VitePlugin} from "vite"
import {route} from "@react-router/dev/routes";

import {Settings} from "@xyd/core";
import {gqlSchemaToReferences} from "@xyd/gql";
import uniform, {pluginNavigation} from "@xyd/uniform";
import {
    compile as compileMarkdown,
    referenceAST
} from "@xyd/uniform/markdown";

import {Plugin} from "../../types"
import {SidebarMulti} from "@xyd/core/src/types/settings";

interface graphqlPluginOptions {
    urlPrefix?: string
    root?: string
}

// TODO: it should also have vite plugin to have this merged files + theme

// preinstall adds graphql navigation to settings
function preinstall(options: graphqlPluginOptions) {
    return async function graphqlPluginInner(settings: Settings) {
        const root = options.root ?? process.cwd()

        if (!settings?.api?.graphql) {
            return
        }

        if (typeof settings.api?.graphql != 'string') {
            console.error('currently only string is supported for graphql');
            return
        }

        let urlPrefix = ""

        if (settings?.api?.match?.graphql) {
            settings?.structure?.sidebar.forEach((sidebar) => {
                if ("match" in sidebar) {
                    if (sidebar.match === settings?.api?.match?.graphql) {
                        if (urlPrefix) {
                            throw new Error('multiple sidebars found for graphql match')
                        }
                        urlPrefix = sidebar.match
                    }
                }
            })
        }

        if (!urlPrefix) {
            throw new Error('urlPrefix not found')
        }

        const gqlPath = path.join(root, settings.api?.graphql);
        const uniformRefs = await gqlSchemaToReferences(gqlPath)
        const uniformWithNavigation = uniform(uniformRefs, {
            plugins: [pluginNavigation({
                urlPrefix: urlPrefix,
            })]
        })

        // TODO: for some reasons we have to split big content because of maximum call stack size bug inside mdx compile?
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
                if (!mergedChunks[chunkId]) {
                    mergedChunks[chunkId] = ""
                }

                // TODO: check based on size? but remember its only a hot-fix
                if (i % 5 === 0) {
                    chunkId++
                    mergedChunks[chunkId] = ""
                }

                mergedChunks[chunkId] += md + "\n" // TODO: fix
            })
        )

        if (settings.structure?.sidebar) {
            if (settings?.api?.match?.graphql) {
                const sidebars: SidebarMulti[] = []

                // TODO: DRY
                settings.structure.sidebar.forEach((sidebar) => {
                    if ("match" in sidebar) {
                        if (sidebar.match === settings?.api?.match?.graphql) {
                            sidebars.push(sidebar)
                        }
                    }
                })

                if (sidebars.length > 1) {
                    throw new Error('multiple sidebars found for graphql match')
                }

                sidebars[0].items.push(...uniformWithNavigation.out.sidebar)

                return {
                    graphqlMerged: mergedChunks
                }
            }

            settings.structure.sidebar.push(...uniformWithNavigation.out.sidebar)

            return {
                graphqlMerged: mergedChunks
            }
        }

        settings.structure = {
            sidebar: uniformWithNavigation.out.sidebar
        }

        return {
            graphqlMerged: mergedChunks
        }
    }
}

function vitePluginGraphqlContent() {
    return async function ({
                               preinstall
                           }): Promise<VitePlugin> {
        return {
            name: 'virtual:xyd-plugin-zero/graphql', // TODO: unique name per plugin ?
            resolveId(id) {
                if (id === 'virtual:xyd-plugin-zero/graphql') {
                    return id;
                }
            },
            async load(id) {
                if (id === 'virtual:xyd-plugin-zero/graphql') {
                    return `export default ${JSON.stringify(preinstall.graphqlMerged)}`;
                }
            }
        };
    }
}

// TODO: custom route?
// TODO: deprecate options.urlPrefix?

function plugin(
    settings: Settings,
    options: graphqlPluginOptions
) {
    let routeMatch = ""

    if (settings?.api?.match?.graphql) {
        settings?.structure?.sidebar.forEach((sidebar) => {
            if ("match" in sidebar) {
                if (sidebar.match === settings?.api?.match?.graphql) {
                    if (routeMatch) {
                        throw new Error('multiple sidebars found for graphql match')
                    }
                    routeMatch = sidebar.match.endsWith("/") ? `${sidebar.match}*` : `${sidebar.match}/*`
                }
            }
        })
    } else {
        routeMatch = options.urlPrefix ? `${options.urlPrefix}/*` : "/graphql/*"
    }

    return {
        preinstall: [
            preinstall
        ],
        routes: [
            route(routeMatch, "../../../xyd-plugin-zero/src/pages/api-reference.tsx", {
                id: "xyd-plugin-zero/graphql",
            }),    // TODO: get graphql url from settings ?
        ],
        vitePlugins: [
            vitePluginGraphqlContent,
        ]
    }
}

export const graphqlPlugin = plugin satisfies Plugin<unknown>