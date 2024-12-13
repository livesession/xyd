import React from "react"

import {ITOC, IBreadcrumb, INavLinks} from "@xyd/ui"
import {
    FwHead,
    FwNavLogo,
    FwTopbarLinks,
    FwSidebarGroups,
    FwToc,
    FwBreadcrumbs,
    FwNavLinks,
    WithApp,
} from "@xyd/framework"
import type {
    FwSidebarGroupProps
} from "@xyd/framework"
import {LyDefault} from "@xyd/ui/layouts"
import {Layout as ComponentLayout} from "@xyd/components/layouts"
import {
    HNav,

    HAside,
    HMenu,
} from "@xyd/ui/headless";
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

function ThemeRoot({children}) {
    return <>
        <FwHead/>
        {children}
    </>
}

const Layout = LyDefault(ThemeRoot)

// TODO: remove any
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
        <ComponentLayout
            header={<Navbar/>}
            aside={<Sidebar themeSettings={props.themeSettings}/>}
            content={<>
                {props.breadcrumbs ? <FwBreadcrumbs/> : undefined}
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
        />
    </App>
}

// TODO: finish search - and move to framework?
function Navbar() {
    return <HNav>
        <FwNavLogo/>

        <FwTopbarLinks/>
    </HNav>
}

// TODO: onePathBehaviour does not work - fix that
function Sidebar({themeSettings}: { themeSettings?: ThemeSettings }) {
    return <HAside>
        <HMenu>
            <FwSidebarGroups
                onePathBehaviour={themeSettings?.sidebar?.onePathBehaviour}
                clientSideRouting={themeSettings?.sidebar?.clientSideRouting}
            />
        </HMenu>
    </HAside>
}