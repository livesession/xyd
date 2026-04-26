import path from "node:path";

import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useContext, useState, ReactElement, SVGProps, useEffect } from "react";
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
import "virtual:xyd-scripts";
// @ts-ignore
const { settings, userHooks } = virtualSettings as Settings

import { PageContext } from "./context";
import { SUPPORTED_META_TAGS } from "./metatags";
import { useAnalytics } from "@xyd-js/analytics";

function getPathname(url: string, basename?: string) {
    const parsedUrl = new URL(url);
    let pathname = parsedUrl.pathname;
    
    // Trim basename from the pathname if it exists
    if (basename && basename !== "/" && pathname.startsWith(basename)) {
        pathname = pathname.slice(basename.length);
    }
    
    // Ensure we have a leading slash and then remove it to get the slug
    if (!pathname.startsWith("/")) {
        pathname = "/" + pathname;
    }
    
    return pathname.replace(/^\//, '');
}

declare global {
    interface Window {
        __xydAuthState?: { authenticated: boolean; groups: string[]; token: string | null };
    }
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
    canPassComponents?: boolean
    /** When true, this page is protected and content was excluded from SSR */
    shellOnly?: boolean
    /** File path for dynamic content loading after auth */
    protectedPagePath?: string
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

    const slug = getPathname(request.url || "index", settings?.advanced?.basename) || "index"
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

    const remarkPlugins = [
        ...mdPlugins.remarkPlugins,
    ]
    const rehypePlugins = [
        ...mdPlugins.rehypePlugins
    ]

    if (globalThis.__xydUserMarkdownPlugins?.remark?.length) {
        remarkPlugins.push(
            globalThis.__xydUserMarkdownPlugins?.remark
        )
    }
    if (globalThis.__xydUserMarkdownPlugins?.rehype?.length) {
        rehypePlugins.push(
            globalThis.__xydUserMarkdownPlugins?.rehype
        )
    }

    const contentFs = new ContentFS(
        settings,
        remarkPlugins,
        rehypePlugins,
        mdPlugins.recmaPlugins,
        globalThis?.__xydUserMarkdownPlugins?.remarkRehypeHandlers || {}
    )

    let pagePath = globalThis.__xydPagePathMapping[slug]

    // SSR page exclusion: skip content compilation for protected pages.
    // Uses globalThis.__xydAccessMap directly (set by the access control plugin)
    // instead of the virtual module, because the loader runs server-side during SSR.
    let shellOnly = false
    let protectedPagePath: string | undefined

    const accessMap: Record<string, string> | undefined = (globalThis as any).__xydAccessMap



    // When edge middleware is configured, skip shellOnly — the edge server
    // handles protection, so pre-rendered HTML can include full content.
    const hasEdge = !!(globalThis as any).__xydSettings?.accessControl?.edge

    if (pagePath && accessMap && !hasEdge) {
        const pageAccess = accessMap["/" + slug] || accessMap[slug]
        if (pageAccess && pageAccess !== "public") {
            const cookieName = (globalThis as any).__xydSettings?.accessControl?.session?.cookieName || "xyd-auth-token"
            const cookieHeader = request?.headers?.get?.("cookie") || ""
            const hasAuthCookie = cookieHeader.includes(`${cookieName}=`)
            const isBypassed = process.env.XYD_AUTH_BYPASS === "1" || process.env.XYD_AUTH_BYPASS === "true"

            if (!hasAuthCookie && !isBypassed) {
                shellOnly = true
                protectedPagePath = pagePath
            }
        }
    }

    if (pagePath && !shellOnly) {
        timedebug.compile
        code = await contentFs.compile(pagePath)
        rawPage = await contentFs.readRaw(pagePath)
        timedebug.compileEnd
    } else if (!pagePath) {
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

    let baseUrl = settings?.integrations?.editLink?.baseUrl

    if (baseUrl && baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1)
    }

    if (pagePath && !pagePath.startsWith("/")) {
        pagePath = `/${pagePath}`
    }

    let editLink = baseUrl ?
        `${baseUrl}${pagePath}` :
        undefined


    let canPassComponents = true

    const applyComponentsHooks = globalThis.__xydUserHooks?.applyComponents 

    if (Array.isArray(applyComponentsHooks)) {
        for (const hook of applyComponentsHooks) {
            if (typeof hook !== "function") {
                continue
            }

            const can = hook({
                metadata: metadata
            })

            if (!can) {
                canPassComponents = false
                break
            }
        }
    }

    // Access control: filter navlinks based on user's auth state and groups
    let filteredNavlinks = navlinks
    if (accessMap && navlinks) {
        // Extract user groups from cookie
        const acCookieName = (globalThis as any).__xydSettings?.accessControl?.session?.cookieName || "xyd-auth-token"
        const acGroupsClaim = ((globalThis as any).__xydSettings?.accessControl?.provider as any)?.groupsClaim || "groups"
        const acCookieHeader = request?.headers?.get?.("cookie") || ""
        const acIsBypassed = process.env.XYD_AUTH_BYPASS === "1" || process.env.XYD_AUTH_BYPASS === "true"

        let acUserGroups: string[] = []
        let acIsAuth = false
        if (acIsBypassed) {
            acIsAuth = true
            acUserGroups = ["*"]
        } else {
            const acMatch = acCookieHeader.match(new RegExp(`${acCookieName}=([^;]+)`))
            if (acMatch) {
                acIsAuth = true
                try { acUserGroups = JSON.parse(atob(acMatch[1].split(".")[1]))[acGroupsClaim] || [] } catch {}
            }
        }

        const canAccessLink = (link: any) => {
            if (!link?.href) return true
            const href = link.href.startsWith("/") ? link.href : `/${link.href}`
            const access = accessMap[href] || accessMap[link.href]
            if (!access || access === "public") return true
            if (!acIsAuth) return false
            if (access === "authenticated") return true
            if (acUserGroups.includes("*")) return true
            return access.split(",").some(g => acUserGroups.includes(g))
        }
        filteredNavlinks = {
            prev: navlinks.prev && canAccessLink(navlinks.prev) ? navlinks.prev : undefined,
            next: navlinks.next && canAccessLink(navlinks.next) ? navlinks.next : undefined,
        } as any
    }

    return {
        sidebarGroups,
        breadcrumbs,
        navlinks: filteredNavlinks,
        slug,
        code,
        metadata,
        rawPage,
        editLink,
        canPassComponents,
        shellOnly,
        protectedPagePath,
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
        page: content?.page || false
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

    // Protected page shell: hooks must always run (React rules of hooks).
    // Start with empty shell (matches server), switch after hydration if authenticated.
    const [shellReady, setShellReady] = useState(false)
    useEffect(() => {
        if (loaderData.shellOnly && window.__xydAuthState?.authenticated) {
            setShellReady(true)
        }
    }, [loaderData.shellOnly])

    if (loaderData.shellOnly) {
        if (!shellReady) return <div />
        return <ProtectedPageShell loaderData={loaderData} />
    }
    // NOTE: all hooks above this line always run regardless of shellOnly

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

    let userComponents = {}

    if (loaderData.canPassComponents) {
        userComponents = (globalThis.__xydUserComponents || []).reduce((acc, component) => {
            acc[component.name] = component.component;
            return acc;
        }, {});
    }


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
                        wrapper: (props) => { // TODO: in the future support composition wrapper
                            // TODO: in the future delete uxnod
                            return <UXNode
                                name=".ContentPage"
                                props={{}}
                            >
                                {props.children}
                            </UXNode>
                        },
                        ...userComponents,
                    }} />
                    <ScrollRestoration />
                </Page>
            </FrameworkPage>
        </UXNode>
    </>
}

