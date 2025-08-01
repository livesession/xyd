import { useMatches } from "react-router";

import { Navigation, SidebarRoute, Sidebar } from "@xyd-js/core";

import { useSettings } from "../contexts";
import { pageLink } from "../utils";
import { useMatchedSubNav } from "./useMatchedSubNav";

export function useActivePageRoute(match: boolean = false) {
    const matches = useMatches()
    const matchedSubnav = useMatchedSubNav()
    const settings = useSettings()

    const lastMatch = matches[matches.length - 1]

    // Extract SidebarRoute items from sidebar structure
    const sidebarRoutes = extractSidebarRoutes(settings?.navigation?.sidebar || []);
    
    let active = sidebarRoutes.find(item => {
        if (matchedSubnav) {
            const routeMatch = pageLink(item.route || "") === pageLink(matchedSubnav?.route)

            if (routeMatch) {
                return routeMatch
            }

            if (match) {
                const pageMatch = matchedSubnav?.pages.findLast(page => {
                    if (!page.page) {
                        return false
                    }

                    return pageLink(lastMatch?.id).startsWith(pageLink(page.page || ""))
                })

                return pageLink(pageMatch?.page || "") === pageLink(item.route || "")
            }

            return false
        }

        return pageLink(item.route || "") === lastMatch?.id
    })

    if (!active && !matchedSubnav && match) {
        active = sidebarRoutes.findLast(item => {
            if (!item.route) {
                return false
            }

            return pageLink(lastMatch?.id).startsWith(pageLink(item.route || ""))
        })
    }

    return active || null
}

// Helper function to extract SidebarRoute items from sidebar structure
function extractSidebarRoutes(sidebar: Navigation['sidebar']): SidebarRoute[] {
    const items: SidebarRoute[] = [];

    if (!sidebar) return items;

    for (const sidebarItem of sidebar) {
        if (typeof sidebarItem === 'object' && 'pages' in sidebarItem) {
            // Check if this is a wrapper object with pages containing SidebarRoute objects
            const wrapper = sidebarItem as { pages: any[] };
            for (const page of wrapper.pages) {
                if (typeof page === 'object' && 'route' in page && 'pages' in page) {
                    items.push(page as SidebarRoute);
                }
            }
        }
    }

    return items;
}

