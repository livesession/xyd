import type { Segment } from "@xyd-js/core";

import { resolveDropdownHref, resolveDropdownItems, type ResolvedDropdownItem } from "./navDropdown";

/** A logoTrailing switch target — a resolved dropdown item plus whether it is the
 *  currently-active page (→ rendered with a check by the switcher). */
export interface LogoTrailingItem extends ResolvedDropdownItem {
    active?: boolean;
}

export interface LogoTrailingSwitcher {
    /** Trigger label: the active page's title, else the segment title, else "". */
    triggerLabel: string;
    /** The segment pages resolved to dropdown items, the active one marked. */
    items: LogoTrailingItem[];
}

/**
 * Pure: resolve a `logoTrailing` segment + the active page string (from
 * `useActiveSegment`) into the product-switcher's trigger label + menu items.
 * Kept out of the component (like {@link resolveDropdownItems}) so it is
 * unit-testable without the router/UI layer.
 */
export function resolveLogoTrailingSwitcher(segment: Segment, activePage: string): LogoTrailingSwitcher {
    const pages = segment.pages || [];
    const isActive = (page?: string) => !!activePage && (page || "") === activePage;

    const items: LogoTrailingItem[] = pages.map((page) => ({
        title: page.title,
        description: page.description,
        href: resolveDropdownHref(page),
        value: page.page || page.href || page.title,
        icon: page.icon,
        active: isActive(page.page),
        items: page.dropdownMenu?.length ? resolveDropdownItems(page.dropdownMenu) : undefined,
    }));

    const activeItem = pages.find((page) => isActive(page.page));
    const triggerLabel = activeItem?.title || segment.title || "";

    return { triggerLabel, items };
}
