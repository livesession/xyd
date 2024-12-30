import React, {createContext, useContext} from "react";

import {Settings} from "@xyd/core";
import type {ITOC, IBreadcrumb, INavLinks} from "@xyd/ui2";

import {FwSidebarGroupProps} from "../components/sidebar";

interface App {
    settings: Settings

    sidebarGroups: FwSidebarGroupProps[]

    toc?: ITOC[]

    breadcrumbs?: IBreadcrumb[]

    navlinks?: INavLinks
}

// TODO: page context + app context?
const app: App = {
    settings: {},
    sidebarGroups: []
}
const AppContext = createContext<App>(app)

export function WithApp(
    settings: Settings,
    sidebarGroups: FwSidebarGroupProps[],
    toc?: ITOC[],
    breadcrumbs?: IBreadcrumb[],
    navlinks?: INavLinks
) {
    return function (props: { children: React.ReactNode }) {
        return <AppContext.Provider value={{
            settings,
            sidebarGroups,
            toc,
            breadcrumbs,
            navlinks,
        }}>
            {props.children}
        </AppContext.Provider>
    }
}

export function useSidebarGroups() {
    const ctx = useContext(AppContext)

    return ctx.sidebarGroups
}

export function useSettings() {
    const ctx = useContext(AppContext)

    return ctx.settings
}

export function useToC() {
    const ctx = useContext(AppContext)

    return ctx.toc
}

export function useBreadcrumbs() {
    const ctx = useContext(AppContext)

    return ctx.breadcrumbs
}

export function useNavLinks() {
    const ctx = useContext(AppContext)

    return ctx.navlinks
}
