import fs from "fs";
import path from "path";

import type { Navigation, PageURL, Sidebar, SidebarRoute, ResolvedAsTocOptions } from "@xyd-js/core";
import { asTocOptions } from "@xyd-js/core";

// ---------------------------------------------------------------------------
// sidebar-as-TOC (`asToc: true` sidebar groups)
//
// Pages of an `asToc` group are NOT real pages: they get no route/prerender —
// instead their markdown is injected as sections into the enclosing route's
// index page (the "host"), and the sidebar items scroll-spy over those
// sections. This module is the data plane: a cheap pure-JS walk (run for both
// engines, native pagemap or not) that mirrors the pagemap traversal and
// records which pages compose into which host.
// ---------------------------------------------------------------------------

export interface AsTocSection {
    /** the sidebar page reference, e.g. "operating-systems/linux" */
    page: string;
    /** resolved cwd-relative file with extension, e.g. "operating-systems/linux.md" */
    file: string;
    /** deterministic section anchor id (page path with "/" → "-") */
    id: string;
}

export interface AsTocHost {
    /** the host's own intro file ("index.md" / "<route>.md"), "" when none exists */
    indexFile: string;
    /** sections in sidebar walk order (across ALL asToc groups sharing the host) */
    sections: AsTocSection[];
}

export interface AsTocPages {
    /** host slug (e.g. "index", "docs") → composition recipe */
    hosts: Record<string, AsTocHost>;
    /**
     * section page slug → its host + anchor id (for hrefs, 404s, exclusions)
     * + the owning group's RESOLVED behavior options (indicator/breadcrumbs).
     */
    pages: Record<string, { host: string; id: string } & ResolvedAsTocOptions>;
}

declare global {
    // Set at pluginDocs() boot; read by mapSettingsToProps (hrefs/titles/
    // navlinks), the page loaders (composition + 404), docPaths and search
    // (exclusions). Absent when no asToc groups are configured.
    var __xydAsTocPages: AsTocPages | undefined;
}

/** Section anchor id for a sidebar page reference — heading-independent. */
export function sectionIdFor(page: string): string {
    return page.replace(/^\.?\//, "").replace(/\//g, "-");
}

export interface CollectAsTocOptions {
    /** base dir for file probes (default process.cwd()) */
    cwd?: string;
    /** i18n locale prefix (e.g. "pl/") for the top-level host slug */
    hostPrefix?: string;
    /** injectable existence probe for tests */
    exists?: (relPath: string) => boolean;
}

/**
 * Walk a navigation tree (already i18n-prefixed, same as the pagemap walk) and
 * collect every `asToc: true` group's pages, grouped by their host page:
 * `"<hostPrefix>index"` for top-level groups, the route slug for groups under a
 * `SidebarRoute`. Only STRING pages become sections (virtual/component entries
 * inside asToc groups are ignored); missing files are silently skipped —
 * parity with the pagemap walk. Nested groups inside an asToc group contribute
 * their string pages too (the whole subtree is non-routable).
 */
export function collectAsTocPages(
    navigation: Navigation | undefined,
    options: CollectAsTocOptions = {}
): AsTocPages {
    const cwd = options.cwd || process.cwd();
    const hostPrefix = options.hostPrefix || "";
    const exists = options.exists || ((rel: string) => fs.existsSync(path.join(cwd, rel)));

    const result: AsTocPages = { hosts: {}, pages: {} };

    function existingFilePath(basePath: string): string | null {
        const md = `${basePath}.md`;
        if (exists(md)) return md;
        const mdx = `${basePath}.mdx`;
        if (exists(mdx)) return mdx;
        return null;
    }

    function hostFor(hostSlug: string): AsTocHost {
        let host = result.hosts[hostSlug];
        if (!host) {
            // The host's own intro file sits at the host slug itself
            // ("index.md" at root, "docs.md" for route "/docs").
            host = { indexFile: existingFilePath(hostSlug) || "", sections: [] };
            result.hosts[hostSlug] = host;
        }
        return host;
    }

    /** Collect every descendant string page of an asToc group as sections. */
    function collectGroup(pages: PageURL[] | undefined, hostSlug: string, opts: ResolvedAsTocOptions) {
        for (const page of pages || []) {
            if (typeof page === "string") {
                const file = existingFilePath(page);
                if (!file) continue;
                const id = sectionIdFor(page);
                hostFor(hostSlug).sections.push({ page, file, id });
                result.pages[page] = { host: hostSlug, id, ...opts };
            } else if (page && typeof page === "object" && "pages" in page) {
                collectGroup((page as Sidebar).pages, hostSlug, opts);
            }
            // virtual/component entries: not composable — ignored (v1)
        }
    }

    /** Walk non-asToc pages looking for nested asToc groups. */
    function findNested(pages: PageURL[] | undefined, hostSlug: string) {
        for (const page of pages || []) {
            if (!page || typeof page !== "object" || !("pages" in page)) continue;
            const group = page as Sidebar;
            const opts = asTocOptions(group.asToc);
            if (opts) {
                collectGroup(group.pages, hostSlug, opts);
            } else {
                findNested(group.pages, hostSlug);
            }
        }
    }

    const topHost = `${hostPrefix}index`;

    for (const entry of navigation?.sidebar || []) {
        if (typeof entry === "string") continue; // flat-only sidebars have no groups
        if (!entry || typeof entry !== "object") continue;

        if ("pages" in entry && "route" in entry) {
            // SidebarRoute — host is the route slug itself.
            const route = (entry as SidebarRoute).route || "";
            const routeHost = route.replace(/^\//, "").replace(/\/$/, "") || topHost;
            for (const item of (entry as SidebarRoute).pages || []) {
                if (!item || typeof item !== "object" || !("pages" in item)) continue;
                const group = item as Sidebar;
                const opts = asTocOptions(group.asToc);
                if (opts) {
                    collectGroup(group.pages, routeHost, opts);
                } else {
                    findNested(group.pages, routeHost);
                }
            }
        } else if ("pages" in entry) {
            const group = entry as Sidebar;
            const opts = asTocOptions(group.asToc);
            if (opts) {
                collectGroup(group.pages, topHost, opts);
            } else {
                findNested(group.pages, topHost);
            }
        }
    }

    // Drop hosts that ended up with no sections (all files missing).
    for (const [slug, host] of Object.entries(result.hosts)) {
        if (!host.sections.length) delete result.hosts[slug];
    }

    return result;
}

/** Merge locale-scoped collections into one (boot merges per-language walks). */
export function mergeAsTocPages(target: AsTocPages, source: AsTocPages): AsTocPages {
    for (const [slug, host] of Object.entries(source.hosts)) {
        const existing = target.hosts[slug];
        if (existing) {
            existing.sections.push(...host.sections);
            if (!existing.indexFile) existing.indexFile = host.indexFile;
        } else {
            target.hosts[slug] = host;
        }
    }
    Object.assign(target.pages, source.pages);
    return target;
}

/** Flat `sectionSlug → file` map — merged into frontmatter lookups for titles. */
export function asTocFileMap(asTocPages: AsTocPages | undefined): Record<string, string> {
    const map: Record<string, string> = {};
    for (const host of Object.values(asTocPages?.hosts || {})) {
        for (const s of host.sections) map[s.page] = s.file;
    }
    return map;
}
