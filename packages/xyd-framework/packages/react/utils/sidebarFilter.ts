/** Minimal shape the sidebar-filter predicate needs (a title + optional children). */
export interface FilterableSidebarItem {
    title?: string;
    sidebarTitle?: string;
    items?: FilterableSidebarItem[];
}

/**
 * Whether an item's own title, or any descendant's, contains the (lowercased)
 * sidebar-filter query. Empty query → always `true` (filter inactive), so a
 * theme without a filter input renders the full tree unchanged. Pure, so the
 * hide/keep decision is unit-testable without the React tree.
 */
export function sidebarItemMatchesQuery(item: FilterableSidebarItem, query: string): boolean {
    if (!query) return true;
    const title = (item.sidebarTitle || item.title || "").toLowerCase();
    if (title.includes(query)) return true;
    return (item.items || []).some(child => sidebarItemMatchesQuery(child, query));
}
