import type { Segment, NavigationItem } from "@xyd-js/core";

import { resolveDropdownHref, resolveDropdownItems, dropdownMenuItems, type ResolvedDropdownItem } from "./navDropdown";
import { pageLink } from "./pageLink";
import { trailingSlash } from "./trailingSlash";

/**
 * Pure: the active product of a `logoTrailing` segment for a given pathname —
 * whichever page's route prefixes the path, `findLast` so the deepest/last match
 * wins on overlapping prefixes. Returns `null` when none is active. Extracted so
 * both {@link useActiveLogoTrailingItem} and unit tests share one source of truth.
 */
export function resolveActiveLogoTrailingItem(segment: Segment, pathname: string): NavigationItem | null {
    const normalized = trailingSlash(pathname);

    return segment.pages?.findLast(
        page => !!page.page && normalized.startsWith(pageLink(page.page))
    ) || null;
}

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
        items: dropdownMenuItems(page.dropdownMenu).length ? resolveDropdownItems(dropdownMenuItems(page.dropdownMenu)) : undefined,
    }));

    const activeItem = pages.find((page) => isActive(page.page));
    const triggerLabel = activeItem?.title || segment.title || "";

    return { triggerLabel, items };
}
