import type { NavigationItem } from "@xyd-js/core";

import { pageLink } from "./pageLink";

/**
 * A nav item resolved for rendering in a dropdown menu — its link target is
 * resolved and its children (`dropdownMenu`) are resolved recursively into
 * `items` (multi-level submenus). Pure (only depends on {@link pageLink}), so the
 * multi-level resolution is unit-testable without the UI layer.
 */
export interface ResolvedDropdownItem {
    title?: string;
    description?: string;
    href: string | null;
    value?: string;
    icon?: NavigationItem["icon"];
    items?: ResolvedDropdownItem[];
}

/** Resolve a nav item's link target: `page` → routed link, `href` → verbatim. */
export function resolveDropdownHref(item: NavigationItem): string | null {
    if (typeof item.href === "string") return pageLink(item.href);
    if (typeof item.page === "string") return pageLink(item.page);
    return null;
}

/** Map config `NavigationItem[]` → resolved dropdown items, recursing into `dropdownMenu`. */
export function resolveDropdownItems(items: NavigationItem[]): ResolvedDropdownItem[] {
    return (items || []).map((item) => ({
        title: item.title,
        description: item.description,
        href: resolveDropdownHref(item),
        value: item.page || item.href || item.title,
        icon: item.icon,
        items: item.dropdownMenu?.length ? resolveDropdownItems(item.dropdownMenu) : undefined,
    }));
}
