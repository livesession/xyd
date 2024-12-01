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

interface openapiPluginOptions {
    urlPrefix: string
    group?: string // TODO: nested groups ?
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

        const openApiPath = path.join(root, settings.api?.openapi);
        const schema = await deferencedOpenAPI(openApiPath)

        const uniformRefs = oapSchemaToReferences(schema)
        const uniformWithNavigation = uniform(uniformRefs, {
            plugins: [pluginNavigation({
                urlPrefix: options.urlPrefix,
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

                const byCanonical = path.join(options.urlPrefix, ref.canonical) // TODO: get canoncial name from uniformWithNavigation ?
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

        if (settings.structure?.navigation) {
            if (!options.group) {
                settings.structure.navigation.push(...uniformWithNavigation.out.navigation)

                return {
                    openapiMerged: mergedChunks
                }
            }

            const currentGroup = settings.structure.navigation.find(nav => nav.group === options.group)

            if (!currentGroup) {
                return {
                    openapiMerged: mergedChunks
                }
            }

            if (currentGroup?.pages) {
                currentGroup.pages.push(...uniformWithNavigation.out.navigation)
            } else {
                console.error('group does not have pages', currentGroup)
            }

            return {
                openapiMerged: mergedChunks
            }
        }

        settings.structure = {
            navigation: uniformWithNavigation.out.navigation
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
function plugin(options: openapiPluginOptions) {
    return {
        preinstall: [
            preinstall
        ],
        routes: [
            route(options.urlPrefix ? options.urlPrefix + "/*" : "/rest/*", "../../../xyd-plugin-zero/src/pages/api-reference.tsx", {
                id: "xyd-plugin-zero/openapi",
            }),
        ],
        vitePlugins: [
            vitePluginOapContent,
        ]
    }
}

export const openapiPlugin = plugin satisfies Plugin<unknown>