import React from "react"

import type {ITOC, IBreadcrumb, INavLinks} from "@xyd/ui2"
import {
    FwNav,
    FwToc,
    FwNavLinks,
    FwSubNav,

    FwSidebarGroups,
    WithApp,
    useMatchedSubNav,
} from "@xyd/framework"
import type {
    FwSidebarGroupProps
} from "@xyd/framework"
import {Layout} from "@xyd/components/layouts"
import {Settings} from "@xyd/core";

// TODO: theme settings context
export interface ThemeSettings {
    sidebar?: {
        onePathBehaviour?: boolean
        clientSideRouting?: boolean
    }
    bigArticle?: boolean
}

export interface ThemeProps {
    children: JSX.Element | JSX.Element[]
    settings: Settings,
    sidebarGroups: FwSidebarGroupProps[]

    themeSettings?: ThemeSettings
    toc?: ITOC[]
    breadcrumbs?: IBreadcrumb[]
    navlinks?: INavLinks
}

// TODO: theme should take care of mdx components props
export default function ThemeGusto(props: ThemeProps) {
    // TODO: breadcrumbs, navigation links
    // TODO: move to common for themes
    const App = WithApp(
        props.settings,
        props.sidebarGroups,
        props.toc,
        props.breadcrumbs,
        props.navlinks,
    )

    return <App>
        <Gusto {...props}/>
    </App>
}

function Gusto(props: ThemeProps) {
    const subheader = !!useMatchedSubNav()

    return <Layout
        header={<Navbar/>}
        subheader={subheader}
        aside={<Sidebar themeSettings={props.themeSettings}/>}
        content={<>
            {/*TODO: optional breadcrumbs*/}
            {/*{props.breadcrumbs ? <FwBreadcrumbs/> : undefined}*/}
            {/* TODO: FIX THAT */}
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px"
            }}>
                {props.children}
            </div>
            {props.navlinks ? <FwNavLinks/> : undefined}
        </>
        }
        contentNav={props.toc ? <FwToc/> : undefined}
        kind={props.themeSettings?.bigArticle ? "fullwidth" : undefined}
    />
}

// TODO: finish search - and move to framework?
function Navbar() {
    return <>
        <FwNav kind="middle"/>
        <FwSubNav/>
    </>
}

// TODO: onePathBehaviour does not work - fix that
function Sidebar({themeSettings}: { themeSettings?: ThemeSettings }) {
    return <FwSidebarGroups
        onePathBehaviour={themeSettings?.sidebar?.onePathBehaviour}
        clientSideRouting={themeSettings?.sidebar?.clientSideRouting}
    />
}