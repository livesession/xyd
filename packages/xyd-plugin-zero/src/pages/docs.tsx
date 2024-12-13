import React from "react";

import {
    getComponents,
} from "@xyd/ui/headless";
import {PageFrontMatter} from "@xyd/core"
import {mapSettingsToProps} from "@xyd/framework/hydration";
import {compileBySlug} from "@xyd/content"
import {IBreadcrumb, INavLinks} from "@xyd/ui";
import {FwSidebarGroupProps} from "@xyd/framework";

// @ts-ignore // TODO: tyoes
import settings from 'virtual:xyd-settings';
// @ts-ignore  // TODO: types
// import Theme from "virtual:xyd-theme" // TODO: for some reasons this cannot be hydrated by react-router
import Theme from "@xyd/theme-gusto"
import {
    Callout,
    Details,
    Steps,
    Tabs
} from "@xyd/components/writer";

interface loaderData {
    sidebarGroups: FwSidebarGroupProps[]
    breadcrumbs: IBreadcrumb[],
    navlinks?: INavLinks,
    toc: PageFrontMatter
    slug: string
    code: string
}

function getPathname(url: string) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\//, '');
}

export async function loader({request}: { request: any }) {
    const slug = getPathname(request.url)

    const code = await compileBySlug(slug, true)

    const {groups: sidebarGroups, breadcrumbs, navlinks} = await mapSettingsToProps(
        settings,
        slug
    )

    return {
        sidebarGroups,
        breadcrumbs,
        navlinks,
        slug,
        code,
    } as loaderData
}

// TODO: move to content?
function mdxExport(code: string) {
    const scope = {
        Fragment: React.Fragment,
        jsxs: React.createElement,
        jsx: React.createElement,
        jsxDEV: React.createElement,
    }
    const fn = new Function(...Object.keys(scope), code)
    return fn(scope)
}


// // TODO: move to content?
function mdxContent(code: string) {
    const content = mdxExport(code)
    if (!mdxExport) {
        return {}
    }
    return {
        component: content?.default,
        toc: content?.toccontent,
        frontmatter: content?.frontmatter,
    }
}

export function MemoMDXComponent(codeComponent: any) {
    return React.useMemo(
        () => codeComponent ? codeComponent : null,
        [codeComponent]
    )
}

const components = {
    ...getComponents(),
    Callout,
    Details,
    Steps,
    Tabs,
}

export default function Slug({loaderData, ...rest}: { loaderData: loaderData }) {
    const content = mdxContent(loaderData.code)
    const Component = MemoMDXComponent(content.component)


    return <Theme
        settings={settings}
        sidebarGroups={loaderData.sidebarGroups}
        toc={content.toc}
        breadcrumbs={loaderData.breadcrumbs}
        navlinks={loaderData.navlinks}
    >
        {Component ? <Component components={components}/> : <></>}
    </Theme>
}