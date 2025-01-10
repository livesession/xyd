import React from "react"

import {Layout} from "@xyd-js/components/layouts" // TODO: it has .dts errors on rollup
import {helperContent} from "@xyd-js/components/content"
import type {
    ITheme
} from "@xyd-js/framework"
import {
    FwNav,
    FwToc,
    FwNavLinks,
    FwSubNav,

    FwSidebarGroups,

    useMatchedSubNav,
} from "@xyd-js/framework/react"

import "@xyd-js/ui/index.css";
import "@xyd-js/components/index.css";
import '@xyd-js/fable-wiki/tokens.css';
// TODO: what about atlas? it's loaded by plugin - probably we need better mechanism for loading css
import '@xyd-js/atlas/index.css';

import './index.css';

const {Content} = helperContent()

export interface ThemeSettings {
    hideToc?: boolean // TODO: better prop name?
    sidebar?: {
        onePathBehaviour?: boolean
        clientSideRouting?: boolean
    }
    bigArticle?: boolean
}

export interface ThemeProps extends ITheme<ThemeSettings> {
}

export default function ThemeFableWiki(props: ThemeProps) {
    const subheader = !!useMatchedSubNav()

    return <Layout
        header={<Navbar/>}
        subheader={subheader}
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
        contentNav={props.themeSettings?.hideToc ? null : <FwToc/>}
        kind={props.themeSettings?.bigArticle ? "fullwidth" : undefined}
    />
}

// TODO: finish search
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