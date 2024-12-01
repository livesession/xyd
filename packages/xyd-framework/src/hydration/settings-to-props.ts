// server-only

import {Navigation, PageFrontMatter, Settings} from "@xyd/core";
import {filterNavigationByLevels, pageFrontMatters} from "@xyd/content/navigation";
import {IBreadcrumb, INavLinks} from "@xyd/ui";

import {FwSidebarGroupProps} from "../components/sidebar";

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

function safePageLink(page: string): string {
    return page?.startsWith("/") ? page : `/${page}`
}

// mapNavigationToProps maps @xyd/core navigation into @xyd/ui props
export async function mapSettingsToProps(
    settings: Settings,
    slug: string
): Promise<{
    groups: FwSidebarGroupProps[],
    breadcrumbs: IBreadcrumb[]
    navlinks?: INavLinks
}> {
    const filteredNav = settings.structure?.navigation?.filter(filterNavigationByLevels(settings?.structure?.tabs || [], slug)) || []
    const frontmatters = await pageFrontMatters(filteredNav)

    const slugFrontmatter = frontmatters[slug] || null
    const breadcrumbs: IBreadcrumb[] = []
    let navlinks: INavLinks | undefined = undefined

    function mapItems(
        page: string | Navigation,
        currentNav: Navigation,
        nav: Navigation[]
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

        const title = frontmatters && frontmatters[page] && frontmatters[page].title

        if (!title) {
            console.error("Title not found for page", page)
        }

        // TODO: better data structures - for example flat array of filtered nav
        if (slugFrontmatter && (slugFrontmatter === frontmatters[page])) {
            const nlinks = mapNavToLinks(page, currentNav, nav, frontmatters)

            if (nlinks) {
                navlinks = nlinks
            }

            // console.log(page, currentNav.group, nav)
            if (currentNav.group) {
                breadcrumbs.push({
                    title: currentNav.group,
                    href: "", // TODO:
                })
            }
            breadcrumbs.push({
                title,
                href: page,
            })
        }

        return {
            title,
            href: safePageLink(page),
            active: false // TODO:
        }
    }

    const groups = filteredNav.map((nav) => {
        return {
            group: nav.group,
            items: nav.pages?.map((p) => mapItems(p, nav, filteredNav)) || [],
        } as FwSidebarGroupProps
    }) || []

    return {
        groups,
        breadcrumbs,
        navlinks
    }
}

function mapNavToLinks(
    page: string | Navigation,
    currentNav: Navigation,
    nav: Navigation[],
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
                title: prevTitle,
                href: safePageLink(prev),
            },
            next: {
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
            title: prevTitle,
            href: safePageLink(prev),
        },
        next: {
            title: nextTitle,
            href: safePageLink(next),
        }
    }
}
