import fs from "fs/promises"

import matter from "gray-matter"

// ---------------------------------------------------------------------------
// sidebar-as-TOC composition (`asToc: true` sidebar groups)
//
// The data plane (globalThis.__xydAsTocPages, owned by @xyd-js/plugin-docs)
// records which section files compose into which host page. This module turns
// that recipe into ONE raw markdown string: the host's own intro (if it has an
// index file) followed by every section wrapped in an anchor container:
//
//   <div id="<sectionId>" data-astoc-section>
//
//   …section markdown (frontmatter stripped)…
//
//   </div>
//
// The wrapper ids are what the sidebar items scroll to — deterministic and
// independent of heading slugs (which can collide across sections). Both page
// loaders (vite + bun) call composeAsTocRaw() first and fall through to the
// normal single-file compile when it returns null.
// ---------------------------------------------------------------------------

interface AsTocSectionLike {
    page: string
    file: string
    id: string
}

interface AsTocHostLike {
    indexFile: string
    sections: AsTocSectionLike[]
}

interface AsTocPagesLike {
    hosts: Record<string, AsTocHostLike>
    pages: Record<string, { host: string, id: string }>
}

function asTocPages(): AsTocPagesLike | undefined {
    return (globalThis as any).__xydAsTocPages
}

/** Normalized host lookup ("" / "/" → "index"). */
export function asTocHostFor(slug: string): AsTocHostLike | null {
    const key = slug?.replace(/^\//, "") || "index"
    return asTocPages()?.hosts?.[key] || null
}

/** True when `slug` is a section page of an asToc group (⇒ not routable). */
export function isAsTocSectionPage(slug: string): boolean {
    const key = slug?.replace(/^\//, "") || ""
    return !!asTocPages()?.pages?.[key]
}

export interface ComposedAsToc {
    /** the full composed markdown (frontmatter + intro + wrapped sections) */
    raw: string
    /** path to compile against (host intro file, or a synthetic index.md) */
    filePath: string
}

/**
 * Compose the raw markdown for an asToc host page, or null when `slug` is not
 * a host. The composed frontmatter always carries `asTocHost: true` so the
 * post-mount metadata source hides the right-hand TOC too. Sections whose file
 * vanished since boot are skipped (dev resilience). A section without a
 * leading `#` heading gets one injected from its frontmatter title so every
 * section stays visible/scannable in the composed page.
 */
export async function composeAsTocRaw(slug: string): Promise<ComposedAsToc | null> {
    const host = asTocHostFor(slug)
    if (!host || !host.sections.length) return null

    let intro = ""
    let frontmatter: Record<string, any> = {}
    if (host.indexFile) {
        try {
            const parsed = matter(await fs.readFile(host.indexFile, "utf-8"))
            frontmatter = { ...(parsed.data || {}) }
            intro = parsed.content.trim()
        } catch {
            // treat as no intro
        }
    }
    frontmatter.asTocHost = true

    const parts: string[] = []
    for (const section of host.sections) {
        let parsed: matter.GrayMatterFile<string>
        try {
            parsed = matter(await fs.readFile(section.file, "utf-8"))
        } catch {
            continue
        }
        let body = parsed.content.trim()
        const title = parsed.data?.title
        if (typeof title === "string" && title && !body.startsWith("#")) {
            body = `# ${title}\n\n${body}`
        }
        parts.push(`\n\n<div id="${section.id}" data-astoc-section>\n\n${body}\n\n</div>\n`)
    }

    if (!parts.length && !intro) return null

    // matter.stringify emits `---\n<yaml>\n---\n<content>`
    const raw = matter.stringify(intro, frontmatter) + parts.join("")

    return {
        raw,
        filePath: host.indexFile || "index.md",
    }
}
