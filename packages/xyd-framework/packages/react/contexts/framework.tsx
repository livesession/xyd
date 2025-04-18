import React, {createContext, useContext} from "react";

import {Metadata, Settings} from "@xyd-js/core";
import {type ITOC, type IBreadcrumb, type INavLinks, ProgressBar} from "@xyd-js/ui";

import {FwSidebarGroupProps} from "../components/Sidebar";
import {useNavigation} from "react-router";

export interface IFramework {
    settings: Settings

    sidebarGroups: FwSidebarGroupProps[]

    toc?: ITOC[]

    breadcrumbs?: IBreadcrumb[]

    navlinks?: INavLinks

    metadata?: Metadata
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
    metadata: Metadata

    toc?: ITOC[],
    breadcrumbs?: IBreadcrumb[],
    navlinks?: INavLinks
}

export function Framework(props: FrameworkProps) {
    const navigation = useNavigation()

    return <FrameworkContext.Provider value={{
        settings: props.settings,
        sidebarGroups: props.sidebarGroups,
        metadata: props.metadata,

        toc: props.toc,
        breadcrumbs: props.breadcrumbs,
        navlinks: props.navlinks,
    }}>
        {/* TODO: in the futre in another place? */}
        <ProgressBar isActive={navigation.state === 'loading'}/>

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

export function useMetadata() {
    const ctx = useContext(FrameworkContext)

    return ctx.metadata
}