import path from "node:path";

import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useContext, ReactElement, SVGProps, useEffect } from "react";
import { redirect, ScrollRestoration, useLocation, useNavigation } from "react-router";

import { MetadataMap, Metadata, Settings } from "@xyd-js/core"
import { ContentFS } from "@xyd-js/content"
import { markdownPlugins } from "@xyd-js/content/md"
import { pageMetaLayout } from "@xyd-js/framework";
import { mapSettingsToProps } from "@xyd-js/framework/hydration";
import { FrameworkPage, type FwSidebarItemProps } from "@xyd-js/framework/react";
import type { IBreadcrumb, INavLinks } from "@xyd-js/ui";
import { UXNode } from "openux-js";

// @ts-ignore
import virtualSettings from "virtual:xyd-settings";
// @ts-ignore
const { settings } = virtualSettings as Settings

import { PageContext } from "./context";
import { SUPPORTED_META_TAGS } from "./metatags";
import { useAnalytics } from "@xyd-js/analytics";

function getPathname(url: string) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\//, '');
}

interface loaderData {
    sidebarGroups: FwSidebarItemProps[]
    breadcrumbs: IBreadcrumb[],
    toc: MetadataMap,
    slug: string
    code: string
    metadata: Metadata | null
    rawPage: string // TODO: in the future routing like /docs/quickstart.md but some issues with react-router like *.md in `route` config
    navlinks?: INavLinks,
    editLink?: string,
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

export async function loader({ request }: { request: any }) {
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
        settings || globalThis.__xydSettings,
        globalThis.__xydPagePathMapping,
        slug,
    )
    timedebug.mapSettingsToPropsEnd

    function redirectFallback() {
        const fallbackUrl = findFallbackUrl(sidebarGroups, slug)

        return redirect(fallbackUrl)
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

    const mdPlugins = await markdownPlugins({
        maxDepth: metadata?.maxTocDepth || settings?.theme?.writer?.maxTocDepth || 2,
    }, settings)

    const contentFs = new ContentFS(settings, mdPlugins.remarkPlugins, mdPlugins.rehypePlugins, mdPlugins.recmaPlugins)

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

    if (metadata) {
        metadata.layout = pageMetaLayout(metadata)
    }

    let editLink = settings?.integrations?.editLink?.baseUrl ?
        path.join(settings?.integrations?.editLink?.baseUrl || "", pagePath) :
        undefined

    return {
        sidebarGroups,
        breadcrumbs,
        navlinks,
        slug,
        code,
        metadata,
        rawPage,
        editLink,
    } as loaderData
}

interface MetaTag {
    title?: string

    name?: string

    property?: string

