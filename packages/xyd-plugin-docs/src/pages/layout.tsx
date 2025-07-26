import { useMemo } from "react";
import {
    Outlet,
    useLoaderData,
    useLocation,
    useNavigate,
    useNavigation,
    useMatches
} from "react-router";

import { mapSettingsToProps } from "@xyd-js/framework/hydration";

import type { Metadata, MetadataMap, Settings, Theme as ThemeSettings } from "@xyd-js/core";
import type { INavLinks, IBreadcrumb } from "@xyd-js/ui";
import { Framework, FwLink, FwLogo, useSettings, type FwSidebarItemProps } from "@xyd-js/framework/react";
import { ReactContent } from "@xyd-js/components/content";
import { Atlas, AtlasContext, type VariantToggleConfig } from "@xyd-js/atlas";
import AtlasXydPlugin from "@xyd-js/atlas/xydPlugin";

import { Surfaces, pageMetaLayout } from "@xyd-js/framework";
import { Composer } from "@xyd-js/composer";
import { XYDAnalytics } from "@xyd-js/analytics";
// @ts-ignore
import { iconSet } from 'virtual:xyd-icon-set';

// @ts-ignore
import virtualSettings from "virtual:xyd-settings";
// @ts-ignore
const { settings: getSettings, settingsClone } = virtualSettings

// const settings = globalThis.__xydSettings
import Theme from "virtual:xyd-theme";
// @ts-ignore
import { loadProvider } from 'virtual:xyd-analytics-providers'

// @ts-ignore
import "virtual:xyd-theme/index.css"
import "virtual:xyd-theme-override/index.css"

// @ts-ignore
import { components as userComponents } from 'virtual:xyd-user-components';

import { PageContext } from "./context";
import React from "react";

import { markdownPlugins } from "@xyd-js/content/md";
import { ContentFS } from "@xyd-js/content";
import { Icon, IconProvider } from "@xyd-js/components/writer";
import { CoderProvider } from "@xyd-js/components/coder";
import { SearchButton } from "@xyd-js/components/system"

globalThis.__xydSettings = getSettings
globalThis.__xydSettingsClone = settingsClone
globalThis.__xydUserComponents = userComponents // Add user components to global scope TODO: problematic

const settings = globalThis.__xydSettings as Settings

// console.log(JSON.stringify(settings?.navigation?.sidebar, null, 2), "settings?.navigation?.sidebar")

const surfaces = new Surfaces()
const atlasXyd = AtlasXydPlugin()(settings) // TODO: in the future via standard plugin API
const SidebarItemRight = atlasXyd?.customComponents?.["AtlasSidebarItemRight"]

if (SidebarItemRight) {
    surfaces.define(
        SidebarItemRight.surface,
        SidebarItemRight.component,
    )
}

const reactContent = new ReactContent(settings, {
    Link: FwLink,
    components: {
        Atlas,
    },
    useLocation, // // TODO: !!!! BETTER API !!!!!
    useNavigate,
    useNavigation
})
globalThis.__xydThemeSettings = settings?.theme
globalThis.__xydNavigation = settings?.navigation
globalThis.__xydWebeditor = settings?.webeditor
globalThis.__xydReactContent = reactContent
globalThis.__xydSurfaces = surfaces

const theme = new Theme()
//@ts-ignore TODO: in the future better api like PageLoad interface or something like that
if (theme.mergeUserAppearance) {
    // its needed after user declaration
    //@ts-ignore
    theme.mergeUserAppearance()
}

if (
    settings?.theme?.appearance?.sidebar?.scrollbar === "secondary"
) {
    import("@xyd-js/themes/decorators/sidebar-scroll.css").catch(() => {
        // Ignore CSS import errors during development
    });
}

const { Layout: BaseThemeLayout } = theme

