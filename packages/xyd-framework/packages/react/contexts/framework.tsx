import React, {createContext, useContext} from "react";

import {Settings} from "@xyd-js/core";
import type {ITOC, IBreadcrumb, INavLinks} from "@xyd-js/ui";

import {FwSidebarGroupProps} from "../components/sidebar";

export interface IFramework {
    settings: Settings

    sidebarGroups: FwSidebarGroupProps[]

    toc?: ITOC[]

    breadcrumbs?: IBreadcrumb[]

    navlinks?: INavLinks
}

// TODO: page context + app context?
const framework: IFramework = {
    settings: {},
    sidebarGroups: []
}
const FrameworkContext = createContext<IFramework>(framework)

export interface FrameworkProps {
    children: React.ReactNode

    settings: Settings,
    sidebarGroups: FwSidebarGroupProps[],
    toc?: ITOC[],
    breadcrumbs?: IBreadcrumb[],
    navlinks?: INavLinks
}

export function Framework(props: FrameworkProps) {
    return <FrameworkContext.Provider value={{
        settings: props.settings,
        sidebarGroups: props.sidebarGroups,
        toc: props.toc,
        breadcrumbs: props.breadcrumbs,
        navlinks: props.navlinks,
    }}>
        {props.children}
    </FrameworkContext.Provider>
}


export function useSidebarGroups() {
    const ctx = useContext(FrameworkContext)

    return ctx.sidebarGroups
}

export function useSettings() {
    const ctx = useContext(FrameworkContext)

    return ctx.settings
}

export function useToC() {
    const ctx = useContext(FrameworkContext)

    return ctx.toc
}

export function useBreadcrumbs() {
    const ctx = useContext(FrameworkContext)

    return ctx.breadcrumbs
}

export function useNavLinks() {
    const ctx = useContext(FrameworkContext)

    return ctx.navlinks
}
