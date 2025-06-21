// server-only

import { Sidebar, MetadataMap, Settings, SidebarRoute, Metadata, PageURL } from "@xyd-js/core";
import { pageFrontMatters } from "@xyd-js/content";
import { IBreadcrumb, INavLinks } from "@xyd-js/ui";

import { FwSidebarGroupProps } from "../react";

// TODO: framework vs content responsibility

// mapSettingsToProps maps @xyd-js/core settings into xyd props
export async function mapSettingsToProps(
    settings: Settings,
    pagePathMapping: { [key: string]: string },
    slug: string,
    frontmatters?: MetadataMap
): Promise<{
    groups: FwSidebarGroupProps[],
    breadcrumbs: IBreadcrumb[]
    navlinks?: INavLinks
    hiddenPages?: { [key: string]: boolean }
    metadata?: Metadata | null
}> {
    let uniqIndex = 0
    const filteredNav = filterNavigation(settings, slug)
    if (!frontmatters) {
        frontmatters = await pageFrontMatters(filteredNav, pagePathMapping) as MetadataMap
    }

    const slugFrontmatter = frontmatters[slug] || null
    const breadcrumbs: IBreadcrumb[] = []
    let navlinks: INavLinks | undefined = undefined

    const hiddenPages = Object.keys(frontmatters).reduce((acc, page) => {
        if (frontmatters[page].hidden) {
            acc[page] = true
        }

        return acc
    }, {})

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

            if (items?.find(item => normalizeHrefCheck(item.href, slug))) {
                breadcrumbs.unshift({
                    title: page.group || "",
                    href: "", // TODO:
                })
            }

            return {
                title: page.group,
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

            if (currentNav.group) {
                breadcrumbs.push({
                    title: currentNav.group,
                    href: "", // TODO:
                })
            }
            breadcrumbs.push({
                // @ts-ignore
                title,
                href: pageName,
            })
        }

        return {
            title,
            href: safePageLink(pageName),
            active: false,
            uniqIndex: uniqIndex++,
            icon: meta?.icon || "",
            sidebarTitle: meta?.sidebarTitle || "",
            pageMeta: meta || null,
        }
    }

    const groups = filteredNav
        .map((nav) => {
            // TODO: finish
            if ("route" in nav) {
                if (nav.pages?.length) {
                    const items = (nav.pages?.map((p) => mapItems(p, nav, filteredNav)) || [])
                        .filter(Boolean)

                    return {
                        items
                    } as FwSidebarGroupProps
                }

                return {
                    group: "",
                    items: [],
                    groupIndex: 0,
                } as FwSidebarGroupProps
            }

            const items = (nav.pages?.map((p) => mapItems(p, nav, filteredNav)) || [])
                .filter(Boolean)

            return {
                group: nav.group,
                icon: nav?.icon,
                items
            } as FwSidebarGroupProps
        }) || []

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

    let flatPagesOnly = false

    function findRoute(sidebar: Sidebar | SidebarRoute) {
        if ("route" in sidebar) {
            const sideMatch = normalizeHref(sidebar.route)
            const normalizeSlug = normalizeHref(slug)

            // TODO: startWith is not enough e.g `/docs/apps/buildISSUE` if `/docs/apps/build`
            if (normalizeSlug.startsWith(sideMatch)) {
                if (multiSidebarMatch) {
                    const findByMatchLvl = multiSidebarMatch.route.split("/").length
                    const urlMatchLvl = sideMatch.split("/").length

                    if (urlMatchLvl > findByMatchLvl) {
                        multiSidebarMatch = sidebar
                    }
                } else {
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

    settings?.navigation?.sidebar.filter(sidebar => {
        if (flatPagesOnly) {
            return
        }
        if (typeof sidebar === "string") {
            flatPagesOnly = true
            return
        }

        if ("route" in sidebar) {
            findRoute(sidebar)

            return
        }

        sidebarItems.push(sidebar)
    })

    if (multiSidebarMatch != null) {
        const side = multiSidebarMatch as SidebarRoute
        sidebarItems.push(...(side?.pages || []))
    }

    if (flatPagesOnly) {
        sidebarItems.push({
            pages: settings?.navigation?.sidebar as string[]
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
    if (!currentNav.group) {
        console.debug("current nav need group to calculate navlinks")
        return
    }

    // Flatten all pages from all groups to find the sequence
    const allPages: Array<{ page: string, group: string, groupIndex: number, pageIndex: number }> = []
    
    nav.forEach((group, groupIndex) => {
        if (group.pages) {
            group.pages.forEach((pageItem, pageIndex) => {
                let pageName = ""
                if (typeof pageItem === "string") {
                    pageName = pageItem
                } else if ("virtual" in pageItem) {
                    pageName = pageItem.virtual
                } else if ("pages" in pageItem) {
                    // This is a nested Sidebar, skip for now as it's not supported
                    return
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