interface LoaderData {
    sidebarGroups: FwSidebarItemProps[]
    breadcrumbs: IBreadcrumb[],
    toc: MetadataMap,
    slug: string
    metadata: Metadata | null
    navlinks?: INavLinks,
    bannerContentCode?: string
}

export async function loader({ request }: { request: any }) {
    new Composer() // TODO: better API

    const slug = getPathname(request.url || "index") || "index"

    const {
        groups: sidebarGroups,
        breadcrumbs,
        navlinks,
        metadata
    } = await mapSettingsToProps(
        settings,
        globalThis.__xydPagePathMapping,
        slug,
    )

    let bannerContentCode = ""

    const mdPlugins = markdownPlugins({
        maxDepth: metadata?.maxTocDepth || settings?.theme?.writer?.maxTocDepth || 2,
    }, settings)
    const contentFs = new ContentFS(settings, mdPlugins.remarkPlugins, mdPlugins.rehypePlugins)

    if (settings?.components?.banner?.content && typeof settings?.components?.banner?.content === "string") {
        bannerContentCode = await contentFs.compileContent(
            settings?.components?.banner?.content,
        )
    }

    // TODO: IN THE FUTURE BETTER API
    const layout = pageMetaLayout(metadata)
    if (metadata && layout) {
        metadata.layout = layout
    }

    return {
        sidebarGroups,
        breadcrumbs,
        navlinks,
        slug,
        metadata,
        bannerContentCode
    } as LoaderData
}

export default function Layout() {
    const loaderData = useLoaderData<LoaderData>()
    const matches = useMatches()

    const lastMatchId = matches[matches.length - 1]?.id || null

    let atlasVariantToggles: VariantToggleConfig[] = [];

    // TODO: BETTER HANDLE THAT
    if (loaderData.metadata?.openapi) {
        atlasVariantToggles = [
            { key: "status", defaultValue: "200" },
            { key: "contentType", defaultValue: "application/json" }
        ];
    } else {
        atlasVariantToggles = [
            { key: "symbolName", defaultValue: "" }
        ];
    }

    let bannerContent: any = null
    // TODO: !!!! BETTER API !!!!
    if (loaderData.bannerContentCode) {
        const content = mdxContent(loaderData.bannerContentCode)
        const BannerContent = MemoMDXComponent(content.component)

        bannerContent = function () {
            return <BannerContent components={theme.reactContentComponents()} />
        }
    }

    const userComponents = (globalThis.__xydUserComponents || []).reduce((acc, component) => {
        acc[component.name] = component.component;
        return acc;
    }, {});

    return <>
        <XYDAnalytics settings={settings} loader={loadProvider}>
            <IconProvider value={{
                iconSet: iconSet
            }}>
                <Framework
                    settings={settings || globalThis.__xydSettings}
                    sidebarGroups={loaderData.sidebarGroups || []}
                    metadata={loaderData.metadata || {}}
                    surfaces={surfaces}
                    BannerContent={bannerContent}
                    components={{
                        Search: SearchButton,
                        Logo: FwLogo,
                        ...userComponents
                    }}
                >
                    <AtlasContext
                        value={{
                            syntaxHighlight: settings?.theme?.coder?.syntaxHighlight || null,
                            baseMatch: lastMatchId || "",
                            variantToggles: atlasVariantToggles
                        }}
                    >
                        <CoderProvider lines={settings?.theme?.coder?.lines} scroll={settings?.theme?.coder?.scroll}>
                            <BaseThemeLayout>
                                <PageContext value={{ theme }}>
                                    <Outlet />
                                </PageContext>
                            </BaseThemeLayout>
                        </CoderProvider>
                    </AtlasContext>
                </Framework>
            </IconProvider>
        </XYDAnalytics>
    </>
}

function getPathname(url: string) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\//, '');
}


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
    }
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

function MemoMDXComponent(codeComponent: any) {
    return useMemo(
        () => codeComponent ? codeComponent : null,
        [codeComponent]
    )
}
