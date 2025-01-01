import {promises as fs} from 'fs';
import fs2, {open} from 'fs';
import path from 'path';

import React from "react";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import matter from 'gray-matter';
import {VFile} from "vfile";
import {compile as mdxCompile} from "@mdx-js/mdx";

import {FrontMatter, Sidebar, PageFrontMatter, Header} from "@xyd/core";

// TODO: better algorithm + data structures - since it's on build time it's not a big deal nevertheless it should be changed in the future

// pageFrontMatters gets frontmatters for given navigation
export async function pageFrontMatters(navigation: Sidebar[]): Promise<PageFrontMatter> {
    const frontmatters: PageFrontMatter = {}

    const promises: Promise<any>[] = []

    function mapPages(page: string | Sidebar) {
        if (typeof page !== "string") {
            page.pages?.forEach(mapPages)
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

            function findMatchedPage(page: string | Sidebar) {
                if (typeof page !== "string") {
                    page.pages?.forEach(findMatchedPage)
                    return
                }
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

async function getFrontmatter(filePath: string, chunkSize = 1024 * 5) { // 5 KB chunk
    return new Promise((resolve, reject) => {
        open(filePath, 'r', (err, fd) => {
            if (err) return reject(err);

            const buffer = Buffer.alloc(chunkSize);
            fs2.read(fd, buffer, 0, chunkSize, 0, (err, bytesRead) => {
                if (err) return reject(err);

                const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, bytesRead);
                const content = new TextDecoder('utf-8').decode(uint8Array);
                const {data: frontmatter} = matter(content); // extract frontmatter
                resolve(frontmatter);

                fs2.close(fd, () => {
                });
            });
        });
    });
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

async function getFrontmatterV2(filePath: string): Promise<FrontMatter> {
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

    const matter: FrontMatter = frontmatter

    if (reactFrontmatter) {
        if (typeof reactFrontmatter?.title === "function") {
            matter.title = {
                code: reactFrontmatter.title.toString()
            }
        }
    }

    return matter
}

async function job(page: string, frontmatters: PageFrontMatter) {
    // TODO: it can be cwd because on build time it has entire path?
    let filePath = path.join(process.cwd(), `${page}.mdx`) // TODO: support md toos
    try {
        await fs.access(filePath)
    } catch (e) {
        try {
            const mdPath = filePath.replace(".mdx", ".md")
            await fs.access(mdPath)
            filePath = mdPath
        } catch (e) {
        }
    }

    const matter = await getFrontmatterV2(filePath)

    frontmatters[page] = matter
}
