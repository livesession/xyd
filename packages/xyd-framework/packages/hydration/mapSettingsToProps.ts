// server-only

import { Sidebar, MetadataMap, Settings, SidebarRoute, Metadata, PageURL } from "@xyd-js/core";
import { pageFrontMatters } from "@xyd-js/content";
import { IBreadcrumb, INavLinks } from "@xyd-js/ui";

import { FwSidebarItemProps } from "../react";

// TODO: framework vs content responsibility

// mapSettingsToProps maps @xyd-js/core settings into xyd props
export async function mapSettingsToProps(
    settings: Settings,
    pagePathMapping: { [key: string]: string },
    slug: string,
    frontmatters?: MetadataMap
): Promise<{
    groups: FwSidebarItemProps[],
    breadcrumbs: IBreadcrumb[]
    navlinks?: INavLinks
    hiddenPages?: { [key: string]: boolean }
    metadata?: Metadata | null
}> {
    let uniqIndex = 0
    let filteredNav = filterNavigation(settings, slug)
    if (!frontmatters) {
        frontmatters = await pageFrontMatters(filteredNav, pagePathMapping) as MetadataMap
    }

    const slugFrontmatter = frontmatters[slug] || null
    let navlinks: INavLinks | undefined = undefined

    const hiddenPages = Object.keys(frontmatters).reduce((acc, page) => {
        if (frontmatters[page].hidden) {
            acc[page] = true
        }

        return acc
    }, {})

    // Build breadcrumbs by finding the path to the current page
    const breadcrumbs = buildBreadcrumbs(filteredNav, slug, frontmatters, hiddenPages)

    function mapItems(
        page: PageURL,
        currentNav: Sidebar,
        nav: Sidebar[]
    ) {
        if (!frontmatters) {
            console.error("frontmatters not found")
            return null
        }

        if (typeof page !== "string" && !("virtual" in page)) {
            const items = page.pages
                ?.map((p) => mapItems(p, page, nav))
                ?.filter(Boolean)

            return {
                title: page.group,
                group: page.group === false ? false : undefined,
                href: "",
                active: false,
                uniqIndex: uniqIndex++,
                icon: page.icon,
                items,
            }
        }
        let pageName = ""
        if (typeof page === "string") {
            pageName = page
        } else {
            pageName = page.page
        }

        if (hiddenPages[pageName]) {
            return null
        }

        const matterTitle = frontmatters && frontmatters[pageName] && frontmatters[pageName].title

        let title = ""

        if (typeof matterTitle === "string") {
            title = matterTitle
        } else {
            // @ts-ignore
            title = matterTitle
        }

        if (!title) {
            console.debug(`⚠️ Title not found for page "${pageName}"`)
        }

        const meta = frontmatters[pageName]

        // TODO: better data structures - for example flat array of filtered nav
        if (slugFrontmatter && (slugFrontmatter === meta)) {
            const nlinks = mapNavToLinks(pageName, currentNav, nav, frontmatters, hiddenPages)

            if (nlinks) {
                navlinks = nlinks
            }
        }

        return {
            title,
            href: safePageLink(pageName),
            active: false,
            uniqIndex: uniqIndex++,
            icon: meta?.icon || "",
            sidebarTitle: meta?.sidebarTitle || "",
            url: meta?.url || "",
            pageMeta: meta || null,
        }
    }

    function sidebarItems(
        nav: Sidebar,
        pages: PageURL[],
    ) {
        const items = (pages?.map((p) => mapItems(p, nav, filteredNav)) || [])
            .filter(Boolean)

        return {
            group: nav.group,
            icon: nav?.icon,
            items
        } as FwSidebarItemProps
    }

    const flatItems: string[] = []

    const groups = filteredNav
        .map((nav) => {
            if (typeof nav === "string") {
                flatItems.push(nav)

                return
            }

            // TODO: finish
            if (typeof nav !== "string" && "route" in nav) {
                if (nav.pages?.length) {
                    const items = (nav.pages?.map((p) => mapItems(p, nav, filteredNav)) || [])
                        .filter(Boolean)

                    return {
                        items
                    } as FwSidebarItemProps
                }

                return {
                    group: "",
                    items: [],
                    groupIndex: 0,
                } as FwSidebarItemProps
            }

            return sidebarItems(nav, nav.pages || [])
        }).filter(Boolean) as FwSidebarItemProps[] || []

    if (flatItems.length) {
        const items = sidebarItems({}, flatItems)
        if (items) {
            groups.unshift(items)
        }
    }

    return {
        groups,
        breadcrumbs,
        navlinks,
        hiddenPages,
        metadata: slugFrontmatter
    }
}

