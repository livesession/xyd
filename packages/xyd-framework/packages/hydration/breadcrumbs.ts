// server-only — pure breadcrumb resolution (unit-tested in isolation).
//
// Extracted from mapSettingsToProps. Produces the FULL path from the top-level
// tab/route down to the current page, with a real `href` on every crumb that
// resolves to a navigable route (tab/route, page, or a group that declares a
// `page`). Plain groups (no route) get `href: ""` → rendered as text. The
// current page (last crumb) is never linked (handled by the UI component).

import type { Navigation, PageURL, Sidebar, MetadataMap } from "@xyd-js/core";

import type { IBreadcrumb } from "@xyd-js/ui";

type Crumb = { type: "group" | "page"; title: string; href: string; page?: string };
type TabLike = { title?: string; page?: string; href?: string; route?: string };

/** Resolve a page/route string to a link (index → "/", external passthrough,
 *  ensure leading slash). Mirrors the shared `pageLink` util. */
function linkFor(page?: string): string {
    if (!page) return "";
    if (page === "index" || page === "/index") return "/";
    if (page.startsWith("http://") || page.startsWith("https://")) return page;
    return page.startsWith("/") ? page : `/${page}`;
}

function getGroupTitle(group: any): string {
    return typeof group === "string" && group.length > 0 ? group : "";
}

function normRoute(s?: string): string {
    return (s || "").replace(/^\//, "").replace(/\/+$/, "");
}

/** Title for a route with no `group` — from the owning tab if one points at it,
 *  else the Title-Cased last segment of the route. */
function resolveRouteRoot(tabs: TabLike[] | undefined, route: string): { title: string; href: string } {
    const r = normRoute(route);
    const tab = (tabs || []).find(
        (t) => normRoute(t.page) === r || normRoute(t.href) === r || normRoute(t.route) === r,
    );
    if (tab?.title) {
        return { title: tab.title, href: linkFor(tab.page || tab.href || route) };
    }
    const seg = r.split("/").pop() || r;
    return { title: seg.charAt(0).toUpperCase() + seg.slice(1), href: linkFor(route) };
}

/** Find the path (root → current page) through the navigation tree. */
function findPathToPage(
    sidebar: any[],
    targetSlug: string,
    frontmatters: MetadataMap,
    hiddenPages: { [key: string]: boolean },
    tabs: TabLike[] | undefined,
): Crumb[] {
    const path: Crumb[] = [];

    // A nested-`pages` node is a group. Generic clickability:
    //  - named group `{ group: "X", pages }` → crumb "X", not a link (no route);
    //  - clickable named group `{ group: "X", page: "y", pages }` → crumb "X" → link;
    //  - Group Page `{ page: "y", pages }` (page instead of group) → crumb titled by
    //    the page's frontmatter → link.
    // So a group becomes a link the moment it declares a `page` — no special-casing.
    const groupCrumb = (node: any): Crumb | null => {
        if (node.group && typeof node.group === "string") {
            return { type: "group", title: node.group, href: node.page ? linkFor(node.page) : "" };
        }
        if (typeof node.page === "string") {
            return { type: "group", title: frontmatters[node.page]?.title || node.page, href: linkFor(node.page) };
        }
        return null;
    };

    function searchInNavigation(nav: any[], currentPath: Crumb[]): boolean {
        for (const item of nav) {
            if (typeof item === "string") {
                continue;
            }

            if ("route" in item) {
                if (item.pages) {
                    const newPath = [...currentPath];
                    // ALWAYS emit the route crumb (was: only when it had a `group`) so the
                    // top-level segment ("Guides") is never dropped. Label from the route's
                    // `group`, else the owning tab, else the route segment; href = the route.
                    const groupTitle = getGroupTitle(item.group);
                    if (groupTitle) {
                        newPath.push({ type: "group", title: groupTitle, href: linkFor(item.route) });
                    } else {
                        const root = resolveRouteRoot(tabs, item.route);
                        newPath.push({ type: "group", title: root.title, href: root.href });
                    }
                    if (searchInPages(item.pages, newPath)) {
                        path.push(...newPath);
                        return true;
                    }
                }
            } else {
                const newPath = [...currentPath];
                const gc = groupCrumb(item);
                if (gc) newPath.push(gc);
                if (item.pages && searchInPages(item.pages, newPath)) {
                    path.push(...newPath);
                    return true;
                }
            }
        }
        return false;
    }

    function searchInPages(pages: PageURL[], currentPath: Crumb[]): boolean {
        for (const page of pages) {
            if (typeof page === "string") {
                if (page === targetSlug && !hiddenPages[page]) {
                    currentPath.push({ type: "page", title: frontmatters[page]?.title || page, href: linkFor(page), page });
                    return true;
                }
            } else if ("virtual" in page) {
                if (page.page === targetSlug && !hiddenPages[page.page]) {
                    currentPath.push({ type: "page", title: frontmatters[page.page]?.title || page.page, href: linkFor(page.page), page: page.page });
                    return true;
                }
            } else if ("pages" in page) {
                const newPath = [...currentPath];
                const gc = groupCrumb(page);
                if (gc) newPath.push(gc);
                if (searchInPages(page.pages || [], newPath)) {
                    currentPath.length = 0;
                    currentPath.push(...newPath);
                    return true;
                }
            } else if ("page" in page && typeof page === "object") {
                const pageName = (page as { page: string }).page;
                if (pageName === targetSlug && !hiddenPages[pageName]) {
                    currentPath.push({ type: "page", title: frontmatters[pageName]?.title || pageName, href: linkFor(pageName), page: pageName });
                    return true;
                }
            }
        }
        return false;
    }

    searchInNavigation(sidebar, []);
    return path;
}

/**
 * Resolve the full breadcrumb trail for `slug`. Pure: given the navigation
 * (sidebar + tabs) and the page frontmatters, returns the crumbs top→current
 * with real hrefs where a crumb is a navigable route.
 */
export function resolveBreadcrumbs(
    navigation: Navigation | undefined,
    slug: string,
    frontmatters: MetadataMap,
    hiddenPages: { [key: string]: boolean },
): IBreadcrumb[] {
    const sidebar = (navigation?.sidebar as any[]) || [];
    const tabs = (navigation as any)?.tabs as TabLike[] | undefined;

    const path = findPathToPage(sidebar, slug, frontmatters, hiddenPages, tabs);
    if (!path.length) return [];

    const breadcrumbs: IBreadcrumb[] = [];
    for (const item of path) {
        if (item.type === "group") {
            breadcrumbs.push({ title: item.title, href: item.href });
        } else if (item.type === "page" && item.page) {
            breadcrumbs.push({ title: frontmatters[item.page]?.title || item.page, href: linkFor(item.page) });
        }
    }
    return breadcrumbs;
}
