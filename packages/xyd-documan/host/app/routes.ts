import path from "node:path";

import {
    route,
    layout,
} from "@react-router/dev/routes";
import { Settings } from "@xyd-js/core";

// Declare the global property type
declare global {
    var __xydBasePath: string;
}

const basePath = globalThis.__xydBasePath

// TODO: !!!! NESTED ROUTES !!!
function getDocsRoutes(navigation: Settings['navigation']) {
    if (!navigation?.sidebar) return [];

    const routes: string[] = [];

    // Process each sidebar group
    navigation.sidebar.forEach(sidebarGroup => {
        // Add the route of the sidebar group
        if ('route' in sidebarGroup) {
            const route = sidebarGroup.route;
            if (route) {
                routes.push(route.startsWith("/") ? route : `/${route}`)
            }
        }
    });

    return routes.map(r => {
        return layout(path.join(basePath, "src/pages/layout.tsx"), { id: `layout:${r}` }, [
            route(r + "/*", path.join(basePath, "src/pages/page.tsx"), { id: r })
        ])
    })
}

const navigation = __xydSettings?.navigation || { sidebar: [] };
const docsRoutes = getDocsRoutes(navigation)

// TODO: !!!! if not routes found then '*' !!!
export const routes = [
    ...docsRoutes,
]

if (globalThis.staticFiles?.length) {
    routes.push(route("/public/*", "./public.ts"))
}

export default routes

