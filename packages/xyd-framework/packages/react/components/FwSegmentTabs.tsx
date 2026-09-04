import React from "react";
import { useLocation } from "react-router";

import { Segment } from "@xyd-js/core";
import { Nav } from "@xyd-js/ui";

import { pageLink, trailingSlash, dropdownMenuItems } from "../utils";
import { FwLink } from "./FwLink";
import { FwNavDropdown } from "./FwNavDropdown";

/**
 * Renders a route-scoped `appearance: "tabs"` segment as a tab bar (Radix
 * `Nav.Tabs`) — used in the primary nav CENTER when `appearance.tabs.surface`
 * is `"center"`. The active tab is the page whose `page` (a route prefix)
 * prefixes the current path; each tab links to its `href` (falling back to
 * `page`). Pure rendering — the caller supplies the matched segment.
 */
export function FwSegmentTabs({ segment, float }: { segment: Segment; float?: "right" }) {
    const location = useLocation();

    const pathname = trailingSlash(location.pathname);
    // The same segment renders twice — once per surface — so each pass takes only
    // the tabs belonging to it. Active state is computed from the WHOLE segment
    // below, not from this slice, so a floated tab still wins the Radix value.
    const pages = segment.pages?.filter((p) =>
        float === "right" ? p.float === "right" : p.float !== "right",
    );
    // Radix Tabs `value` (the selected/underlined tab) comes ONLY from PLAIN tabs
    // whose own `page` prefixes the path. A `dropdownMenu` tab has no `page`/value —
    // it carries its own active state via the `active` prop (true when any child
    // section's `page` prefixes the path), so it doesn't hijack the selected tab.
    const activePage = segment.pages?.findLast(
        (p) => !!p.page && pathname.startsWith(pageLink(p.page)),
    );
    const isDropdownActive = (p: (typeof segment.pages)[number]) =>
        dropdownMenuItems(p.dropdownMenu).some((c) => !!c.page && pathname.startsWith(pageLink(c.page)));

    if (!pages?.length) {
        return null;
    }

    return (
        <Nav.Tabs value={activePage?.page || ""}>
            {pages.map((p, i) => {
                // A tab that carries `dropdownMenu` becomes a hover dropdown (the
                // HashiCorp "Documentation ▾" pattern): each entry links to a section
                // that has its own route-scoped sidebar.
                if (dropdownMenuItems(p.dropdownMenu).length) {
                    return <FwNavDropdown key={p.page || p.title || i} item={p} active={isDropdownActive(p)} />;
                }
                const href = pageLink(typeof p.href === "string" ? p.href : (p.page || ""));
                return (
                    <Nav.Item
                        key={p.page || p.href || i}
                        // A UNIQUE value per tab. Radix Tabs marks every trigger whose
                        // value equals the list value as active — so pageless tabs
                        // (external links: Install/Tutorials/…) must NOT all share the
                        // empty string, or they'd all light up active. Only a tab with
                        // a real `page` can match the active value (`activePage?.page`).
                        value={p.page || p.href || String(i)}
                        href={href}
                        as={FwLink}
                    >
                        {p.title}
                    </Nav.Item>
                );
            })}
        </Nav.Tabs>
    );
}
