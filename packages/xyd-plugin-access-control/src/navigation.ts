import type { AccessMap } from "./access";

interface SidebarItem {
  title: string;
  href: string;
  items?: SidebarItem[];
  [key: string]: any;
}

interface SidebarGroup {
  group: string;
  groupIndex: number;
  items: SidebarItem[];
  icon?: string;
  [key: string]: any;
}

/**
 * Filters sidebar navigation groups to hide pages the user cannot access.
 * This runs at runtime in the browser based on the user's auth state.
 */
export function filterSidebarGroups(
  sidebarGroups: SidebarGroup[],
  accessMap: AccessMap,
  userGroups: string[]
): SidebarGroup[] {
  return sidebarGroups
    .map((group) => ({
      ...group,
      items: filterItems(group.items, accessMap, userGroups),
    }))
    .filter((group) => group.items.length > 0);
}

function filterItems(
  items: SidebarItem[],
  accessMap: AccessMap,
  userGroups: string[]
): SidebarItem[] {
  return items
    .filter((item) => {
      const href = item.href;
      if (!href) return true;

      const normalizedHref = href.startsWith("/") ? href : `/${href}`;
      const access = accessMap[normalizedHref] || accessMap[href];

      // No entry or public = show
      if (!access || access === "public") return true;

      // Requires auth - user must have groups
      if (access === "authenticated") return userGroups.length > 0;

      // Group-based access
      const requiredGroups = access.split(",");
      return requiredGroups.some((g) => userGroups.includes(g));
    })
    .map((item) => {
      // Recursively filter nested items
      if (item.items?.length) {
        return {
          ...item,
          items: filterItems(item.items, accessMap, userGroups),
        };
      }
      return item;
    });
}

/**
 * Filters an array of paths (used for sitemap/llms.txt) to exclude protected pages.
 */
export function filterProtectedPaths(
  paths: string[],
  accessMap: AccessMap
): string[] {
  return paths.filter((p) => {
    const normalizedPath = p.startsWith("/") ? p : `/${p}`;
    const access = accessMap[normalizedPath] || accessMap[p];
    return !access || access === "public";
  });
}
