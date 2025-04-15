import * as React from 'react'

import { TocCard, VideoGuide } from '@xyd-js/components/writer';
import { ContentDecorator } from "@xyd-js/components/content";
import {
    LayoutPrimary
} from "@xyd-js/components/layouts";
import {
    FwNav,
    FwNavLinks,
    FwToc,
    FwSubNav,
    FwSidebarGroups,
    useMatchedSubNav
} from "@xyd-js/framework/react";

import { BaseThemeSettings } from "./settings";
import { ThemeProps } from "./types";

interface BaseThemeRenderProps {
    children: React.ReactNode;
}

export abstract class BaseTheme extends BaseThemeSettings {
    protected render(props: BaseThemeRenderProps): React.JSX.Element {
        const {
            Navbar: $Navbar,
            Sidebar: $Sidebar,
            Content: $Content,
        } = this

        const $ContentNav = this.ContentNav.bind(this)
        const subheader = useMatchedSubNav() ? <FwSubNav /> : null
        const contentNav = this.toc.isHidden() ? undefined : <$ContentNav />

        return <LayoutPrimary
            header={<$Navbar />}
            subheader={subheader}
            aside={<$Sidebar />}
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
            <FwNav kind="middle" />
        </>
    }

    protected Sidebar() {
        return <FwSidebarGroups
            // onePathBehaviour={this?.sidebar?.onePathBehaviour} TODO: finish
            clientSideRouting={this?.sidebar?.getClientSideRouting()}
        />
    }

    protected Content({ children }: { children: React.ReactNode }) {
        return <>
            {/*TODO: optional breadcrumbs*/}
            {/*{props.breadcrumbs ? <FwBreadcrumbs/> : undefined}*/}

            <ContentDecorator>
                {children}
            </ContentDecorator>

            <FwNavLinks />
        </>
    }

    protected ContentNav() {
        const toc = this?.toc?.get()

        if (toc) {
            return toc
        }

        const { TocTop, TocBottom } = this

        return <>
            <TocTop />

            <div>
                <FwToc />
            </div>

            <TocBottom />
        </>
    }


    protected TocTop() {
        return <div>
            <VideoGuide.Miniature />
        </div>
    }

    protected TocBottom() {
        return <>

            <div>
                <TocCard
                    title="Sample app"
                    description="Explore our example app to see how the TocCard component works."
                    href="https://github.com/xyd-js/xyd-samples/tree/main/example"
                />
            </div>
        </>
    }
}
