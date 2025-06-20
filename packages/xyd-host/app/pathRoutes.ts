import path from "node:path";

import {Settings} from "@xyd-js/core";
import {layout, route} from "@react-router/dev/routes";

// Helper function to recursively extract route definitions from nested pages
export function pathRoutes(basePath: string, navigation: Settings['navigation']) {
    if (!navigation?.sidebar) return [];

    const routes: string[] = [];

    // Process each sidebar group
    navigation.sidebar.forEach(sidebarGroup => {
        if (typeof sidebarGroup === "string") {
            return
        }

        // Add the route of the sidebar group
        if ('route' in sidebarGroup) {
            const route = sidebarGroup.route;
            if (route) {
                routes.push(route.startsWith("/") ? route : `/${route}`)
            }

            // Process nested pages within this sidebar group
            if (sidebarGroup.pages && Array.isArray(sidebarGroup.pages)) {
                routes.push(...extractNestedRoutes(sidebarGroup.pages));
            }
        }
    });

    if (!routes.length) {
        return [
            layout(path.join(basePath, "src/pages/layout.tsx"), [
                route("/*", path.join(basePath, "src/pages/page.tsx"))
            ])
        ]
    }

    return routes.map(r => {
        return layout(path.join(basePath, "src/pages/layout.tsx"), {id: `layout:${r}`}, [
            route(r + "/*", path.join(basePath, "src/pages/page.tsx"), {id: r})
        ])
    })
}


function extractNestedRoutes(sidebarItems: any[]): string[] {
    const routes: string[] = [];

    sidebarItems.forEach(item => {
        if (item && typeof item === "object") {
            // Only extract routes from items that have a "route" property
            if ('route' in item && item.route) {
                const route = item.route.startsWith("/") ? item.route : `/${item.route}`;
                routes.push(route);

                // Recursively process nested pages within this route
                if (item.pages && Array.isArray(item.pages)) {
                    routes.push(...extractNestedRoutes(item.pages));
                }
            }
        }
    });

    return routes;
}
