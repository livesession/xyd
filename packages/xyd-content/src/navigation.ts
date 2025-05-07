import { promises as fs } from 'fs';
import path from 'path';

import React from "react";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { VFile } from "vfile";
import { compile as mdxCompile } from "@mdx-js/mdx";

import { Metadata, Sidebar, MetadataMap, Header, PageURL, VirtualPage } from "@xyd-js/core";

declare global {
    var __xydPagePathMapping: { [key: string]: string }
}
// TODO: better algorithm + data structures - since it's on build time it's not a big deal nevertheless it should be changed in the future

// pageFrontMatters gets frontmatters for given navigation
export async function pageFrontMatters(navigation: Sidebar[]): Promise<MetadataMap> {
    const frontmatters: MetadataMap = {}

    const promises: Promise<any>[] = []

    function mapPages(page: PageURL) {
        if (typeof page !== "string") {
            if ("virtual" in page) {
                promises.push(job(page, frontmatters))
            } else {
                page.pages?.forEach(mapPages)
            }
            return
        }

        promises.push(job(page, frontmatters))
    }

    navigation.map(async (nav: Sidebar) => {
        nav.pages?.forEach(mapPages)
    })

    await Promise.all(promises)

    return frontmatters
}

// filterNavigation filter navigation items by top levels of 'header' configuration and current 'slug'
export function filterNavigationByLevels(
    headers: Header[],
    slug: string
) {
    const topLevelTabMatcher = headers?.reduce((acc: any, header) => {
        const tabLevel = header?.url?.split("/")?.length

        if (!tabLevel) {
            return {
                ...acc
            }
        }

        if (!acc[tabLevel]) {
            return {
                ...acc,
                [tabLevel]: new Set().add(header?.url)
            }
        }

        return {
            ...acc,
            [tabLevel]: acc[tabLevel].add(header?.url)
        }
    }, {}) as { [level: number]: Set<string> }

    return (nav: Sidebar) => {
        let match = false

        Object.keys(topLevelTabMatcher).forEach((levelStr) => {
            if (match) {
                return true
            }
            const level = parseInt(levelStr)
            const findThisSlug = slug.split("/").filter(s => !!s).slice(0, level).join("/")

            function findMatchedPage(page: PageURL) {
                if (typeof page !== "string") {
                    if ("virtual" in page) {
                        return matchPage(page.virtual)
                    } else {
                        page.pages?.forEach(findMatchedPage)
                    }
                    return
                }

                return matchPage(page)
            }

            function matchPage(page: string) {
                const findThisPage = page.split("/").filter(p => !!p).slice(0, level).join("/")

                const set = topLevelTabMatcher[level]

                if (set.has(findThisPage) && findThisPage === findThisSlug) {
                    match = true
                    return true
                }
            }

            nav?.pages?.forEach(findMatchedPage)
        })

        return match
    }
}

function mdxExport(code: string) {
    const scope = {
        Fragment: React.Fragment,
        jsxs: React.createElement,
        jsx: React.createElement,
        jsxDEV: React.createElement,
    }
    const fn = new Function(...Object.keys(scope), code)
    return fn(scope)
}

async function getFrontmatter(filePath: string): Promise<Metadata> {
    const body = await fs.readFile(filePath, "utf-8");

    const vfile = new VFile({
        path: filePath,
        value: body,
        contents: body
    });

    const compiled = await mdxCompile(vfile, {
        remarkPlugins: [
            remarkFrontmatter,
            remarkMdxFrontmatter
        ],
        rehypePlugins: [],
        recmaPlugins: [],
        outputFormat: 'function-body',
        development: false,
    });

    const code = String(compiled)

    const {
        reactFrontmatter, // in the future same key?
        frontmatter
    } = mdxExport(code)

    const matter: Metadata = frontmatter

    let title = ""
    if (typeof matter.title === "string") {
        title = matter.title
    }
    if (reactFrontmatter) {
        if (typeof reactFrontmatter?.title === "function") {
            matter.title = {
                title,
                code: reactFrontmatter.title.toString()
            }
        }
    }

    return matter
}

// TODO: indices map to not do like this - search for mdx if not then md
async function job(page: string | VirtualPage, frontmatters: MetadataMap) {
    let fileSource = ""

    if (typeof page === "string") {
        fileSource = page
    } else {
        fileSource = page.virtual
    }

    let pageName = ""
    if (typeof page === "string") {
        pageName = page
    } else {
        pageName = page.page
    }

    const pagePath = globalThis.__xydPagePathMapping[pageName] || ""
    const filePath = path.join(process.cwd(), pagePath)
    
    const matter = await getFrontmatter(filePath)

    frontmatters[pageName] = matter
}