function filterNavigation(settings: Settings, slug: string): Sidebar[] {
    const sidebarItems: Sidebar[] = []

    let multiSidebarMatch: SidebarRoute | null = null
    let foundRoute = false

    function findRoute(sidebar: Sidebar | SidebarRoute | string) {
        if (typeof sidebar === "string") {
            return
        }

        if ("route" in sidebar) {
            const sideMatch = normalizeHref(sidebar.route)
            const normalizeSlug = normalizeHref(slug)

            // TODO: startWith is not enough e.g `/docs/apps/buildISSUE` if `/docs/apps/build`
            if (normalizeSlug.startsWith(sideMatch)) {
                if (multiSidebarMatch) {
                    const findByMatchLvl = multiSidebarMatch.route.split("/").length
                    const urlMatchLvl = sideMatch.split("/").length

                    if (urlMatchLvl > findByMatchLvl) {
                        if (!foundRoute) {
                            foundRoute = true
                            sidebarItems.length = 0
                        }

                        multiSidebarMatch = sidebar
                    }
                } else {
                    if (!foundRoute) {
                        foundRoute = true
                        sidebarItems.length = 0
                    }

                    multiSidebarMatch = sidebar
                }
            }

            if ("pages" in sidebar && sidebar.pages?.length) {
                for (const page of sidebar.pages) {
                    findRoute(page)
                }
            }
        }

        return
    }

    // First pass: find if current route matches any route-based navigation
    settings?.navigation?.sidebar.forEach(sidebar => {
        if (typeof sidebar !== "string" && "route" in sidebar) {
            findRoute(sidebar)
        }
    })

    // If current route matches a route-based navigation, only process that
    if (foundRoute && multiSidebarMatch != null) {
        const side = multiSidebarMatch as SidebarRoute
        sidebarItems.push(...(side?.pages || []))
        return sidebarItems
    }

    // Otherwise, process flat pages and regular sidebar items
    const flatPages: string[] = []
    
    settings?.navigation?.sidebar.forEach(sidebar => {
        if (typeof sidebar === "string") {
            flatPages.push(sidebar)
        } else if (!("route" in sidebar)) {
            sidebarItems.push(sidebar)
        }
        // Skip route-based items if they don't match current route
    })

    // Handle flat pages if we have any
    if (flatPages.length > 0) {
        sidebarItems.push({
            pages: flatPages
        })
    }

    return sidebarItems
}

// TODO: rename this because it's no longer 'navigation' because it returns breadcrumbs, sidebar and nextlinks props
// TODO: breadcrumbs and frontmatters as content plugins?
// TODO: idea - calculate breadcrumbs and navlinks near server-side component?

function normalizeHrefCheck(first: string, second: string) {
    if (first.startsWith("/")) {
        first = first.slice(1)
    }

    if (second.startsWith("/")) {
        second = second.slice(1)
    }

    return first === second
}

function normalizeHref(href: string) {
    if (href.startsWith("/")) {
        return href
    }

    return `/${href}`
}

function safePageLink(page: string): string {
    return page?.startsWith("/") ? page : `/${page}`
}

