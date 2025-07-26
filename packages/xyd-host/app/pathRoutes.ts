import path from "node:path";

import { RouteConfigEntry, index } from "@react-router/dev/routes";

import { Settings, SidebarNavigation } from "@xyd-js/core";
import { layout, route } from "@react-router/dev/routes";

type Route = {
    id: string
    path: string
}

// Helper function to recursively extract route definitions from nested pages
export function pathRoutes(basePath: string, navigation: Settings['navigation']) {
    if (!navigation?.sidebar) return [];

    const routes: Route[] = [];

    // Process each sidebar group
    extractNestedRoutes(navigation.sidebar || [], routes)

    if (!routes.length) {
        const rrRoutes: RouteConfigEntry[] = []
        if (globalThis.__xydHasIndexPage) {
            rrRoutes.push(
                index(path.join(basePath, "src/pages/page.tsx"))
            )
        } else {
            rrRoutes.push(
                route("/*", path.join(basePath, "src/pages/page.tsx"))
            )
        }

        return [
            layout(path.join(basePath, "src/pages/layout.tsx"), [
                ...rrRoutes
            ])
        ]
    }

    const rrRoutes: RouteConfigEntry[] = []
    if (globalThis.__xydHasIndexPage) {
        rrRoutes.push(
            layout(path.join(basePath, "src/pages/layout.tsx"), { id: `layout:index` }, [
                index(path.join(basePath, "src/pages/page.tsx"))
            ])
        )
    }

    return [
        ...rrRoutes,
        ...routes.map(r => {
            return layout(path.join(basePath, "src/pages/layout.tsx"), { id: `layout:${r.id}` }, [
                route(r.path, path.join(basePath, "src/pages/page.tsx"), { id: r.id })
            ])
        })
    ]
}


function extractNestedRoutes(
    sidebarItems: SidebarNavigation,
    routes: Route[],
    parentRoute?: string,
) {
    sidebarItems.forEach(item => {
        if (item && typeof item === "object") {
            let route = ""

            // Only extract routes from items that have a "route" property
            if ('route' in item && item.route) {
                route = item.route
                const routeMatch = item.route.startsWith("/") ? item.route : `/${item.route}`;
                routes.push({ id: routeMatch, path: routeMatch + "/*" });
            }

            // Recursively process nested pages within this route
            if (item.pages && Array.isArray(item.pages)) {
                extractNestedRoutes(item.pages as SidebarNavigation, routes, route || parentRoute)
            }
        } else if (!parentRoute) {
            const page = item.startsWith("/") ? item : `/${item}`;
            routes.push({ id: page, path: page });
        }
    });
}
