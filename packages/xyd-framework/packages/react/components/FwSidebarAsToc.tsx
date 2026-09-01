import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"

import { SidebarActiveProvider, setAsTocActiveSection, type AsTocActiveSection } from "../lib"
import { useMetadata, useSidebarGroups } from "../contexts"

import type { FwSidebarItemElementProps } from "./FwSidebarItem"

// ---------------------------------------------------------------------------
// sidebar-as-TOC scroll-spy (`asToc: true` sidebar groups)
//
// On a composed host page (metadata.asTocHost), the sidebar's asToc items act
// as the page's table of contents: this provider watches the composed page's
// `[data-astoc-section]` wrappers with the same algorithm as the right-hand
// TOC (window scroll listener, active = last section whose top crossed 20% of
// the viewport, bottom-of-page → last) and drives the sidebar highlight via
// the existing SidebarActiveProvider override. Item clicks are intercepted
// (preventDefault → smooth scroll + history.replaceState) so they never
// route-navigate while on the host page; off-host the items stay normal links
// to `<host>#<section>`.
//
// When NOT on a host page it renders children untouched — in particular it
// must not mount a SidebarActiveProvider, which would shadow an outer one
// (the API editor mounts its own scroll-spy provider above the sidebar).
// ---------------------------------------------------------------------------

interface IFwSidebarAsTocContext {
    /** true when the current page is an asToc host (scroll-spy active) */
    enabled: boolean
    /** click interceptor for asToc items — scrolls instead of navigating */
    onItemClick: (e: React.MouseEvent, href?: string) => void
}

const noop = () => { }

const FwSidebarAsTocContext = createContext<IFwSidebarAsTocContext>({
    enabled: false,
    onItemClick: noop,
})

export function useSidebarAsToc() {
    return useContext(FwSidebarAsTocContext)
}

function hashIdOf(href?: string): string {
    const i = href ? href.indexOf("#") : -1
    return i === -1 ? "" : href!.slice(i + 1)
}

export function FwSidebarAsToc({ children }: { children: React.ReactNode }) {
    const meta = useMetadata()
    const groups = useSidebarGroups()
    const enabled = !!(meta as any)?.asTocHost

    // section id → sidebar item (href + title + owning group + resolved
    // breadcrumbs flag), from the asToc items' hash hrefs. The active entry is
    // published to the asToc store so content-column UI (FwBreadcrumbs) can
    // show "Group / Section" for the section being read.
    const sectionById = useMemo(() => {
        const map = new Map<string, AsTocActiveSection>()
        if (!enabled) return map
        const walk = (items: FwSidebarItemElementProps[] | undefined, groupName: string) => {
            for (const item of items || []) {
                const id = item.asToc ? hashIdOf(item.href) : ""
                if (id) {
                    map.set(id, {
                        href: item.href,
                        title: item.sidebarTitle || item.title || "",
                        group: groupName,
                        breadcrumbs: typeof item.asToc === "object"
                            ? item.asToc.breadcrumbs !== false
                            : true,
                    })
                }
                if (item.items) walk(item.items, groupName)
            }
        }
        for (const group of groups || []) {
            walk(group.items, typeof group.group === "string" ? group.group : "")
        }
        return map
    }, [enabled, groups])

    // Effect-driven only (SSR renders no scroll-spy active item — same pattern
    // as the right-hand TOC, so there is no hydration mismatch).
    const [activeHref, setActiveHref] = useState<string | undefined>(undefined)
    const ignoreScrollRef = useRef(false)

    useEffect(() => {
        if (!enabled) return

        function handleScroll() {
            if (ignoreScrollRef.current) {
                ignoreScrollRef.current = false
                return
            }
            const sections = Array.from(
                document.querySelectorAll<HTMLElement>("[data-astoc-section]")
            ).filter((el) => el.id)
            if (!sections.length) return

            const viewportHeight = window.innerHeight
            const threshold = viewportHeight * 0.2

            let active = sections[0].id
            for (const el of sections) {
                if (el.getBoundingClientRect().top <= threshold) {
                    active = el.id
                } else {
                    break
                }
            }

            const totalHeight = document.documentElement.scrollHeight
            if (totalHeight > viewportHeight && window.pageYOffset + viewportHeight >= totalHeight - 1) {
                active = sections[sections.length - 1].id
            }

            const section = sectionById.get(active) || null
            setActiveHref(section?.href)
            setAsTocActiveSection(section)
        }

        window.addEventListener("scroll", handleScroll)
        handleScroll()
        return () => {
            window.removeEventListener("scroll", handleScroll)
            setAsTocActiveSection(null)
        }
    }, [enabled, sectionById])

    // Mount-time hash scroll: neither router scrolls to a hash on its own
    // (@xyd-js/router deliberately skips it), so landing on /#section-id from
    // an off-host click must scroll here.
    useEffect(() => {
        if (!enabled) return
        const id = decodeURIComponent((window.location.hash || "").slice(1))
        if (!id || !sectionById.has(id)) return
        document.getElementById(id)?.scrollIntoView()
    }, [enabled, sectionById])

    const value = useMemo<IFwSidebarAsTocContext>(() => ({
        enabled,
        onItemClick(e, href) {
            const id = hashIdOf(href)
            if (!id) return
            const el = document.getElementById(id)
            // Section not in this DOM (off-host page) → let the Link navigate
            // to <host>#<id>; the mount-time hash scroll takes it from there.
            if (!el) return
            e.preventDefault()
            ignoreScrollRef.current = true
            setActiveHref(href)
            setAsTocActiveSection(sectionById.get(id) || null)
            el.scrollIntoView({ behavior: "smooth" })
            history.replaceState(null, "", `#${id}`)
        },
    }), [enabled, sectionById])

    if (!enabled) {
        return <FwSidebarAsTocContext value={{ enabled: false, onItemClick: noop }}>
            {children}
        </FwSidebarAsTocContext>
    }

    return <FwSidebarAsTocContext value={value}>
        <SidebarActiveProvider activeHref={activeHref}>
            {children}
        </SidebarActiveProvider>
    </FwSidebarAsTocContext>
}
