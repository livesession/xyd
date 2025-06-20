import { promises as fs } from 'fs';
import path from 'path';

import React from "react";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { VFile } from "vfile";
import { compile as mdxCompile } from "@mdx-js/mdx";

import { Metadata, Sidebar, MetadataMap, Header, PageURL, VirtualPage } from "@xyd-js/core";

// TODO: better algorithm + data structures - since it's on build time it's not a big deal nevertheless it should be changed in the future

// pageFrontMatters gets frontmatters for given navigation
export async function pageFrontMatters(navigation: Sidebar[], pagePathMapping: { [key: string]: string }): Promise<MetadataMap> {
    const frontmatters: MetadataMap = {}

    const promises: Promise<any>[] = []

    function mapPages(page: PageURL) {
        if (typeof page !== "string") {
            if ("virtual" in page) {
                promises.push(job(page, frontmatters, pagePathMapping))
            } else if ("pages" in page) {
                page.pages?.forEach(mapPages)
            }
            return
        }

        promises.push(job(page, frontmatters, pagePathMapping))
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
        const tabLevel = header?.page?.split("/")?.length

        if (!tabLevel) {
            return {
                ...acc
            }
        }

        if (!acc[tabLevel]) {
            return {
                ...acc,
                [tabLevel]: new Set().add(header?.page)
            }
        }

        return {
            ...acc,
            [tabLevel]: acc[tabLevel].add(header?.page)
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
                    if ("virtual" in page && page.virtual) {
                        return matchPage(page.virtual)
                    } else if ("pages" in page) {
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

    if (!matter) {
        throw new Error(`Frontmatter not found in ${filePath}`)
    }

    let title = ""
    if (typeof matter.title === "string") {
        title = matter.title
    }
    if (reactFrontmatter) {
        console.error("currently react frontmatter is not supported")
    }

    return matter
}

// TODO: indices map to not do like this - search for mdx if not then md
async function job(page: string | VirtualPage, frontmatters: MetadataMap, pagePathMapping: { [key: string]: string }) {
    let pageName = ""
    if (typeof page === "string") {
        pageName = page
    } else if (page.page) {
        pageName = page.page
    }

    if (!pageName || !pagePathMapping[pageName]) {
        console.log(`⚠️ "${pageName}" is defined in the docs.json navigation but the file does not exist.`)
        return
    }

    const filePath = path.join(process.cwd(), pagePathMapping[pageName])
    
    const matter = await getFrontmatter(filePath)

    frontmatters[pageName] = matter
}
