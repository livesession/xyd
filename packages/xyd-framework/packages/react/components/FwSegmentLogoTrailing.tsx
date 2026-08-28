import React from "react";
import { useLocation } from "react-router";

import { Nav } from "@xyd-js/ui";

import { useLogoTrailingSegment } from "../hooks";
import { pageLink, trailingSlash, resolveLogoTrailingSwitcher } from "../utils";
import { FwLink } from "./FwLink";

/**
 * Renders a `logoTrailing` segment as a GLOBAL hover product-switcher, hosted on
 * the `logo.trailing` surface (see FwLogo). It appears after the logo on every
 * page. The trigger shows the active product — whichever page's route prefixes
 * the current path — falling back to the segment `title` when none is active
 * (e.g. the landing page). The menu is the segment `pages` with a check on the
 * active one; a page's nested `dropdownMenu` becomes a submenu.
 *
 * Self-gating: returns null unless a `logoTrailing` segment is configured, so it
 * is safe to register on the surface unconditionally in both app entries.
 */
export function FwSegmentLogoTrailing() {
    const segment = useLogoTrailingSegment()
    const location = useLocation()

    if (!segment) {
        return null
    }

    const pathname = trailingSlash(location.pathname)
    const activePage = segment.pages?.findLast(
        page => !!page.page && pathname.startsWith(pageLink(page.page))
    )?.page || ""

    const { triggerLabel, items } = resolveLogoTrailingSwitcher(segment, activePage)

    return (
        <Nav.Dropdown
            title={triggerLabel}
            trigger={segment.trigger}
            items={items}
            as={FwLink}
        />
    )
}
