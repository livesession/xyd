import {PageURL, Settings, Sidebar} from "@xyd-js/core";

export function docPaths(navigation: Settings['navigation']) {
    if (!navigation?.sidebar) return [];

    const paths: string[] = [];

    if (globalThis.__xydHasIndexPage) {
        paths.push("/")
    }

    // Process each sidebar group
    navigation?.sidebar.forEach(sidebarGroup => {
        if (typeof sidebarGroup === "string") {
            paths.push(sidebarGroup.startsWith("/") ? sidebarGroup : `/${sidebarGroup}`)
            return
        }

        // Add the route of the sidebar group
        if ('route' in sidebarGroup) {
            const route = sidebarGroup.route;
            if (route) {
                paths.push(`/${route}`);
            }
        }

        // Process items in the sidebar group
        if ("pages" in sidebarGroup && sidebarGroup.pages?.length) {
            processSidebarItems(sidebarGroup.pages);
        }
    });

    // Helper function to process sidebar items recursively
    function processSidebarItems(items: Sidebar[] | PageURL[]) {
        items.forEach(item => {
            if (typeof item === 'string') {
                paths.push(`/${item}`);
                return
            }

            // Add the route of the sidebar group
            if ('route' in item) {
                const route = item.route;
                if (route) {
                    paths.push(`/${route}`);
                }
            }

            // If item has pages, process them
            if ("pages" in item && item.pages?.length) {
                item.pages.forEach((page) => {
                    if (typeof page === 'string') {
                        // Add the page path
                        paths.push(`/${page}`);
                    } else {
                        if ("virtual" in page) {
                            paths.push(`/${page.page}`);
                        } else {
                            // Recursively process nested pages
                            processSidebarItems([page]);
                        }
                    }
                });
            }
        });
    }

    return paths;
}
