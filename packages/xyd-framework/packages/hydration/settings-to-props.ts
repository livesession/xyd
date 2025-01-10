// server-only

import {Sidebar, PageFrontMatter, Settings, SidebarMulti} from "@xyd-js/core";
import {filterNavigationByLevels, pageFrontMatters} from "@xyd-js/content/navigation";
import {IBreadcrumb, INavLinks} from "@xyd-js/ui";

import {FwSidebarGroupProps} from "../react";

// TODO: framework vs content responsibility

function filterNavigation(settings: Settings, slug: string): Sidebar[] {
    const sidebarItems: Sidebar[] = []

    let multiSidebarMatch: SidebarMulti | null = null

    settings?.structure?.sidebar.filter(sidebar => {
        if ("match" in sidebar) {
            const sideMatch = normalizeHref(sidebar.match)
            const normalizeSlug = normalizeHref(slug)

            // TODO: startWith is not enough e.g `/docs/apps/buildISSUE` if `/docs/apps/build`
            if (normalizeSlug.startsWith(sideMatch)) {
                if (multiSidebarMatch) {
                    const findByMatchLvl = multiSidebarMatch.match.split("/").length
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
        const ok = filterNavigationByLevels(settings?.structure?.header || [], slug)(sidebar)

        if (ok) {
            sidebarItems.push(sidebar)
        }
    })

    if (multiSidebarMatch != null) {
        const side = multiSidebarMatch as SidebarMulti
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

// mapNavigationToProps maps @xyd-js/core navigation into @xyd-js/ui props
export async function mapSettingsToProps(
    settings: Settings,
    slug: string
): Promise<{
    groups: FwSidebarGroupProps[],
    breadcrumbs: IBreadcrumb[]
    navlinks?: INavLinks
}> {
    const filteredNav = filterNavigation(settings, slug)
    const frontmatters = await pageFrontMatters(filteredNav)

    const slugFrontmatter = frontmatters[slug] || null
    const breadcrumbs: IBreadcrumb[] = []
    let navlinks: INavLinks | undefined = undefined

    function mapItems(
        page: string | Sidebar,
        currentNav: Sidebar,
        nav: Sidebar[]
    ) {
        if (typeof page !== "string") {
            const items = page.pages?.map((p) => mapItems(p, page, nav))

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
                items,
            }
        }

        const matterTitle = frontmatters && frontmatters[page] && frontmatters[page].title

        let title = ""

        if (typeof matterTitle === "string") {
            title = matterTitle
        } else {
            // @ts-ignore
            title = matterTitle
        }

        if (!title) {
            console.error("Title not found for page", page)
        }

        // TODO: better data structures - for example flat array of filtered nav
        if (slugFrontmatter && (slugFrontmatter === frontmatters[page])) {
            const nlinks = mapNavToLinks(page, currentNav, nav, frontmatters)

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
                href: page,
            })
        }

        return {
            // @ts-ignore
            title,
            href: safePageLink(page),
            active: false // TODO:
        }
    }

    const groups = filteredNav.map((nav) => {
        // TODO: finish
        if ("match" in nav) {
            return {
                group: "",
                items: [],
            } as FwSidebarGroupProps
        }

        return {
            group: nav.group,
            items: nav.pages?.map((p) => {
                // @ts-ignore
                return mapItems(p, nav, filteredNav)
            }) || [],
        } as FwSidebarGroupProps
    }) || []

    return {
        groups,
        breadcrumbs,
        navlinks
    }
}

function mapNavToLinks(
    page: string | Sidebar,
    currentNav: Sidebar,
    nav: Sidebar[],
    frontmatters: PageFrontMatter
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

    let prev = currentNav?.pages?.[currentPageIndex - 1]
    let next = currentNav?.pages?.[currentPageIndex + 1]

    if (prev && next) {
        if (typeof prev !== "string" || typeof next !== "string") {
            console.error("currently nested pages for navlinks are not supported (step 1)")
            return
        }

        const prevTitle = frontmatters[prev]?.title || ""
        const nextTitle = frontmatters[next]?.title || ""

        // prev and next found on same nav (pages)
        return {
            prev: {
                // @ts-ignore
                title: prevTitle,
                href: safePageLink(prev),
            },
            next: {
                // @ts-ignore
                title: nextTitle,
                href: safePageLink(next),
            }
        }
    }

    const currentNavPosition = nav.findIndex(n => n.group === currentNav.group)
    const foundNavIndex = currentNavPosition != undefined && currentNavPosition !== -1

    if (!foundNavIndex) {
        return
    }

    // search prev in previous nav
    if (!prev) {
        const prevNav = nav[currentNavPosition - 1]

        if (prevNav) {
            const prevNavLastPge = prevNav?.pages?.[prevNav.pages.length - 1]

            if (typeof prevNavLastPge != "string") {
                console.error("currently nested pages for navlinks are not supported (step 2)")
            } else {
                prev = prevNavLastPge
            }
        }
    }

    // search next in next nav
    if (!next) {
        const nextNav = nav[currentNavPosition + 1]

        if (nextNav) {
            const nextNavFirstPage = nextNav?.pages?.[0]

            if (typeof nextNavFirstPage != "string") {
                console.error("currently nested pages for navlinks are not supported (step 3)")
            } else {
                next = nextNavFirstPage
            }
        }
    }


    if (!prev) {
        if (typeof next == "string") {
            const nextTitle = frontmatters[next]?.title || ""

            return {
                next: {
                    // @ts-ignore
                    title: nextTitle,
                    href: safePageLink(next),
                },
            }
        } else {
            console.error("currently nested pages for navlinks are not supported (step 4)")
        }
    }

    if (!next) {
        if (typeof prev == "string") {
            const nextTitle = frontmatters[prev]?.title || ""

            return {
                prev: {
                    // @ts-ignore
                    title: nextTitle,
                    href: safePageLink(prev),
                },
            }
        } else {
            console.error("currently nested pages for navlinks are not supported (step 5)")
        }
    }

    if (typeof prev !== "string" || typeof next !== "string") {
        console.error("currently nested pages for navlinks are not supported (step 6)")
        return
    }

    const prevTitle = frontmatters[prev]?.title || ""
    const nextTitle = frontmatters[next]?.title || ""

    return {
        prev: {
            // @ts-ignore
            title: prevTitle,
            href: safePageLink(prev),
        },
        next: {
            // @ts-ignore
            title: nextTitle,
            href: safePageLink(next),
        }
    }
}