/**
  * Protected page shell: loads content dynamically after auth.
 * Used when the page was pre-rendered as shellOnly (no content in HTML).
 */
function ProtectedPageShell({ loaderData }: { loaderData: loaderData }) {
    const location = useLocation()
    const [contentCode, setContentCode] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const analytics = useAnalytics()
    const pageCtx = useContext(PageContext)
    const theme = pageCtx?.theme

    useEffect(() => {
        async function loadProtectedContent() {
            try {
                const response = await fetch(
                    `/__xyd_protected_content/${encodeURIComponent(loaderData.slug)}.js`
                )
                if (response.ok) {
                    setContentCode(await response.text())
                }
            } catch (e) {
                console.error("[xyd:access-control] Failed to load protected content:", e)
            } finally {
                setIsLoading(false)
            }
        }
        loadProtectedContent()
    }, [loaderData.slug])

    if (!theme) {
        return <div style={{ padding: "48px 24px", textAlign: "center", color: "#6e6e80" }}>
            {isLoading ? "Loading..." : "Authentication required."}
        </div>
    }

    const { Page } = theme

    // If content loaded successfully, render it
    if (contentCode) {
        const themeContentComponents = theme.reactContentComponents()
        const themeFileComponents = theme.reactFileComponents()
        const globalAPI = { analytics }

        const content = mdxContent(contentCode, themeContentComponents, themeFileComponents, globalAPI)
        const Content = MemoMDXComponent(content.component)
        const contentOriginal = mdxContent(contentCode, themeContentComponents, undefined, globalAPI)
        const ContentOriginal = MemoMDXComponent(contentOriginal.component)

        let userComponents = {}
        if (loaderData.canPassComponents) {
            userComponents = (globalThis.__xydUserComponents || []).reduce((acc, component) => {
                acc[component.name] = component.component
                return acc
            }, {})
        }

        return <>
            <UXNode
                name="Framework"
                props={{ location: location.pathname + location.search + location.hash }}
            >
                <FrameworkPage
                    key={location.pathname}
                    metadata={content.metadata}
                    breadcrumbs={loaderData.breadcrumbs}
                    rawPage=""
                    toc={content.toc || []}
                    navlinks={loaderData.navlinks}
                    ContentComponent={Content}
                    ContentOriginal={ContentOriginal}
                    editLink={loaderData.editLink}
                >
                    <Page>
                        <ContentOriginal components={{
                            ...themeContentComponents,
                            wrapper: (props) => (
                                <UXNode name=".ContentPage" props={{}}>
                                    {props.children}
                                </UXNode>
                            ),
                            ...userComponents,
                        }} />
                        <ScrollRestoration />
                    </Page>
                </FrameworkPage>
            </UXNode>
        </>
    }

    // Shell: render page layout without content
    return <>
        <UXNode
            name="Framework"
            props={{ location: location.pathname + location.search + location.hash }}
        >
            <FrameworkPage
                key={location.pathname}
                metadata={loaderData.metadata}
                breadcrumbs={loaderData.breadcrumbs}
                rawPage=""
                toc={[]}
                navlinks={loaderData.navlinks}
                ContentComponent={null}
                ContentOriginal={null}
                editLink={loaderData.editLink}
            >
                <Page>
                    <div data-auth-protected>
                        {isLoading ? (
                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                padding: "48px 0",
                                color: "var(--dark48, #6e6e80)",
                                fontSize: "var(--xyd-font-size-small, 14px)",
                            }}>
                                Loading...
                            </div>
                        ) : (
                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                padding: "48px 0",
                                color: "var(--dark48, #6e6e80)",
                                fontSize: "var(--xyd-font-size-small, 14px)",
                            }}>
                                Authentication required to view this content.
                            </div>
                        )}
                    </div>
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
