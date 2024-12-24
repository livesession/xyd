import React from "react";
import {redirect} from "react-router";
import {
    getComponents,
} from "@xyd/ui";
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
    GuideCard,
    Steps,
    Tabs,
    Table,

    IconSessionReplay,
    IconMetrics,
    IconFunnels,
    IconCode,
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

    let code = ""
    let error: any

    try {
        code = await compileBySlug(slug, true)
    } catch (e) {
        error = e
    }
    const {
        groups: sidebarGroups,
        breadcrumbs,
        navlinks,
    } = await mapSettingsToProps(
        settings,
        slug
    )

    if (error) {
        if (sidebarGroups && error.code === "ENOENT") {
            const firstItem = sidebarGroups?.[0]?.items?.[0]

            if (firstItem) {
                return redirect(firstItem.href)
            }
        }

        console.error(error)
    }

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
    const content = mdxExport(code) // TODO: fix any
    if (!mdxExport) {
        return {}
    }

    return {
        component: content?.default,
        toc: content?.toc,
        frontmatter: content?.frontmatter,
        themeSettings: content?.themeSettings || {},
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
    GuideCard,
    Steps,
    Tabs,
    Table,

    IconSessionReplay,
    IconMetrics,
    IconFunnels,
    IconCode,

    // TODO: refactor
    Content({children}) {
        return <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px"
        }}>
            {children}
        </div>
    },

    // TODO: refactor
    Subtitle({children}) {
        return <div style={{
            marginTop: "-18px",
            fontSize: "18px",
            color: "#7051d4",
            fontWeight: 300
        }}>
            {children}
        </div>
    }
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
        themeSettings={content.themeSettings}
    >
        {Component ? <Component components={components}/> : <></>}
    </Theme>
}