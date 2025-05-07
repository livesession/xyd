import {Outlet, useLoaderData, useLocation, useNavigate, useNavigation} from "react-router";

import {mapSettingsToProps} from "@xyd-js/framework/hydration";

import type {Metadata, MetadataMap, Theme as ThemeSettings} from "@xyd-js/core";
import type {INavLinks, IBreadcrumb} from "@xyd-js/ui";
import {Framework, FwLink, type FwSidebarGroupProps} from "@xyd-js/framework/react";
import {ReactContent} from "@xyd-js/components/content";
import {Atlas, AtlasContext} from "@xyd-js/atlas";
import {Surfaces} from "@xyd-js/framework/react";

import settings from "virtual:xyd-settings";
import Theme from "virtual:xyd-theme";

import "virtual:xyd-theme/index.css"
import "virtual:xyd-theme-override/index.css"

import {PageContext} from "./context";

interface LoaderData {
    sidebarGroups: FwSidebarGroupProps[]
    breadcrumbs: IBreadcrumb[],
    toc: MetadataMap,
    slug: string
    metadata: Metadata | null
    navlinks?: INavLinks,
}

const surfaces = new Surfaces()
const reactContent = new ReactContent(settings, {
    Link: FwLink,
    components: {
        Atlas
    },
    useLocation, // // TODO: !!!! BETTER API !!!!!
    useNavigate,
    useNavigation
})
globalThis.themeSettings = settings.theme
globalThis.reactContent = reactContent
globalThis.surfaces = surfaces

const theme = new Theme()

const {Layout: BaseThemeLayout} = theme

export async function loader({request}: { request: any }) {
    const slug = getPathname(request.url || "index") || "index"

    const {
        groups: sidebarGroups,
        breadcrumbs,
        navlinks,
        metadata
    } = await mapSettingsToProps(
        settings,
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

    return <>
        <Framework
            settings={settings}
            sidebarGroups={loaderData.sidebarGroups || []}
            metadata={loaderData.metadata || {}}
            surfaces={surfaces}
        >
            <AtlasContext
                value={{
                    syntaxHighlight: settings?.theme?.markdown?.syntaxHighlight || null
                }}
            >
                <BaseThemeLayout>
                    <PageContext value={{theme}}>
                        <Outlet/>
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
