import React from "react"

import {helperContent} from "@xyd-js/components/content"
import type {
    ITheme
} from "@xyd-js/framework"
import {
    FwNav,
    FwToc,
    FwNavLinks,

    FwSidebarGroups,
} from "@xyd-js/framework/react"

import {Layout} from "./components/Layouts";

import "@xyd-js/ui/index.css";
import "@xyd-js/components/index.css";
// TODO: what about atlas? it's loaded by plugin - probably we need better mechanism for loading css
import '@xyd-js/atlas/index.css';

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
        kind?: "fullwidth" | "equal"
    }
}

export interface ThemeProps extends ITheme<ThemeSettings> {
}

export default function ThemePoetry(props: ThemeProps) {
    return <Layout
        header={<Navbar/>}
        aside={<Sidebar themeSettings={props.themeSettings}/>}
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
        kind={props.themeSettings?.layout?.kind || undefined}
    />
}

// TODO: finish search
function Navbar() {
    return <>
        <FwNav kind="middle"/>
    </>
}

// TODO: onePathBehaviour does not work - fix that
function Sidebar({themeSettings}: { themeSettings?: ThemeSettings }) {
    return <FwSidebarGroups
        onePathBehaviour={themeSettings?.sidebar?.onePathBehaviour}
        clientSideRouting={themeSettings?.sidebar?.clientSideRouting}
    />
}