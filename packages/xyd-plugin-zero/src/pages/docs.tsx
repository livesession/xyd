import path from "node:path";

import React from "react";
import { redirect } from "react-router";

import { PageFrontMatter } from "@xyd-js/core"
import { compileBySlug } from "@xyd-js/content"
import { mapSettingsToProps } from "@xyd-js/framework/hydration";
import { Framework, FwNav, type FwSidebarGroupProps } from "@xyd-js/framework/react";
import type { IBreadcrumb, INavLinks } from "@xyd-js/ui";
import { HomePage } from "@xyd-js/components/pages";
import { Atlas, AtlasContext } from "@xyd-js/atlas";
import getContentComponents from "@xyd-js/components/content";

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

const contentComponents = {
    ...getContentComponents(settings),

    HomePage: (props) => <HomePage
        {...props}
        // TODO: get props from theme about nav (middle etc)
        // TODO: footer
        // TODO: style
        header={<div style={{ marginLeft: "var(--xyd-global-page-gutter)" }}>
            <FwNav kind="middle" />
        </div>}

    >
        {props.children}
    </HomePage>,

    Atlas: (props) => <Atlas {...props} />
}

const supportedExtensions = {
    ".mdx": true,
    ".md": true,
    "": true,
}

function getPathname(url: string) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\//, '');
}

export async function loader({ request }: { request: any }) {
    const slug = getPathname(request.url || "index") || "index"
    const ext = path.extname(slug)

    if (!supportedExtensions[ext]) {
        return {}
    }

    // TODO: in the future map instead of arr
    if (settings.redirects && settings.redirects.length) {
        for (const item of settings.redirects) {
            if (item.source === getPathname(request.url)) {
                return redirect(item.destination)
            }
        }
    }

    let code = ""
    let error: any

    try {
        code = await compileBySlug(slug, true)
    } catch (e) {
        error = e
    }

    if (error?.code === "ENOENT") {
        error = null

        try {
            code = await compileBySlug(slug, false)
        } catch (e) {
            error = e
        }
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

export default function CustomPage({ loaderData, ...rest }: { loaderData: loaderData }) {
    const content = mdxContent(loaderData.code)
    const Content = MemoMDXComponent(content.component)

    if (!Content) {
        console.error("Content not found")
        return null
    }

    let component: React.JSX.Element

    if (content.page) {
        component = <Content
            components={{
                ...contentComponents,
            }}
        />
    } else {
        component = <Theme>
            <Content
                components={{
                    ...contentComponents,
                }}
            />
        </Theme>
    }

    return <AtlasContext.Provider value={{
        syntaxHighlight: settings?.theme?.markdown?.syntaxHighlight || null
    }}>
        <Framework
            settings={settings}
            sidebarGroups={loaderData.sidebarGroups || []}
            toc={content.toc || []}
            breadcrumbs={loaderData.breadcrumbs || []}
            navlinks={loaderData.navlinks}
        >
            {component}
        </Framework>
    </AtlasContext.Provider>
}