    content?: string
}

// TODO: better SEO (use https://github.com/unjs/unhead?)
export function meta(props: any) {
    const {
        title = "",
        description = "",
    } = props?.data?.metadata || {}

    const metaTags: MetaTag[] = [
        { title: title },
    ]

    if (description) {
        metaTags.push({
            name: "description",
            content: description,
        })
    }

    const metaTagsMap: { [key: string]: MetaTag } = {}

    for (const key in settings?.seo?.metatags) {
        const metaType = SUPPORTED_META_TAGS[key]
        if (!metaType) {
            continue
        }

        if (description && key === "description") {
            continue
        }

        metaTagsMap[key] = {
            [metaType]: key,
            content: settings?.seo?.metatags[key],
        }
    }

    // TOOD: filter?
    for (const key in props?.data?.metadata) {
        const metaType = SUPPORTED_META_TAGS[key]
        if (!metaType) {
            continue
        }

        if (description && key === "description") {
            continue
        }

        metaTagsMap[key] = {
            [metaType]: key,
            content: props?.data?.metadata[key],
        }
    }

    if (props?.data?.metadata?.noindex) {
        metaTagsMap["robots"] = {
            name: "robots",
            content: "noindex",
        }
    }

    for (const key in metaTagsMap) {
        metaTags.push(metaTagsMap[key])
    }

    return metaTags
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

function findFallbackUrl(sidebarGroups: FwSidebarItemProps[], currentSlug: string): string {
    if (!sidebarGroups || sidebarGroups.length === 0) {
        throw new Error("No sidebar groups available for fallback redirect")
    }

    // Iterate through all sidebar groups to find the first valid URL
    for (const group of sidebarGroups) {
        if (!group.items || group.items.length === 0) {
            continue
        }

        const firstItem = findFirstUrl(group.items)

        if (!firstItem) {
            continue
        }

        // Avoid infinite redirects by checking if the found URL is the same as current slug
        if (sanitizeUrl(firstItem) === sanitizeUrl(currentSlug)) {
            console.log("Avoiding infinite redirect: found URL matches current slug", firstItem, currentSlug)
            continue
        }

        return firstItem
    }

    // If we get here, no valid URL was found in any sidebar group
    throw new Error(`No valid fallback URL found for slug: ${currentSlug}.`)
}

const createElementWithKeys = (type: any, props: any) => {
    // Process children to add keys to all elements
    const processChildren = (childrenArray: any[]): any[] => {
        return childrenArray.map((child, index) => {
            // If the child is a React element and doesn't have a key, add one
            if (React.isValidElement(child) && !child.key) {
                return React.cloneElement(child, { key: `mdx-${index}` });
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
            processedChildren = React.cloneElement(props.children, { key: 'mdx-child' });
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
function mdxExport(code: string, themeContentComponents: any, themeFileComponents: any, globalAPI: any) {
    // Create a wrapper around React.createElement that adds keys to elements in lists
    const scope = {
        Fragment: React.Fragment,
        jsxs: createElementWithKeys,
        jsx: createElementWithKeys,
        jsxDEV: createElementWithKeys,
    }

    const global = {
        ...themeContentComponents,
        React,
    }

    const fn = new Function("_$scope", ...Object.keys(global), "fileComponents", ...Object.keys(globalAPI || {}), code);

    return fn(scope, ...Object.values(global), themeFileComponents, ...Object.values(globalAPI));
}

// // TODO: move to content?
function mdxContent(code: string, themeContentComponents: any, themeFileComponents: any, globalAPI: any) {
    const content = mdxExport(code, themeContentComponents, themeFileComponents, globalAPI) // TODO: fix any
    if (!mdxExport) {
        return {}
    }

    // TODO: IN THE FUTURE BETTER API
    const layout = pageMetaLayout(content?.frontmatter)
    if (content?.frontmatter && layout) {
        content.frontmatter.layout = layout
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

export default function DocsPage({ loaderData }: { loaderData: loaderData }) {
    const location = useLocation()
    const navigation = useNavigation()

    const analytics = useAnalytics()

    const { theme } = useContext(PageContext)
    if (!theme) {
        throw new Error("BaseTheme not found")
    }

    // Dispatch custom event when location changes
    useEffect(() => {
        const event = new CustomEvent('xyd::pathnameChange', {
            detail: {
                pathname: location.pathname,
            }
        });

        window.dispatchEvent(event);
    }, [location.pathname]);

    const themeContentComponents = theme.reactContentComponents()
    const themeFileComponents = theme.reactFileComponents()
    const globalAPI = {
        analytics,
    }

    const createContent = (fileComponents) => {
        return mdxContent(loaderData.code, themeContentComponents, fileComponents ? themeFileComponents : undefined, globalAPI)
    }

    const content = createContent(true)
    const Content = MemoMDXComponent(content.component)

    const contentOriginal = createContent(false)
    const ContentOriginal = MemoMDXComponent(contentOriginal.component)

    const { Page } = theme

    return <>
        <UXNode
            name="Framework"
            props={{
                location: location.pathname + location.search + location.hash,
            }}
        >
            <FrameworkPage
                key={location.pathname}
                metadata={content.metadata}
                breadcrumbs={loaderData.breadcrumbs}
                rawPage={loaderData.rawPage}
                toc={content.toc || []}
                navlinks={loaderData.navlinks}
                ContentComponent={Content}
                ContentOriginal={ContentOriginal}
                editLink={loaderData.editLink}
            >
                <Page>
                    <ContentOriginal components={{
                        ...themeContentComponents,
                        wrapper: (props) => {
                            // TODO: in the future delete uxnod
                            return <UXNode
                                name=".ContentPage"
                                props={{}}
                            >
                                {props.children}
                            </UXNode>
                        }
                    }} />
                    <ScrollRestoration />
                </Page>
            </FrameworkPage>
        </UXNode>
    </>
}


function sanitizeUrl(url: string) {
    if (url.startsWith("/")) {
        return url
    }

    return `/${url}`
}
