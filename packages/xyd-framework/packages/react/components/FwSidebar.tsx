import React, { } from "react";
import { useMatches } from "react-router";

import { UISidebar } from "@xyd-js/ui"

import { SurfaceTarget } from "../../../src";
import { useAppearance, useSettings, useSidebarGroups, SidebarFilterProvider } from "../contexts";

import { Surface } from "./Surfaces";
import { FooSidebar } from "../lib";
import { FwSidebarNavigationItem } from "./FwSidebarNavigationItem";
import { FwSidebarTabsDropdown } from "./FwSidebarTabsDropdown";
import { FwSidebarTopAnchors } from "./FwSidebarTopAnchors";
import { FwWebEditorSidebarTop } from "./FwWebEditorSidebarTop";
import { FwSidebarMobileHeaderItems } from "./FwSidebarMobileHeaderItems";
import { FwSidebarFilter } from "./FwSidebarFilter";
import { FwSidebarComponent } from "./FwSidebarComponent";
import { FwSidebarAsToc } from "./FwSidebarAsToc";
import type { FwSidebarItemElementProps, FwSidebarItemProps } from "./FwSidebarItem";
import { useSidebarTree } from "./FwSidebarTree";
import { FwLogo } from "./FwLogo";

/** Collect sidebar items marked `{ fixed: true, component }` — they render in the
 *  pinned fixed region instead of inline in the scrollable tree. */
function collectFixedComponents(groups: readonly FwSidebarItemProps[]): FwSidebarItemElementProps[] {
    const out: FwSidebarItemElementProps[] = []
    const walk = (items?: FwSidebarItemElementProps[]) => {
        for (const it of items || []) {
            if (it?.component && it?.fixed) out.push(it)
            if (it?.items) walk(it.items)
        }
    }
    for (const g of groups || []) walk((g as any)?.items)
    return out
}

const Sidebar = withSidebar(UISidebar)

export interface FwSidebarProps {
}

export function FwSidebar(props: FwSidebarProps) {
    const settings = useSettings()
    const appearance = useAppearance()

    // TODO: active state for footer items?
    const sidebarFooterAnchors = settings.navigation?.anchors?.sidebar?.bottom?.map(FwSidebarNavigationItem)

    // Wrap the whole sidebar (surface + tree) in the filter provider so an opt-in
    // "filter sidebar" input on the `sidebar.top` surface and the tree items share
    // one query. Default query is "" → no filtering, so themes without a filter
    // input are unaffected.
    // The pinned region: a theme-defined `sidebar.fixed` surface + the built-in
    // filter (opt-in via components.filterSidebar) + sidebar items marked
    // `{ fixed: true }`. When all are empty the region collapses via
    // `[part="fixed"]:empty` (Sidebar.styles).
    const filter = settings.components?.filterSidebar
    const filterCfg = filter && typeof filter === "object" ? filter : undefined
    // Route-scoping: when `routes` is set, the filter renders only on pages whose
    // slug starts with a listed prefix.
    const matches = useMatches()
    const slug = (matches[matches.length - 1]?.pathname || "").replace(/^\/+/, "")
    const filterRoutes = filterCfg?.routes
    const filterInRoute = !filterRoutes?.length
        || filterRoutes.some((r) => slug.startsWith(String(r).replace(/^\/+/, "")))
    const showFilter = !!filter && filterInRoute
    const fixedComponents = collectFixedComponents(useSidebarGroups())
    const fixedTop = <>
        <Surface target={SurfaceTarget.SidebarFixed} />
        {showFilter && <FwSidebarFilter placeholder={filterCfg?.placeholder} />}
        {/* A sidebarDropdown segment with `options.fixed` pins its section
            switcher here, below the filter (the in-list instance skips it). */}
        <FwSidebarTabsDropdown fixed />
        {fixedComponents.map((it, i) => <FwSidebarComponent
            key={`fixed-${i}-${it.component}`}
            component={it.component as string}
            props={it.componentProps}
        />)}
    </>

    return <SidebarFilterProvider>
        {/* sidebar-as-TOC: on an asToc host page this drives the sidebar
            highlight from scroll position and intercepts asToc item clicks;
            elsewhere it renders children untouched. */}
        <FwSidebarAsToc>
            <Sidebar
                footerItems={sidebarFooterAnchors && sidebarFooterAnchors}
                fixedTop={fixedTop}
                scrollShadow={appearance?.sidebar?.scrollShadow}
                scrollTransition={appearance?.sidebar?.scrollTransition}
                groupCase={appearance?.sidebar?.groupCase}
                scroll={appearance?.sidebar?.scroll}
            >
                <Surface target={SurfaceTarget.SidebarTop} />

                <FwSidebarTopAnchors />

                <FwWebEditorSidebarTop />

                <FwSidebarMobileHeaderItems />

                <FwSidebarTabsDropdown />
            </Sidebar>
        </FwSidebarAsToc>
    </SidebarFilterProvider>
}


export function withSidebar<P extends {
    children?: React.ReactNode
}>(Component: React.ComponentType<P>) {
    // TODO: better API for elements like logo search
    return function WithSidebarContent(props: P) {
        const [sidebarTree, sidebarTreeFlags] = useSidebarTree()
        const appearance = useAppearance()
        const { children, ...rest } = props

        return <FooSidebar
            initialActiveItems={sidebarTreeFlags.initialActiveItems}
            persist={Boolean((appearance as any)?.sidebar?.keepExpanded)}
        >
            <Component {...rest as P}>
                {children}
                {sidebarTree}
            </Component>
        </FooSidebar>
    }
}
