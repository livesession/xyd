import {
    Outlet,
    useLoaderData,
    useLocation,
    useNavigate,
    useNavigation,
    type Route,
    isRouteErrorResponse,
    useMatches
} from "react-router";

import { mapSettingsToProps } from "@xyd-js/framework/hydration";

import type { Metadata, MetadataMap, Theme as ThemeSettings } from "@xyd-js/core";
import type { INavLinks, IBreadcrumb } from "@xyd-js/ui";
import { Framework, FwLink, useSettings, type FwSidebarGroupProps } from "@xyd-js/framework/react";
import { ReactContent } from "@xyd-js/components/content";
import { Atlas, AtlasContext } from "@xyd-js/atlas";
import { Surfaces } from "@xyd-js/framework/react";
import { Composer } from "@xyd-js/composer";
import { BaseTheme } from "@xyd-js/themes";
import parse from 'html-react-parser';
// @ts-ignore
import { iconSet } from 'virtual:xyd-icon-set';

// @ts-ignore
import virtualSettings from "virtual:xyd-settings";
// @ts-ignore
const { settings: getSettings } = virtualSettings
// const settings = globalThis.__xydSettings
import Theme from "virtual:xyd-theme";

// @ts-ignore
import "virtual:xyd-theme/index.css"
import "virtual:xyd-theme-override/index.css"

import { PageContext } from "./context";
import { ReactElement, SVGProps } from "react";
import React from "react";

globalThis.__xydSettings = getSettings
    
new Composer() // TODO: better API
const settings = globalThis.__xydSettings

// TODO: better place for that? - it should be managed by framework?
function Icon({name, width = 24, height = 24}: {name: string, width?: number, height?: number}) {
    if (!iconSet) {
        return null
    }

    const ico = iconSet[name]
    if (!ico || !ico.svg) {
        return null
    }

    const icon = parse(ico.svg) as ReactElement<SVGProps<SVGSVGElement>>
    if (React.isValidElement(icon)) {
        return React.cloneElement(icon, {
            width,
            height,
            style: { width, height }
        })
    }

    return null
}


const surfaces = new Surfaces()
const reactContent = new ReactContent(settings, {
    Link: FwLink,
    components: {
        Atlas,
        Icon
    },
    useLocation, // // TODO: !!!! BETTER API !!!!!
    useNavigate,
    useNavigation
})
globalThis.__xydThemeSettings = settings?.theme
globalThis.__xydReactContent = reactContent
globalThis.__xydSurfaces = surfaces

const theme = new Theme()

const { Layout: BaseThemeLayout } = theme

interface LoaderData {
    sidebarGroups: FwSidebarGroupProps[]
    breadcrumbs: IBreadcrumb[],
    toc: MetadataMap,
    slug: string
    metadata: Metadata | null
    navlinks?: INavLinks,
}

export async function loader({ request }: { request: any }) {
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

    return {
        sidebarGroups,
        breadcrumbs,
        navlinks,
        slug,
        metadata,
    } as LoaderData
}

export default function Layout() {
    const loaderData = useLoaderData<LoaderData>()
    const matches = useMatches()

    const lastMatchId = matches[matches.length - 1]?.id || null

    let atlasVariantToggleKey = ""
    let atlasDefaultVariantValue = ""

    // TODO: BETTER HANDLE THAT
    if (loaderData.metadata?.openapi) {
        atlasVariantToggleKey = "status"
        atlasDefaultVariantValue = "200"
    } else {
        atlasVariantToggleKey = "symbolName"
    }

    return <>
        <Framework
            settings={settings || globalThis.__xydSettings}
            sidebarGroups={loaderData.sidebarGroups || []}
            metadata={loaderData.metadata || {}}
            surfaces={surfaces}
            IconComponent={Icon}
        >
            <AtlasContext
                value={{
                    syntaxHighlight: settings?.theme?.markdown?.syntaxHighlight || null,
                    baseMatch: lastMatchId || "",
                    variantToggleKey: atlasVariantToggleKey,
                    defaultVariantValue: atlasDefaultVariantValue
                }}
            >
                <BaseThemeLayout>
                    <PageContext value={{ theme }}>
                        <Outlet />
                    </PageContext>
                </BaseThemeLayout>
            </AtlasContext>
        </Framework>
    </>
}

function getPathname(url: string) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\//, '');
}

