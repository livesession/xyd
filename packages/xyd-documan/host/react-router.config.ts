import type { Config } from "@react-router/dev/config";

import { Settings } from "@xyd-js/core";

declare global {
    var __xydSettings: Settings;
}

// console.log("Config - Settings from shared data:", settings);

// Flatten navigation paths
const flattenNavigation = (navigation: Settings['navigation']) => {
    if (!navigation?.sidebar) return [];

    const paths: string[] = [];

    // Process each sidebar group
    navigation.sidebar.forEach(sidebarGroup => {
        // Add the route of the sidebar group
        if ('route' in sidebarGroup) {
            const route = sidebarGroup.route;
            if (route) {
                paths.push(`/${route}`);
            }

            // Process items in the sidebar group
            if (sidebarGroup.items) {
                processSidebarItems(sidebarGroup.items);
            }
        }
    });

    // Helper function to process sidebar items recursively
    function processSidebarItems(items: any[]) {
        items.forEach(item => {
            // If item has pages, process them
            if (item.pages) {
                item.pages.forEach((page: any) => {
                    if (typeof page === 'string') {
                        // Add the page path
                        paths.push(`/${page}`);
                    } else if (page.pages) {
                        // Recursively process nested pages
                        processSidebarItems([page]);
                    }
                });
            }
        });
    }

    return paths;
};

// Use settings.navigation if it exists, otherwise use an empty object
const navigation = __xydSettings?.navigation || { sidebar: [] };
const prerenderPaths = flattenNavigation(navigation);
// console.log("Config - Prerender paths:", prerenderPaths);

export default {
    ssr: false,
    prerender: prerenderPaths,
    // return a list of URLs to prerender at build time
} satisfies Config;