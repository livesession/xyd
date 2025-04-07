import * as React from 'react'

import {
    LayoutPrimary
} from "@xyd-js/components/layouts";
import {
    helperContent
} from "@xyd-js/components/content"
import {
    FwNav,
    FwNavLinks,
    FwToc,
    FwSubNav,
    FwSidebarGroups,

    useMatchedSubNav
} from "@xyd-js/framework/react";

import {BaseThemeSettings} from "./settings";
import {ThemeProps} from "./types";

interface BaseThemeRenderProps {
    children: React.ReactNode;
}

const {
    Content: HelperContent
} = helperContent()

export abstract class BaseTheme extends BaseThemeSettings {
    protected render(props: BaseThemeRenderProps): React.JSX.Element {
        const {
            Navbar: $Navbar,
            Sidebar: $Sidebar,
            Content: $Content,
            ContentNav: $ContentNav
        } = this

        const subheader = useMatchedSubNav() ? <FwSubNav/> : null
        const contentNav = this.toc.isHidden() ? undefined : <$ContentNav/>

        return <LayoutPrimary
            header={<$Navbar/>}
            subheader={subheader}
            aside={<$Sidebar/>}
            content={<$Content>{props.children}</$Content>}
            contentNav={contentNav}
            layoutSize={this?.layout.getSize() as "large" || undefined}
        />
    }

    // TODO: it should be protected and passed via withTheme?
    protected mergeSettings(props: ThemeProps<BaseThemeSettings>) {
        if (props.settings) {
            Object.assign(this, props.settings);
        }
    }

    protected Navbar() {
        return <>
            <FwNav kind="middle"/>
        </>
    }

    protected Sidebar() {
        return <FwSidebarGroups
            // onePathBehaviour={this?.sidebar?.onePathBehaviour} TODO: finish
            clientSideRouting={this?.sidebar?.getClientSideRouting()}
        />
    }

    protected Content({children}: { children: React.ReactNode }) {
        return <>
            {/*TODO: optional breadcrumbs*/}
            {/*{props.breadcrumbs ? <FwBreadcrumbs/> : undefined}*/}

            <HelperContent>
                {children}
            </HelperContent>

            <FwNavLinks/>
        </>
    }

    protected ContentNav() {
        const toc = this?.toc?.get()

        if (toc) {
            return toc
        }

        return <FwToc/>
    }
}
