import path from "node:path";

import * as React from "react";
import {useMemo, useContext, useId} from "react";
import {redirect, ScrollRestoration, useLocation} from "react-router";

import {MetadataMap, Metadata} from "@xyd-js/core"
import {ContentFS} from "@xyd-js/content"
import {markdownPlugins} from "@xyd-js/content/md"
import {mapSettingsToProps} from "@xyd-js/framework/hydration";
import {FrameworkPage, type FwSidebarGroupProps} from "@xyd-js/framework/react";
import type {IBreadcrumb, INavLinks} from "@xyd-js/ui";

import settings from "virtual:xyd-settings";

import {PageContext} from "./context";

const mdPlugins = markdownPlugins({
    minDepth: 2, // TODO: configurable
}, settings)

const contentFs = new ContentFS(settings, mdPlugins.remarkPlugins, mdPlugins.rehypePlugins)

function getPathname(url: string) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\//, '');
}

interface loaderData {
    sidebarGroups: FwSidebarGroupProps[]
    breadcrumbs: IBreadcrumb[],
    toc: MetadataMap,
    slug: string
    code: string
    metadata: Metadata | null
    rawPage: string // TODO: in the future routing like /docs/quickstart.md but some issues with react-router like *.md in `route` config
    navlinks?: INavLinks,
}

class timedebugLoader {
    static get total() {
        console.time('loader:total')

        return
    }

    static get totalEnd() {
        console.timeEnd('loader:total')

        return
    }

    static get compile() {
        console.time('loader:compile')

        return
    }

    static get compileEnd() {
        console.timeEnd('loader:compile')

        return
    }

    static get mapSettingsToProps() {
        console.time('loader:mapSettingsToProps')

        return
    }

    static get mapSettingsToPropsEnd() {
        console.timeEnd('loader:mapSettingsToProps')

        return
    }
}

export async function loader({request}: { request: any }) {
    if (!globalThis.__xydPagePathMapping) {
        throw new Error("PagePathMapping not found")
    }
    const timedebug = timedebugLoader

    timedebug.total

    const slug = getPathname(request.url || "index") || "index"
    if (path.extname(slug)) {
        console.log(`(loader): currently not supporting file extension in slug: ${slug}`);
        timedebug.totalEnd
        return {}
    }

    timedebug.mapSettingsToProps
    const {
        groups: sidebarGroups,
        breadcrumbs,
        navlinks,
        hiddenPages,
        metadata
    } = await mapSettingsToProps( // TOOD: we use mapSettingsToProps twice (in layout) - refactor
        settings,
        slug,
    )
    timedebug.mapSettingsToPropsEnd

    console.log(3333)
    function redirectFallback() {
        if (!sidebarGroups) {
            return
        }
        const firstItem = findFirstUrl(sidebarGroups?.[0]?.items);

        if (firstItem) {
            return redirect(firstItem)
        }
    }

    if (hiddenPages?.[slug]) {
        const resp = redirectFallback()
        if (resp) {
            timedebug.totalEnd
            return resp
        }
    }

    let code = ""
    let rawPage = ""

    const pagePath = globalThis.__xydPagePathMapping[slug]
    if (pagePath) {
        timedebug.compile
        code = await contentFs.compile(pagePath)
        rawPage = await contentFs.readRaw(pagePath)
        timedebug.compileEnd
    } else {
        const resp = redirectFallback()
        if (resp) {
            timedebug.totalEnd
            return resp
        }
    }

    timedebug.totalEnd

    console.log("FINISHED")

    return {
        sidebarGroups,
        breadcrumbs,
        navlinks,
        slug,
        code,
        metadata,
        rawPage,
    } as loaderData
}

interface MetaProps {
    title?: string

    name?: string

    property?: string

    content?: string
}

// TODO: better SEO
export function meta(props: any) {
    const {
        title = "",
        description = "",

        ["og:title"]: ogTitle = "",
        ["og:description"]: ogDescription = "",
        ["og:image"]: ogImage = "",
    } = props?.data?.metadata || {}

    const meta: MetaProps[] = [
        {title: title},
        {
            name: "description",
            content: description,
        },
    ]

    {
        if (ogTitle) {
            meta.push({
                property: "og:title",
                content: ogTitle,
            })
        }
        if (ogDescription) {
            meta.push({
                property: "og:description",
                content: ogDescription,
            })
        }
        if (ogImage) {
            meta.push({
                property: "og:image",
                content: ogImage,
            })
        }
    }

    return meta
}

function findFirstUrl(items: any = []): string {
    const queue = [...items];

    while (queue.length > 0) {
        const item = queue.shift();

        if (item.href) {
            return item.href;
        }

        if (item.items) {
            queue.push(...item.items);
        }
    }

    return "";
}

const createElementWithKeys = (type: any, props: any) => {
    // Process children to add keys to all elements
    const processChildren = (childrenArray: any[]): any[] => {
        return childrenArray.map((child, index) => {
            // If the child is a React element and doesn't have a key, add one
            if (React.isValidElement(child) && !child.key) {
                return React.cloneElement(child, {key: `mdx-${index}`});
            }
            // If the child is an array, process it recursively
            if (Array.isArray(child)) {
                return processChildren(child);
            }
            return child;
        });
    };

    // Handle both cases: children as separate args or as props.children
    let processedChildren;

    if (props && props.children) {
        if (Array.isArray(props.children)) {
            processedChildren = processChildren(props.children);
        } else if (React.isValidElement(props.children) && !props.children.key) {
            // Single child without key
            processedChildren = React.cloneElement(props.children, {key: 'mdx-child'});
        } else {
            // Single child with key or non-React element
            processedChildren = props.children;
        }
    } else {
        processedChildren = [];
    }

    // Create the element with processed children
    return React.createElement(type, {
        ...props,
        children: processedChildren
    });
};

// TODO: move to content?
function mdxExport(code: string) {
    // Create a wrapper around React.createElement that adds keys to elements in lists

    const scope = {
        Fragment: React.Fragment,
        jsxs: createElementWithKeys,
        jsx: createElementWithKeys,
        jsxDEV: createElementWithKeys,
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
        metadata: content?.frontmatter,
        themeSettings: content?.themeSettings || {},
        page: content?.page || false,
    }
}

export function MemoMDXComponent(codeComponent: any) {
    return useMemo(
        () => codeComponent ? codeComponent : null,
        [codeComponent]
    )
}

export default function DocsPage({loaderData}: { loaderData: loaderData }) {
    const location = useLocation()
    const {theme} = useContext(PageContext)
    if (!theme) {
        throw new Error("BaseTheme not found")
    }

    const content = mdxContent(loaderData.code)
    const Content = MemoMDXComponent(content.component)

    const themeContentComponents = theme.reactContentComponents()
    const {Page} = theme

    return <FrameworkPage
        key={location.pathname}
        metadata={content.metadata}
        breadcrumbs={loaderData.breadcrumbs}
        rawPage={loaderData.rawPage}
        toc={content.toc || []}
        navlinks={loaderData.navlinks}
        ContentComponent={Content}
    >
        <Page>
            <Content components={themeContentComponents}/>
            <ScrollRestoration/>
        </Page>
    </FrameworkPage>
}
