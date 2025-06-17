import {useMemo} from "react";
import {
    Outlet,
    useLoaderData,
    useLocation,
    useNavigate,
    useNavigation,
    useMatches
} from "react-router";

import {mapSettingsToProps} from "@xyd-js/framework/hydration";

import type {Metadata, MetadataMap, Theme as ThemeSettings} from "@xyd-js/core";
import type {INavLinks, IBreadcrumb} from "@xyd-js/ui";
import {Framework, FwLink, useSettings, type FwSidebarGroupProps} from "@xyd-js/framework/react";
import {ReactContent} from "@xyd-js/components/content";
import {Atlas, AtlasContext, type VariantToggleConfig} from "@xyd-js/atlas";
import AtlasXydPlugin from "@xyd-js/atlas/xydPlugin";

import {Surfaces} from "@xyd-js/framework/react";
import {Composer} from "@xyd-js/composer";
// @ts-ignore
import {iconSet} from 'virtual:xyd-icon-set';

// @ts-ignore
import virtualSettings from "virtual:xyd-settings";
// @ts-ignore
const {settings: getSettings} = virtualSettings
// const settings = globalThis.__xydSettings
import Theme from "virtual:xyd-theme";

// @ts-ignore
import "virtual:xyd-theme/index.css"
import "virtual:xyd-theme-override/index.css"

import {PageContext} from "./context";
import React from "react";
import {markdownPlugins} from "@xyd-js/content/md";
import {ContentFS} from "@xyd-js/content";
import {IconProvider} from "@xyd-js/components/writer";

globalThis.__xydSettings = getSettings

new Composer() // TODO: better API
const settings = globalThis.__xydSettings

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
globalThis.__xydReactContent = reactContent
globalThis.__xydSurfaces = surfaces

const theme = new Theme()

const {Layout: BaseThemeLayout} = theme

interface LoaderData {
    sidebarGroups: FwSidebarGroupProps[]
    breadcrumbs: IBreadcrumb[],
    toc: MetadataMap,
    slug: string
    metadata: Metadata | null
    navlinks?: INavLinks,
    bannerContentCode?: string
}

export async function loader({request}: { request: any }) {
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
        maxDepth: metadata?.maxTocDepth || settings?.theme?.maxTocDepth || 2,
    }, settings)
    const contentFs = new ContentFS(settings, mdPlugins.remarkPlugins, mdPlugins.rehypePlugins)

    if (settings?.theme?.banner?.content && typeof settings?.theme?.banner?.content === "string") {
        bannerContentCode = await contentFs.compileContent(
            settings?.theme?.banner?.content,
        )
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
            {key: "status", defaultValue: "200"},
            {key: "contentType", defaultValue: "application/json"}
        ];
    } else {
        atlasVariantToggles = [
            {key: "symbolName", defaultValue: ""}
        ];
    }

    let BannerComponent: any = null
    // TODO: !!!! BETTER API !!!!
    if (loaderData.bannerContentCode) {
        const bannerContent = mdxContent(loaderData.bannerContentCode)
        const BannerContent = MemoMDXComponent(bannerContent.component)

        BannerComponent = function () {
            return <BannerContent components={theme.reactContentComponents()}/>
        }
    }

    return <>
        <IconProvider value={{
            iconSet: iconSet
        }}>
            <Framework
                settings={settings || globalThis.__xydSettings}
                sidebarGroups={loaderData.sidebarGroups || []}
                metadata={loaderData.metadata || {}}
                surfaces={surfaces}
                BannerComponent={BannerComponent}
            >
                <AtlasContext
                    value={{
                        syntaxHighlight: settings?.theme?.markdown?.syntaxHighlight || null,
                        baseMatch: lastMatchId || "",
                        variantToggles: atlasVariantToggles
                    }}
                >
                    <BaseThemeLayout>
                        <PageContext value={{theme}}>
                            <Outlet/>
                        </PageContext>
                    </BaseThemeLayout>
                </AtlasContext>
            </Framework>
        </IconProvider>
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

function MemoMDXComponent(codeComponent: any) {
    return useMemo(
        () => codeComponent ? codeComponent : null,
        [codeComponent]
    )
}
