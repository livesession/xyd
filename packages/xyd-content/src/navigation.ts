import {promises as fs} from 'fs';
import path from 'path';

import React from "react";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import {VFile} from "vfile";
import {compile as mdxCompile} from "@mdx-js/mdx";

import {Metadata, Sidebar, MetadataMap, PageURL, VirtualPage} from "@xyd-js/core";

import {native} from "./native";

// TODO: better algorithm + data structures - since it's on build time it's not a big deal nevertheless it should be changed in the future

// pageFrontMatters gets frontmatters for given navigation
export async function pageFrontMatters(navigation: Sidebar[], pagePathMapping: {
    [key: string]: string
}): Promise<MetadataMap> {
    const frontmatters: MetadataMap = {}

    // Collect the (pageName → filePath) jobs first so the native fast path can
    // batch them into ONE call (S6+ W4 slice B). The missing-file bookkeeping
    // (__xydFrontmatterNotExists warning) stays here, byte-for-byte with the
    // per-page job() it replaces.
    const jobs: { pageName: string; filePath: string }[] = []

    // `{ page?: string }` covers the plain `{ page, title }` entry alongside the
    // virtual-page form; only `.page` is ever read off the object here.
    // `mayLackMarkdown`: an entry carrying its own title/icon is the documented way
    // to label a route with no markdown behind it (a generated API reference, say),
    // so a missing file is the expected case there, not an authoring mistake. It
    // still records the miss — it just doesn't accuse the author of one.
    function collect(page: string | VirtualPage | { page?: string }, mayLackMarkdown = false) {
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
            // Leave no trace for these: the memo below is consulted BEFORE the mapping
            // check, and the static-build path never resets it. Recording a miss here
            // would permanently block the slug for the rest of the process, including
            // later passes that CAN resolve it (mapSettingsToProps augments the mapping
            // with asToc sections and hosts) — costing that page its title, its icon,
            // and, for a hidden page, its hiding. Order-dependent and near-impossible
            // to trace back, so simply don't record it.
            if (mayLackMarkdown) {
                return
            }

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

        jobs.push({ pageName, filePath: path.join(process.cwd(), pagePathMapping[pageName]) })
    }

    function mapPages(page: PageURL) {
        if (typeof page !== "string") {
            if ("virtual" in page) {
                collect(page)
            } else if ("pages" in page) {
                page.pages?.forEach(mapPages)
            } else if ("page" in page) {
                // A `{ page, title }` / `{ page, icon }` entry: same target as the
                // bare-string form, just carrying overrides. Without this it fell
                // through uncollected, so the page kept its explicit label but lost
                // everything else frontmatter supplies — icon, sidebarTitle, url.
                collect(page, true)
            }
            return
        }

        collect(page)
    }

    navigation.forEach((nav: Sidebar) => {
        if (typeof nav === "string") {
            mapPages(nav)
            return
        }

        nav.pages?.forEach(mapPages)
    })

    // TODO: IN THE FUTURE BETTER API
    // @ts-ignore
    if (globalThis.__xydHasIndexPage) {
        collect("index")
    }

    await resolveJobs(jobs, frontmatters)

    return frontmatters
}

// resolveJobs fills `frontmatters[pageName]` for each job. The native fast path
// (crates/xyd_frontmatter) parses the YAML frontmatter blocks in one batch —
// replacing the per-page @mdx-js/mdx compile — with a per-filePath+mtime memo
// so the N mapSettingsToProps calls in a build don't re-parse. Files the fast
// path defers (a YAML-1.1-vs-1.2 scalar divergence) or that it can't classify
// fall through to the JS MDX compile, so parity is exact.
async function resolveJobs(
    jobs: { pageName: string; filePath: string }[],
    frontmatters: MetadataMap
) {
    // Serve memo hits first; only the misses need work.
    const misses: { pageName: string; filePath: string; mtimeMs: number }[] = []
    for (const j of jobs) {
        let mtimeMs = -1
        try {
            mtimeMs = (await fs.stat(j.filePath)).mtimeMs
            const cached = frontmatterCache.get(j.filePath)
            if (cached && cached.mtimeMs === mtimeMs) {
                frontmatters[j.pageName] = cached.matter
                continue
            }
        } catch {
            // stat failed — let the resolver below surface the original error.
        }
        misses.push({ ...j, mtimeMs })
    }

    if (native?.frontmatterBatch && misses.length) {
        const batch: Record<string, { status: string; frontmatter?: Metadata }> = JSON.parse(
            native.frontmatterBatch(JSON.stringify(misses.map((m) => m.filePath)))
        )
        const jsFallback: typeof misses = []
        for (const m of misses) {
            const entry = batch[m.filePath]
            if (entry?.status === "ok" && entry.frontmatter) {
                frontmatters[m.pageName] = entry.frontmatter
                if (m.mtimeMs >= 0) frontmatterCache.set(m.filePath, { mtimeMs: m.mtimeMs, matter: entry.frontmatter })
            } else if (entry?.status === "throw") {
                // Match getFrontmatter's throw on missing/empty frontmatter.
                throw new Error(`Frontmatter not found in ${m.filePath}`)
            } else {
                // "fallback" (1.1/1.2 divergence) or "missing" (race) → JS path.
                jsFallback.push(m)
            }
        }
        await Promise.all(jsFallback.map((m) => resolveViaMdx(m, frontmatters)))
        return
    }

    // No native core — the JS MDX path for every miss.
    await Promise.all(misses.map((m) => resolveViaMdx(m, frontmatters)))
}

async function resolveViaMdx(
    m: { pageName: string; filePath: string; mtimeMs: number },
    frontmatters: MetadataMap
) {
    const matter = await getFrontmatter(m.filePath)
    frontmatters[m.pageName] = matter
    if (m.mtimeMs >= 0) frontmatterCache.set(m.filePath, { mtimeMs: m.mtimeMs, matter })
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

// Per-build/session frontmatter memo (S6+ W4). getFrontmatter runs a FULL MDX
// compile per page (the JS fallback for files the native fast path defers), and
// pageFrontMatters walks the ENTIRE filtered nav on every one of the N per-page
// mapSettingsToProps calls in a build. resolveJobs caches by filePath,
// invalidated by mtime (so a dev content edit is picked up without HMR wiring),
// so both the native and MDX paths compute each file at most once per edit.
const frontmatterCache = new Map<string, { mtimeMs: number; matter: Metadata }>()

// getFrontmatter is the JS MDX-compile path: the fidelity reference the native
// fast path is validated against, and the fallback for files it defers. Memo
// management lives in resolveJobs/resolveViaMdx.
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

    return matter
}
