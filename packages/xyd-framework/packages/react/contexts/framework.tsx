import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigation } from "react-router";

import { Metadata, Settings } from "@xyd-js/core";
import { type ITOC, type IBreadcrumb, type INavLinks, ProgressBar } from "@xyd-js/ui";
import { Banner, Button } from "@xyd-js/components/writer";

import { FwSidebarGroupProps } from "../components/Sidebar";
import { SurfaceContext, Surfaces } from "../components/Surfaces";

export interface IFramework {
    settings: Readonly<Settings>

    sidebarGroups: Readonly<FwSidebarGroupProps[]>
    metadata: Readonly<Metadata>
    setMetadata: (metadata: Metadata) => void
}

const framework: IFramework = {
    settings: {},
    metadata: {
        title: "",
    },
    sidebarGroups: [],
    setMetadata: () => { },
}
const FrameworkContext = createContext<IFramework>(framework)

export interface FrameworkProps {
    children: React.ReactNode

    settings: Settings,
    metadata: Metadata,
    sidebarGroups: FwSidebarGroupProps[],
    surfaces: Surfaces,
    BannerComponent: React.ComponentType<any>
}

export function Framework(props: FrameworkProps) {
    const navigation = useNavigation()

    const [metadata, setMetadata] = useState<Metadata | undefined>(props.metadata)

    const BannerComponent = props.BannerComponent || null
  
    return <>
      {/*  TODO: better place*/}
      <style>{`
        ${!BannerComponent ? `
         :root {
             --xyd-banner-height: 0px;
         }
        ` : ''}
     `}</style>

        <FrameworkContext value={{
        settings: Object.freeze({ ...props.settings }),
        sidebarGroups: Object.freeze([...props.sidebarGroups]),
        metadata: Object.freeze({ ...metadata, title: metadata?.title || "" }),
        setMetadata: setMetadata,
    }}>
        <SurfaceContext value={{
            surfaces: props.surfaces
        }}>
            <ProgressBar isActive={navigation.state === 'loading'} />
            {BannerComponent ? <Banner>
                <BannerComponent />
            </Banner> : null}

            {props.children}
        </SurfaceContext>
    </FrameworkContext>
    </>
}

interface FrameworkPageProps {
    children: React.ReactNode

    ContentComponent?: (props: { components: any, children: React.ReactNode }) => React.JSX.Element

    metadata: Metadata
    breadcrumbs?: IBreadcrumb[],
    rawPage?: string
    toc?: ITOC[],
    navlinks?: INavLinks
}

interface IFrameworkPageContext {
    ContentComponent: (props: { components: any, children: React.ReactNode }) => React.JSX.Element
    metadata: Readonly<Metadata>
    breadcrumbs?: Readonly<IBreadcrumb[]>
    rawPage?: Readonly<string>
    toc?: Readonly<ITOC[]>
    navlinks?: Readonly<INavLinks>
}

const FrameworkPageContext = createContext<IFrameworkPageContext>({
    ContentComponent: () => <></>,
    metadata: {
        title: "",
    }
})

export function FrameworkPage(props: FrameworkPageProps) {
    const { setMetadata } = useContext(FrameworkContext)

    useEffect(() => {
        setMetadata(props.metadata)
    }, [])

    return <FrameworkPageContext value={{
        ContentComponent: props.ContentComponent || (() => <></>),
        metadata: Object.freeze(props.metadata),
        breadcrumbs: Object.freeze(props.breadcrumbs),
        rawPage: Object.freeze(props.rawPage),
        toc: Object.freeze(props.toc || []),
        navlinks: Object.freeze(props.navlinks),
    }}>
        {props.children}
    </FrameworkPageContext>
}

export function useSidebarGroups() {
    const ctx = useContext(FrameworkContext)

    return ctx.sidebarGroups
}

export function useSettings() {
    const ctx = useContext(FrameworkContext)

    return ctx.settings
}

export function useMetadata() {
    const ctx = useContext(FrameworkContext)

    return ctx.metadata
}

export function useToC() {
    const ctx = useContext(FrameworkPageContext)
    const toc = ctx.toc || [] // TODO: !!! `|| []` IS NEEDED CUZ ISSUES WITH HYDRATION !!!

    return toc
}

export function useBreadcrumbs() {
    const ctx = useContext(FrameworkPageContext)

    return ctx.breadcrumbs
}

export function useNavLinks() {
    const ctx = useContext(FrameworkPageContext)

    return ctx.navlinks
}


export function useRawPage() {
    const ctx = useContext(FrameworkPageContext)

    return ctx.rawPage
}

export function useContentComponent() {
    const ctx = useContext(FrameworkPageContext)

    return ctx.ContentComponent
}
