/** Minimal shape the active-path search needs (an href + optional children). */
export interface SidebarPathItem {
    href?: string;
    items?: SidebarPathItem[];
}

/**
 * The index path (one index per level) to the first item whose href is
 * `href`, or `null` when no item has it. An item without an href never
 * matches: a nested group's row (`href: ""`, its pages under `items`) and a
 * custom-component row are not pages. Without that guard the site root — whose
 * path trims to `""` — "found" the first nested group of a top-level group and
 * opened it (a folded top-level group's toggle too) on a page that is in none
 * of them. Pure, so the open/active decision is unit-testable without the
 * React tree.
 */
export function sidebarActivePath(items: SidebarPathItem[] | undefined, href: string, levels: number[] = []): number[] | null {
    if (!items) return null;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.href && item.href === href) {
            return [...levels, i];
        }

        if (item.items) {
            const result = sidebarActivePath(item.items, href, [...levels, i]);
            if (result) {
                return result;
            }
        }
    }
    return null;
}
