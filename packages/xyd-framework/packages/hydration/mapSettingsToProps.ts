// server-only

import { Sidebar, MetadataMap, Settings, SidebarRoute, Metadata, PageURL } from "@xyd-js/core";
import { filterNavigationByLevels, pageFrontMatters } from "@xyd-js/content";
import { IBreadcrumb, INavLinks } from "@xyd-js/ui";

import { FwSidebarGroupProps } from "../react";

// TODO: framework vs content responsibility

// mapSettingsToProps maps @xyd-js/core settings into xyd props
export async function mapSettingsToProps(
    settings: Settings,
    slug: string
): Promise<{
    groups: FwSidebarGroupProps[],
    breadcrumbs: IBreadcrumb[]
    navlinks?: INavLinks
    hiddenPages?: { [key: string]: boolean }
    metadata?: Metadata | null
}> {
    let uniqIndex = 0
    const filteredNav = filterNavigation(settings, slug)
    const frontmatters = await pageFrontMatters(filteredNav) as MetadataMap

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
            console.error("Title not found for page", pageName)
        }

        // TODO: better data structures - for example flat array of filtered nav
        if (slugFrontmatter && (slugFrontmatter === frontmatters[pageName])) {
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
        }
    }

    const groups = filteredNav
        .map((nav) => {
            // TODO: finish
            if ("route" in nav) {
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

    settings?.navigation?.sidebar.filter(sidebar => {
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

            return
        }

        // TODO: better algorithm
        const ok = filterNavigationByLevels(settings?.navigation?.header || [], slug)(sidebar)

        if (ok) {
            sidebarItems.push(sidebar)
        }
    })

    if (multiSidebarMatch != null) {
        const side = multiSidebarMatch as SidebarRoute
        sidebarItems.push(...side.items)
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
    page: string | Sidebar,
    currentNav: Sidebar,
    nav: Sidebar[],
    frontmatters: MetadataMap,
    hiddenPages: { [key: string]: boolean }
): INavLinks | undefined {
    if (!currentNav.group) {
        console.error("current nav need group to calculate navlinks")
        return
    }

    const currentPageIndex = currentNav?.pages?.findIndex(p => page === p)
    const foundPageIndex = currentPageIndex != undefined && currentPageIndex !== -1

    if (!foundPageIndex) {
        return
    }

    // same group level
    {
        let prev = currentNav?.pages?.[currentPageIndex - 1]
        let next = currentNav?.pages?.[currentPageIndex + 1]

        const atLeastOne = prev || next

        if (!atLeastOne) {
            return {}
        }

        if (prev && typeof prev !== "string" && "virtual" in prev) {
            prev = prev.virtual
        }
        if (next && typeof next !== "string" && "virtual" in next) {
            next = next.virtual
        }

        if (prev && typeof prev !== "string") {
            console.error("currently nested pages for navlinks are not supported (step 1)")
            return
        }

        if (next && typeof next !== "string") {
            console.error("currently nested pages for navlinks are not supported (step 1)")
            return
        }

        let prevTitle = prev ? frontmatters[prev]?.title || "" : ""
        let nextTitle = next ? frontmatters[next]?.title || "" : ""

        if (typeof prevTitle !== "string") {
            if (prevTitle?.title) {
                prevTitle = prevTitle.title
            }
        }

        if (typeof nextTitle !== "string") {
            if (nextTitle?.title) {
                nextTitle = nextTitle.title
            }
        }

        if (typeof prevTitle !== "string") {
            console.error("currently navlink 'prev' must be a string")
            return
        }

        if (typeof nextTitle !== "string") {
            console.error("currently navlink 'next' must be a string")
            return
        }


        let prevLink
        let nextLink

        if (prev && !hiddenPages[prev]) {
            prevLink = {
                title: prevTitle,
                href: safePageLink(prev),
            }
        }

        if (next && !hiddenPages[next]) {
            nextLink = {
                title: nextTitle,
                href: safePageLink(next),
            }
        }

        return {
            prev: prevLink || undefined,
            next: nextLink || undefined,
        }
    }


    return {}
}