// TODO: support next-prev for different 'groups' levels
function mapNavToLinks(
    page: string,
    currentNav: Sidebar,
    nav: Sidebar[],
    frontmatters: MetadataMap,
    hiddenPages: { [key: string]: boolean }
): INavLinks | undefined {
    // Flatten all pages from all groups to find the sequence
    const allPages: Array<{ page: string, group: string, groupIndex: number, pageIndex: number }> = []

    nav.forEach((group, groupIndex) => {
        if (typeof group === "string") {
            allPages.push({
                page: group,
                group: "",
                groupIndex,
                pageIndex: groupIndex,
            })
            return
        }
        if (group.pages) {
            group.pages.forEach((pageItem, pageIndex) => {
                let pageName = ""
                if (typeof pageItem === "string") {
                    pageName = pageItem
                } else if ("virtual" in pageItem) {
                    pageName = pageItem.page
                } else if ("pages" in pageItem) {
                    // This is a nested Sidebar, use BFS to resolve all pages
                    const resolvedPages = findResolvedPagesBFS(pageItem)
                    if (resolvedPages.length > 0) {
                        // Add all resolved pages to the allPages array
                        resolvedPages.forEach((resolvedPage, resolvedIndex) => {
                            if (!hiddenPages[resolvedPage]) {
                                allPages.push({
                                    page: resolvedPage,
                                    group: group.group || "",
                                    groupIndex,
                                    pageIndex: pageIndex + resolvedIndex
                                })
                            }
                        })
                        // Skip adding the original nested sidebar since we've added all its resolved pages
                        return
                    }
                } else if ("page" in pageItem && typeof pageItem === "object") {
                    // This is a VirtualPage object with page property
                    pageName = (pageItem as { page: string }).page
                }

                if (pageName && !hiddenPages[pageName]) {
                    allPages.push({
                        page: pageName,
                        group: group.group || "",
                        groupIndex,
                        pageIndex
                    })
                }
            })
        }
    })

    // Find current page in the flattened list
    const currentPageIndex = allPages.findIndex(p => p.page === page)

    if (currentPageIndex === -1) {
        return undefined
    }

    // Get previous and next pages
    const prevPage = allPages[currentPageIndex - 1]
    const nextPage = allPages[currentPageIndex + 1]

    let prevLink
    let nextLink

    if (prevPage) {
        const prevTitle = frontmatters[prevPage.page]?.title || prevPage.page
        if (typeof prevTitle === "string") {
            prevLink = {
                title: prevTitle,
                href: safePageLink(prevPage.page),
            }
        }
    }

    if (nextPage) {
        const nextTitle = frontmatters[nextPage.page]?.title || nextPage.page
        if (typeof nextTitle === "string") {
            nextLink = {
                title: nextTitle,
                href: safePageLink(nextPage.page),
            }
        }
    }

    return {
        prev: prevLink || undefined,
        next: nextLink || undefined,
    }
}


// BFS algorithm to resolve all pages in a nested Sidebar structure
function findResolvedPagesBFS(sidebar: Sidebar): string[] {
    if (!sidebar.pages || sidebar.pages.length === 0) {
        return []
    }

    const resolvedPages: string[] = []
    const queue: PageURL[] = [...sidebar.pages]

    while (queue.length > 0) {
        const current = queue.shift()!

        if (typeof current === "string") {
            resolvedPages.push(current)
        } else if ("virtual" in current) {
            resolvedPages.push(current.page)
        } else if ("page" in current && typeof current === "object") {
            resolvedPages.push((current as { page: string }).page)
        } else if ("pages" in current && current.pages) {
            // Add all pages from this nested sidebar to the queue
            queue.push(...current.pages)
        }
    }

    return resolvedPages
}

// Helper function to safely get group title
function getGroupTitle(group: any): string {
    return (typeof group === 'string' && group.length > 0) ? group : ''
}

