import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { visit } from "unist-util-visit";

import slugify from 'slugify'
import type { Plugin, ResolvedConfig } from 'vite'
import { presets } from '@orama/searchbox'
import { AnySchema, create, insertMultiple } from '@orama/orama'
import { persist } from '@orama/plugin-data-persistence'

import type { Settings, Sidebar, SidebarMulti } from '@xyd-js/core'
import { markdownPlugins } from '@xyd-js/content/md'

type OramaPluginOptions = {
    analytics?: {
        enabled: boolean
        apiKey: string
        indexId: string
    }
}

type OramaSectionSchema = {
    /**
     * ID of the page e.g. "making-a-new-project"
     */
    id: string

    /**
     * Slug of the page e.g. "getting-started"
     */
    pageId: string

    /**
     * URL of the page e.g. "/getting-started"
     */
    pageUrl: string

    /**
     * Title of the page e.g. "Getting Started"
     */
    pageTitle: string

    /**
     * Level of the section e.g. 1, 2
     */
    level: number

    /**
     * Title of the section e.g. "Making a new project"
     */
    title: string

    /**
     * Summary of the page e.g. "This is the summary of the page"
     */
    summary: string

    /**
     * Content of the section
     */
    content: string

}

export function OramaPlugin(
    xydSettings: Settings,
    pluginOptions: OramaPluginOptions = {}
): Plugin {
    const virtualModuleId = 'virtual:xyd-plugin-orama-data'
    const resolvedVirtualModuleId = `\0${virtualModuleId}`

    let resolveConfig: ResolvedConfig | null = null

    const pages = flatPages(xydSettings.navigation?.sidebar || [], {}).slice(0, 1)
        .map(page => ({
            name: page,
            path: path.join(process.cwd(), page)
        }))

    return {
        name: 'xyd-plugin-orama',
        enforce: 'pre',

        config: () => ({
            resolve: {
                alias: {
                    'virtual:Search': new URL('./Search.tsx', import.meta.url).pathname
                }
            }
        }),

        async configResolved(config: ResolvedConfig) {
            if (resolveConfig) {
                return
            }

            resolveConfig = config
        },

        async resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId
            }
        },

        async load(this, id: string) {
            if (id !== resolvedVirtualModuleId) return

            const indices = await indexPages(xydSettings, pages)

            return `
                const data = ${JSON.stringify(indices)};
                const analytics = ${JSON.stringify(pluginOptions.analytics)};
                export default { data, analytics };
            `
        }
    }
}

function flattenNode(node: any): string {
    if (node.value) {
        return node.value
    }

    if (node.children) {
        return node.children.map((child: any) => flattenNode(child)).join('')
    }

    return ''
}

async function processMarkdownSections(
    name: string,
    content: string,
    remarkPlugins: any,
    rehypePlugins: any
): Promise<OramaSectionSchema[]> {
    const rootSection: OramaSectionSchema = {
        id: '',
        pageId: '',
        pageUrl: '',
        pageTitle: '',
        level: 0,
        title: '',
        summary: '',
        content: '',
    }
    const sections: OramaSectionSchema[] = []
    let currentSection: OramaSectionSchema | null = null

    const processor = unified()
        .use(remarkParse)
        .use(remarkPlugins)
        .use(() => {
            return (tree: any) => {
                let currentContent = ''

                visit(tree, (node) => {
                    // Skip yaml frontmatter
                    if (node.type === 'yaml') {
                        return
                    }

                    // Handle headings
                    if (node.type === 'heading') {
                        const heading = flattenNode(node)

                        // Save previous section's content
                        if (currentSection && currentContent) {
                            currentSection.content = currentContent.trim()
                            currentContent = ''
                        }

                        if (node.depth === 1) {
                            if (rootSection.id) {
                                console.error("Multiple h1 found")
                            }

                            rootSection.id = slugify(heading, { lower: true })
                            rootSection.pageId = rootSection.id
                            rootSection.pageUrl = `/${name}`
                            rootSection.pageTitle = heading
                            rootSection.level = 1
                            rootSection.title = heading
                            sections.push(rootSection)
                            currentSection = rootSection
                        } else {
                            const section = {
                                id: slugify(heading, { lower: true }),
                                pageId: rootSection.id,
                                pageUrl: rootSection.pageUrl,
                                pageTitle: rootSection.title,
                                level: node.depth,
                                title: heading,
                                summary: '',
                                content: '',
                            }
                            sections.push(section)
                            currentSection = section
                        }
                        return
                    }

                    // Skip if we're not in a section yet
                    if (!currentSection) {
                        return
                    }

                    // For list items, add proper formatting
                    if (node.type === 'listItem') {
                        const itemContent = flattenNode(node)
                        currentContent += `- ${itemContent}\n`
                        return
                    }

                    // For links, preserve the markdown format
                    if (node.type === 'link') {
                        const text = flattenNode(node)
                        currentContent += `[${text}](${node.url})\n`
                        return
                    }

                    // For other nodes, just add their content
                    const nodeContent = flattenNode(node)
                    if (nodeContent) {
                        currentContent += nodeContent + '\n'
                    }
                })

                // Save the last section's content
                if (currentSection && currentContent) {
                    currentSection.content = currentContent.trim()
                }
            }
        })
        .use(remarkRehype)
        .use(rehypePlugins)
        .use(rehypeStringify)

    await processor.process(content)

    return sections
}

async function indexPages(
    xydSettings: Settings,
    pages: { name: string, path: string }[],
): Promise<ReturnType<typeof persist>> {
    const mdPlugins = markdownPlugins({}, xydSettings)

    // Process all markdown files during config resolution
    const processedSections = (await Promise.all(
        pages.flatMap(async (file, i) => {
            let filePath = ""
            let err

            try {
                const p = file.path + ".md"
                statSync(p)
                filePath = p
            } catch (error) {
                err = error
            }

            if (!filePath) {
                try {
                    const p = file.path + ".mdx"
                    statSync(p)
                    filePath = p
                    err = null
                } catch (error) {
                    err = error
                }
            }

            if (err) {
                console.error(err)
                return []
            }

            const content = readFileSync(filePath, 'utf-8')
            const sections = await processMarkdownSections(
                file.name,
                content,
                mdPlugins.remarkPlugins,
                mdPlugins.rehypePlugins
            )

            return sections
        })
    )).flat()

    const db = await create({
        schema: presets.docs.schema as AnySchema
    })
    await insertMultiple(db, processedSections)

    return await persist(db, 'json', 'browser')
}

// TODO: !!!! DRY !!!
function flatPages(
    sidebar: (SidebarMulti | Sidebar)[],
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

            return flatPages([page], groups, resp)
        })
    })

    return resp
}
