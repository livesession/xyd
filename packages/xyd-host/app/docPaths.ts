import {PageURL, Settings, Sidebar, SidebarNavigation, asTocEnabled} from "@xyd-js/core";

export function docPaths(navigation: Settings['navigation']) {
    if (!navigation?.sidebar && !navigation?.languages?.length) return [];

    const paths: string[] = [];

    if (globalThis.__xydHasIndexPage) {
        paths.push("/")
    }

    // i18n: walk every language's sidebar. Each language's sidebar was
    // pre-prefixed with the locale code by pluginDocs, so the resulting
    // paths already include the locale prefix (e.g. "/pl/docs/intro").
    if (navigation?.languages?.length) {
        for (const lang of navigation.languages) {
            walkSidebar(lang.sidebar || []);
        }
    } else if (navigation?.sidebar) {
        walkSidebar(navigation.sidebar);
    }

    function walkSidebar(sidebar: SidebarNavigation) {
        sidebar.forEach(sidebarGroup => {
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

        // Process items in the sidebar group. asToc groups' pages are TOC
        // sections of the host page, not prerenderable routes — skip them.
        if ("pages" in sidebarGroup && sidebarGroup.pages?.length && !asTocEnabled((sidebarGroup as Sidebar).asToc)) {
            processSidebarItems(sidebarGroup.pages);
        }
        });
    }

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

            // If item has pages, process them (asToc groups excluded — their
            // pages are sections of the host page, not routes)
            if ("pages" in item && item.pages?.length && !asTocEnabled((item as Sidebar).asToc)) {
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
