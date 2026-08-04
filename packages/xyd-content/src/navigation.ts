import {promises as fs} from 'fs';
import path from 'path';

import React from "react";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import {VFile} from "vfile";
import {compile as mdxCompile} from "@mdx-js/mdx";

import {Metadata, Sidebar, MetadataMap, PageURL, VirtualPage} from "@xyd-js/core";

// TODO: better algorithm + data structures - since it's on build time it's not a big deal nevertheless it should be changed in the future

// pageFrontMatters gets frontmatters for given navigation
export async function pageFrontMatters(navigation: Sidebar[], pagePathMapping: {
    [key: string]: string
}): Promise<MetadataMap> {
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
        if (typeof nav === "string") {
            mapPages(nav)
            return
        }

        nav.pages?.forEach(mapPages)
    })

    await Promise.all(promises)

    // TODO: IN THE FUTURE BETTER API
    // @ts-ignore
    if (globalThis.__xydHasIndexPage) {
        await job("index", frontmatters, pagePathMapping)
    }

    return frontmatters
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

// Per-build/session frontmatter memo (S6+ W4 slice A — the "free" O(pages²)→
// O(pages) win). getFrontmatter previously ran a FULL MDX compile per page,
// and pageFrontMatters walks the ENTIRE filtered nav on every one of the N
// per-page mapSettingsToProps calls in a build — so each file was compiled
// ~N times. This caches by filePath, invalidated by mtime so a dev content
// edit (which bumps mtime) is picked up without any explicit HMR wiring.
const frontmatterCache = new Map<string, { mtimeMs: number; matter: Metadata }>()

async function getFrontmatter(filePath: string): Promise<Metadata> {
    let mtimeMs = -1
    try {
        mtimeMs = (await fs.stat(filePath)).mtimeMs
        const cached = frontmatterCache.get(filePath)
        if (cached && cached.mtimeMs === mtimeMs) {
            return cached.matter
        }
    } catch {
        // stat failed (e.g. file vanished mid-build) — fall through to the
        // readFile below, which throws the original ENOENT the caller expects.
    }

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

        // outputFormat: "program",
        // jsx: true,
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

    if (mtimeMs >= 0) {
        frontmatterCache.set(filePath, { mtimeMs, matter })
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

    // @ts-ignore TODO: IN THE FUTURE BETTER API
    if (globalThis.__xydFrontmatterNotExists && globalThis.__xydFrontmatterNotExists[pageName]) {
        return
    }

    if (!pageName || !pagePathMapping[pageName]) {
        console.log(`⚠️ "${pageName}" is defined in the docs.json navigation but the file does not exist.`)

        // @ts-ignore
        if (!globalThis.__xydFrontmatterNotExists) {
            // @ts-ignore
            globalThis.__xydFrontmatterNotExists = {}
        }

        // @ts-ignore 
        globalThis.__xydFrontmatterNotExists[pageName] = true

        return
    }

    const filePath = path.join(process.cwd(), pagePathMapping[pageName])

    const matter = await getFrontmatter(filePath)

    frontmatters[pageName] = matter
}
