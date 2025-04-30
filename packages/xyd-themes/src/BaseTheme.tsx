import * as React from 'react'

import { Theme as ThemeSettings } from "@xyd-js/core";
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

    useMatchedSubNav,
    useMetadata
} from "@xyd-js/framework/react";

import { Theme } from "./Theme";
import { ThemeProps } from "./types";
interface BaseThemeRenderProps {
    children: React.ReactNode;
}

export abstract class BaseTheme extends Theme {
    constructor(settings: ThemeSettings) {
        super()
    }

    protected render(props: BaseThemeRenderProps): React.JSX.Element {
        const {
            Navbar: $Navbar,
            Sidebar: $Sidebar,
            Content: $Content,
        } = this
        const $ContentNav = this.ContentNav.bind(this)

        const hideToc = this.useHideToc()
        const layoutSize = this.useLayoutSize()

        const matchedSubNav = useMatchedSubNav()

        const subheader = matchedSubNav ? <FwSubNav /> : null
        let contentNav = hideToc ? undefined : <$ContentNav />

        return <LayoutPrimary
            header={<$Navbar />}
            subheader={subheader}
            aside={<$Sidebar />}
            content={<$Content>{props.children}</$Content>}
            contentNav={contentNav}
            layoutSize={layoutSize}
        />
    }

    // TODO: it should be protected and passed via withTheme?
    protected mergeSettings(props: ThemeProps<Theme>) {
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
        return <FwSidebarGroups />
    }

    protected Content({ children }: { children: React.ReactNode }) {
        const meta = useMetadata()

        return <>
            {/*TODO: optional breadcrumbs*/}
            {/*{props.breadcrumbs ? <FwBreadcrumbs/> : undefined}*/}

            <ContentDecorator metaComponent={meta?.component || undefined}>
                {children}
            </ContentDecorator>

            <FwNavLinks />
        </>
    }

    protected ContentNav() {
        const { TocTop, TocBottom } = this

        // TODO: toc top and bottom in the future 
        return <>
            {/* <TocTop /> */}

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
        const meta = useMetadata()
        const tocGithub = meta?.tocGithub
        const isEmpty = !tocGithub || !tocGithub.link || !tocGithub.title || !tocGithub.description
        if (isEmpty) {
            return null
        }

        return <div>
            <TocCard
                title={tocGithub.title}
                description={tocGithub.description}
                href={tocGithub.link}
            />
        </div>
    }
}
