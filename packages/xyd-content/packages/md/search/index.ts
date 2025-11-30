import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { visit } from "unist-util-visit";
import type { Node } from 'mdast'

import GitHubSlugger from 'github-slugger';

import type { Settings, Sidebar, SidebarRoute } from '@xyd-js/core'

import { DocSectionSchema } from './types';
import { markdownPlugins } from "../"
import { mdParameters } from '../plugins/utils/mdParameters'

export async function mapSettingsToDocSections(xydSettings: Settings) {
    const pages = flatPages(xydSettings.navigation?.sidebar || [], {})
        .map(page => {
            let baseName = xydSettings.advanced?.basename || ""
            
            return {
                name: path.join(baseName, page),
                path: path.join(process.cwd(), page),
            }
        })

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

    const { remarkPlugins, rehypePlugins } = await markdownPlugins({}, xydSettings)

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
                        const heading = processNode(node)

                        // Save previous section's content
                        if (currentSection && currentContent) {
                            currentSection.content = currentContent.trim()
                            currentContent = ''
                        }

                        const slug = slugify(heading)

                        if (node.depth === 1) {
                            if (rootSection.pageId) {
                                console.error("Multiple h1 found")
                            }

                            const pageUrl = route.startsWith("/") ? route : `/${route}`;
                            rootSection.pageId = slug
                            rootSection.pageUrl = pageUrl
                            rootSection.pageTitle = heading
                            rootSection.headingLevel = 1
                            rootSection.headingTitle = heading
                            sections.push(rootSection)
                            currentSection = rootSection
                        } else {
                            const section: DocSectionSchema = {
                                pageId: rootSection.pageId,
                                pageUrl: `${rootSection.pageUrl}#${slug}`, // TODO: QUERY PARAMS
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
                        const itemContent = processNode(node)
                        currentContent += `- ${itemContent}\n`
                        return
                    }

                    // For links, preserve the markdown format
                    if (node.type === 'link') {
                        const text = processNode(node)
                        currentContent += `[${text}](${node.url})\n`
                        return
                    }

                    // For other nodes, just add their content
                    const nodeContent = processNode(node)
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

function processNode(node: Node): string {
    if ('value' in node) {
        const value = node.value as string

        // TODO: check if sanitized does not remove something important
        const { sanitizedText } = mdParameters(value)

        return sanitizedText
    }

    if ('children' in node && Array.isArray(node.children)) {
        return node.children.map((child: Node) => processNode(child)).join('')
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
    sidebar: (SidebarRoute | Sidebar | string)[],
    groups: { [key: string]: string },
    resp: string[] = [],
) {
    sidebar.map(async side => {
        if (typeof side === "string") {
            resp.push(side)
            return
        }

        if ("route" in side) {
            side.pages?.map(item => {
                return flatPages([item], groups, resp)
            })
            return
        }

        // Type guard to check if it's a Sidebar
        if ("group" in side) {
            const groupKey = side.group || "";
            if (groups[groupKey]) {
                const link = groups[groupKey];
                if (link) {
                    resp.push(link);
                }
            }

            side.pages?.map(async page => {
                if (typeof page === "string") {
                    resp.push(page);
                    return;
                }

                if ("virtual" in page && page.virtual) {
                    resp.push(page.virtual);
                    return;
                }

                if ("pages" in page) {
                    return flatPages([page as Sidebar], groups, resp);
                }
            });
        }
    });

    return resp;
}

function slugify(text: string) {
    const slugger = new GitHubSlugger()

    return slugger.slug(text)
}