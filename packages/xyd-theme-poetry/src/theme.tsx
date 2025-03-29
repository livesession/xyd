import React from "react"

import type {
    ITheme
} from "@xyd-js/framework"
import {helperContent} from "@xyd-js/components/content"
import {
    LayoutPrimary
} from "@xyd-js/components/layouts";
import {
    FwNav,
    FwSubNav,
    FwToc,
    FwNavLinks,
    FwSidebarGroups,

    useMatchedSubNav
} from "@xyd-js/framework/react"

import "@xyd-js/ui/index.css";
import "@xyd-js/components/index.css";
import '@xyd-js/atlas/index.css';
import "@xyd-js/atlas/tokens.css"

import './index.css';
import './override.css';

const {Content} = helperContent()

export interface ThemeSettings {
    hideToc?: boolean // TODO: better prop name?
    sidebar?: {
        onePathBehaviour?: boolean
        clientSideRouting?: boolean
    }
    contentNav?: React.ReactNode
    layout?: {
        size?: "large"
    }
}

export interface ThemeProps extends ITheme<ThemeSettings> {
}

export default function ThemePoetry(props: ThemeProps) {
    const showSubheader = useMatchedSubNav() ? <FwSubNav/> : null

    return <LayoutPrimary
        subheader={showSubheader}
        header={<$Navbar/>}
        aside={<$Sidebar themeSettings={props.themeSettings}/>}
        content={<>
            {/*TODO: optional breadcrumbs*/}
            {/*{props.breadcrumbs ? <FwBreadcrumbs/> : undefined}*/}
            <Content>
                {props.children}
            </Content>

            <FwNavLinks/>
        </>
        }
        contentNav={
            props.themeSettings?.hideToc
                ? null
                : props.themeSettings?.contentNav ? props.themeSettings.contentNav : <FwToc/>
        }
        layoutSize={props.themeSettings?.layout?.size || undefined}
    />
}

// TODO: finish search
function $Navbar() {
    return <>
        <FwNav kind="middle"/>
    </>
}

// TODO: onePathBehaviour does not work - fix that
function $Sidebar({themeSettings}: { themeSettings?: ThemeSettings }) {
    return <FwSidebarGroups
        onePathBehaviour={themeSettings?.sidebar?.onePathBehaviour}
        clientSideRouting={themeSettings?.sidebar?.clientSideRouting}
    />
}