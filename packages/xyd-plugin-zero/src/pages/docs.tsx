import React from "react";
import {redirect} from "react-router";

import {PageFrontMatter} from "@xyd/core"
import {compileBySlug} from "@xyd/content"
import getContentComponents from "@xyd/components/content";
import {mapSettingsToProps} from "@xyd/framework/hydration";
import type {IBreadcrumb, INavLinks} from "@xyd/ui2";
import {Framework} from "@xyd/framework/react";
import type {FwSidebarGroupProps} from "@xyd/framework/react";

import settings from 'virtual:xyd-settings';
import Theme from "virtual:xyd-theme"

import "virtual:xyd-theme/index.css"

interface loaderData {
    sidebarGroups: FwSidebarGroupProps[]
    breadcrumbs: IBreadcrumb[],
    navlinks?: INavLinks,
    toc: PageFrontMatter
    slug: string
    code: string
}

const contentComponents = getContentComponents()

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

export default function Slug({loaderData, ...rest}: { loaderData: loaderData }) {
    const content = mdxContent(loaderData.code)
    const Component = MemoMDXComponent(content.component)

    return <Framework
        settings={settings}
        sidebarGroups={loaderData.sidebarGroups}
        toc={content.toc}
        breadcrumbs={loaderData.breadcrumbs}
        navlinks={loaderData.navlinks}
    >
        <Theme
            themeSettings={content.themeSettings}
        >
            {Component ? <Component components={contentComponents}/> : <></>}
        </Theme>
    </Framework>
}