// Build breadcrumbs by finding the path to the current page
function buildBreadcrumbs(
    navigation: Sidebar[],
    currentSlug: string,
    frontmatters: MetadataMap,
    hiddenPages: { [key: string]: boolean }
): IBreadcrumb[] {
    const breadcrumbs: IBreadcrumb[] = []

    // Find the path to the current page
    const path = findPathToPage(navigation, currentSlug, frontmatters, hiddenPages)
    if (!path?.length) {
        return []
    }

    for (const item of path) {
        if (item.type === 'group') {
            breadcrumbs.push({
                title: item.title,
                href: item.href
            })
        } else if (item.type === 'page' && item.page) {
            const pageTitle = frontmatters[item.page]?.title || item.page
            breadcrumbs.push({
                title: pageTitle,
                href: safePageLink(item.page)
            })
        }
    }

    return breadcrumbs
}

// Find the path from root to the current page
function findPathToPage(
    navigation: Sidebar[],
    targetSlug: string,
    frontmatters: MetadataMap,
    hiddenPages: { [key: string]: boolean }
): Array<{ type: 'group' | 'page', title: string, href: string, page?: string }> {
    const path: Array<{ type: 'group' | 'page', title: string, href: string, page?: string }> = []

    function searchInNavigation(nav: Sidebar[], currentPath: Array<{ type: 'group' | 'page', title: string, href: string, page?: string }>): boolean {
        for (const item of nav) {
            if (typeof item === "string") {
                path.push(item)
                return false
            }

            if ("route" in item) {
                // Handle route-based navigation
                if (item.pages) {
                    const newPath = [...currentPath]
                    if (item.group && typeof item.group === 'string' && item.group.length > 0) {
                        newPath.push({
                            type: 'group',
                            title: getGroupTitle(item.group),
                            href: (item.route as string) || ""
                        })
                    }

                    if (searchInPages(item.pages, newPath)) {
                        path.push(...newPath)
                        return true
                    }
                }
            } else {
                // Handle regular sidebar navigation
                const newPath = [...currentPath]
                if (item.group && typeof item.group === 'string') {
                    newPath.push({
                        type: 'group',
                        title: item.group,
                        href: ""
                    })
                }

                if (item.pages && searchInPages(item.pages, newPath)) {
                    path.push(...newPath)
                    return true
                }
            }
        }
        return false
    }

    function searchInPages(pages: PageURL[], currentPath: Array<{ type: 'group' | 'page', title: string, href: string, page?: string }>): boolean {
        for (const page of pages) {
            if (typeof page === "string") {
                if (page === targetSlug && !hiddenPages[page]) {
                    currentPath.push({
                        type: 'page',
                        title: frontmatters[page]?.title || page,
                        href: safePageLink(page),
                        page: page
                    })
                    return true
                }
            } else if ("virtual" in page) {
                if (page.page === targetSlug && !hiddenPages[page.page]) {
                    currentPath.push({
                        type: 'page',
                        title: frontmatters[page.page]?.title || page.page,
                        href: safePageLink(page.page),
                        page: page.page
                    })
                    return true
                }
            } else if ("pages" in page) {
                // Nested sidebar - only add to path if we find the target in this branch
                const newPath = [...currentPath]
                if (page.group && typeof page.group === 'string') {
                    newPath.push({
                        type: 'group',
                        title: page.group,
                        href: ""
                    })
                }

                if (searchInPages(page.pages || [], newPath)) {
                    // Replace current path with the new path that includes the group
                    currentPath.length = 0
                    currentPath.push(...newPath)
                    return true
                }
            } else if ("page" in page && typeof page === "object") {
                const pageName = (page as { page: string }).page
                if (pageName === targetSlug && !hiddenPages[pageName]) {
                    currentPath.push({
                        type: 'page',
                        title: frontmatters[pageName]?.title || pageName,
                        href: safePageLink(pageName),
                        page: pageName
                    })
                    return true
                }
            }
        }
        return false
    }

    searchInNavigation(navigation, [])
    return path
}