import path from "node:path";

import React from "react";
import {redirect} from "react-router";

import {PageFrontMatter} from "@xyd-js/core"
import {compileBySlug} from "@xyd-js/content"
import getContentComponents from "@xyd-js/components/content";
import {HomePage} from "@xyd-js/components/pages";
import type {IBreadcrumb, INavLinks} from "@xyd-js/ui";
import {mapSettingsToProps} from "@xyd-js/framework/hydration";
import {Framework, FwNav} from "@xyd-js/framework/react";
import type {FwSidebarGroupProps} from "@xyd-js/framework/react";

import settings from 'virtual:xyd-settings';
import Theme from "virtual:xyd-theme";

import "virtual:xyd-theme/index.css"
import "virtual:xyd-theme-override/index.css"

interface loaderData {
    sidebarGroups: FwSidebarGroupProps[]
    breadcrumbs: IBreadcrumb[],
    navlinks?: INavLinks,
    toc: PageFrontMatter
    slug: string
    code: string
}

const contentComponents = getContentComponents()

const supportedExtensions = {
    ".mdx": true,
    ".md": true,
    "": true,
}

function getPathname(url: string) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\//, '');
}

export async function loader({request}: { request: any }) {
    const slug = getPathname(request.url || "index") || "index"
    const ext = path.extname(slug)

    if (!supportedExtensions[ext]) {
        return {}
    }

    let code = ""
    let error: any

    try {
        code = await compileBySlug(slug, true)
    } catch (e) {
        error = e
    }

    if (error?.code === "ENOENT") {
        try {
            // TODO: better index algorithm
            code = await compileBySlug(slug + "/index", true)
        } catch (e) {
            error = e
        }
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

    console.timeEnd("docs loader")
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
        page: content?.page || false,
    }
}

export function MemoMDXComponent(codeComponent: any) {
    return React.useMemo(
        () => codeComponent ? codeComponent : null,
        [codeComponent]
    )
}

export default function CustomPage({loaderData, ...rest}: { loaderData: loaderData }) {
    const content = mdxContent(loaderData.code)
    const Component = MemoMDXComponent(content.component)

    return <Framework
        settings={settings}
        sidebarGroups={loaderData.sidebarGroups || []}
        toc={content.toc || []}
        breadcrumbs={loaderData.breadcrumbs || []}
        navlinks={loaderData.navlinks}
    >
        {content?.page ? <Component components={{
            ...contentComponents,
            // TODO: another page components
            HomePage: (props) => <HomePage
                {...props}
                // TODO: get props from theme about nav (middle etc)
                // TODO: footer
                // TODO: style
                header={<div style={{marginLeft: "var(--xyd-global-page-gutter)"}}>
                    <FwNav kind="middle"/>
                </div>}

            >
                {props.children}
            </HomePage>,
        }}/> : <Theme
            themeSettings={content.themeSettings}
        >
            {Component ? <Component components={contentComponents}/> : <></>}
        </Theme>}
    </Framework>
}