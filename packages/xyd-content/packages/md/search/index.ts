import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { visit } from "unist-util-visit";

import slugify from 'slugify' // TODO: use github slugify (mybe move to @xyd-js/content)

import type { Settings, Sidebar, SidebarMulti } from '@xyd-js/core'

import { DocSectionSchema } from './types';
import { markdownPlugins } from "../"

export async function mapSettingsToDocSections(xydSettings: Settings) {
    const pages = flatPages(xydSettings.navigation?.sidebar || [], {})
        .map(page => ({
            name: page,
            path: path.join(process.cwd(), page)
        }))

    return await processSections(pages, xydSettings)
}

export async function mapContentToDocSections(
    xydSettings: Settings,
    route: string,
    content: string,
) {
    const sections: DocSectionSchema[] = []
    let currentSection: DocSectionSchema | null = null

    const rootSection: DocSectionSchema = {
        // id: '',
        pageId: '',
        pageUrl: '',
        pageTitle: '',
        headingLevel: 0,
        headingTitle: '',
        summary: '',
        content: '',
    }

    const { remarkPlugins, rehypePlugins } = markdownPlugins({}, xydSettings)

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
                            if (rootSection.pageId) {
                                console.error("Multiple h1 found")
                            }

                            rootSection.pageId = slugify(heading, { lower: true })
                            rootSection.pageUrl = `/${route}` 
                            rootSection.pageTitle = heading
                            rootSection.headingLevel = 1
                            rootSection.headingTitle = heading
                            sections.push(rootSection)
                            currentSection = rootSection
                        } else {
                            const section: DocSectionSchema = {
                                pageId: rootSection.pageId,
                                pageUrl: rootSection.pageUrl, // TODO: HASHES AND QUERY PARAMS
                                pageTitle: rootSection.headingTitle,
                                headingLevel: node.depth,
                                headingTitle: heading,
                                content: '',
                                summary: '',
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

function flattenNode(node: any): string {
    if (node.value) {
        return node.value
    }

    if (node.children) {
        return node.children.map((child: any) => flattenNode(child)).join('')
    }

    return ''
}


async function processSections(pages: { name: string, path: string }[], xydSettings: Settings) {
    return (await Promise.all(
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
            const sections = await mapContentToDocSections(
                xydSettings,
                file.name,
                content,
            )

            return sections.flat()
        })
    )).flat()
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