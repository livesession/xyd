import { useSyncExternalStore } from "react"

// ---------------------------------------------------------------------------
// sidebar-as-TOC active-section store.
//
// The scroll-spy lives in the SIDEBAR tree (FwSidebarAsToc), but the active
// section also drives UI in the CONTENT column (FwBreadcrumbs shows
// "Group / Section" on the composed host page). Those trees have no shared
// provider ancestor, so the active section is published through this tiny
// module-level store instead of a context. SSR snapshot is null — consumers
// render their static state on the server and pick the section up after
// hydration (same effect-driven pattern as the scroll-spy itself).
// ---------------------------------------------------------------------------

export interface AsTocActiveSection {
    /** the sidebar item href, e.g. "/#operating-systems-linux" */
    href: string
    /** section page title (from its frontmatter) */
    title: string
    /** owning sidebar group name, "" when the group is unnamed */
    group: string
    /** the group's resolved `breadcrumbs` option */
    breadcrumbs: boolean
}

let activeSection: AsTocActiveSection | null = null
const listeners = new Set<() => void>()

export function setAsTocActiveSection(next: AsTocActiveSection | null) {
    if (next === activeSection) return
    if (next && activeSection && next.href === activeSection.href) return
    activeSection = next
    for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

const getSnapshot = () => activeSection
const getServerSnapshot = () => null

/** The section the reader is currently in on an asToc host page, or null. */
export function useAsTocActiveSection(): AsTocActiveSection | null {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
