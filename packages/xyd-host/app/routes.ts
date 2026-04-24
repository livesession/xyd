import path from "node:path";
import {
    index,
    layout,
    route,
} from "@react-router/dev/routes";
import {pathRoutes} from "./pathRoutes";

// Declare the global property type
declare global {
    var __xydBasePath: string;
    var __xydRawRouteFiles: {[path: string]: string};
}

const basePath = globalThis.__xydBasePath

const navigation = __xydSettings?.navigation || {sidebar: []};
const docsRoutes = pathRoutes(basePath, navigation)

// TODO: !!!! if not routes found then '*' !!!
export const routes = [
    ...docsRoutes,

    // TODO: in the future better sitemap + robots.txt
    route("/sitemap.xml", "./sitemap.ts"), // TODO: it should be __xydRawRouteFiles + overwrite 
    route("/robots.txt", "./robots.ts"), // TODO: it should be __xydRawRouteFiles + overwrite 
    route(
        "/.well-known/appspecific/com.chrome.devtools.json",
        "./debug-null.tsx",
    ),
]

if (globalThis.__xydStaticFiles?.length) {
    routes.push(route("/public/*", "./public.ts"))
}

if (globalThis.__xydRawRouteFiles) {
    Object.keys(globalThis.__xydRawRouteFiles).forEach(rawPath => {
        routes.push(route(rawPath, "./rawFile.ts", {id: rawPath}))
    })
}

// Plugin pages: custom React component pages with minimal layout (no docs sidebar)
if ((globalThis as any).__xydPluginPageRoutes) {
    for (const pageRoute of (globalThis as any).__xydPluginPageRoutes) {
        routes.push(
            layout(
                "./pluginPageLayout.tsx",
                { id: `layout:plugin-page:${pageRoute}` },
                [
                    route(pageRoute, "./pluginPage.tsx", { id: `plugin-page:${pageRoute}` })
                ]
            )
        )
    }
}

export default routes

