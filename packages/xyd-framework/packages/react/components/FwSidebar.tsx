import React, { } from "react";

import { UISidebar } from "@xyd-js/ui"

import { SurfaceTarget } from "../../../src";
import { useAppearance, useSettings, } from "../contexts";

import { Surface } from "./Surfaces";
import { FooSidebar } from "../lib";
import { FwSidebarNavigationItem } from "./FwSidebarNavigationItem";
import { FwSidebarTabsDropdown } from "./FwSidebarTabsDropdown";
import { FwSidebarTopAnchors } from "./FwSidebarTopAnchors";
import { FwWebEditorSidebarTop } from "./FwWebEditorSidebarTop";
import { FwSidebarMobileHeaderItems } from "./FwSidebarMobileHeaderItems";
import { useSidebarTree } from "./FwSidebarTree";
import { FwLogo } from "./FwLogo";

const Sidebar = withSidebar(UISidebar)

export interface FwSidebarProps {
}

export function FwSidebar(props: FwSidebarProps) {
    const settings = useSettings()
    const appearance = useAppearance()

    // TODO: active state for footer items?
    const sidebarFooterAnchors = settings.navigation?.anchors?.sidebar?.bottom?.map(FwSidebarNavigationItem)

    return <Sidebar
        footerItems={sidebarFooterAnchors && sidebarFooterAnchors}
        scrollShadow={appearance?.sidebar?.scrollShadow}
        scrollTransition={appearance?.sidebar?.scrollTransition}
    >
        <Surface target={SurfaceTarget.SidebarTop} />

        <FwSidebarTopAnchors />

        <FwWebEditorSidebarTop />

        <FwSidebarMobileHeaderItems />

        <FwSidebarTabsDropdown />
    </Sidebar>
}


export function withSidebar<P extends {
    children?: React.ReactNode
}>(Component: React.ComponentType<P>) {
    // TODO: better API for elements like logo search
    return function WithSidebarContent(props: P) {
        const [sidebarTree, sidebarTreeFlags] = useSidebarTree()
        const { children, ...rest } = props

        return <FooSidebar
            initialActiveItems={sidebarTreeFlags.initialActiveItems}
        >
            <Component {...rest as P}>
                {children}
                {sidebarTree}
            </Component>
        </FooSidebar>
    }
}
