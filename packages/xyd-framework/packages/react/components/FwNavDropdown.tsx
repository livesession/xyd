import React from "react";

import type { NavigationItem } from "@xyd-js/core";
import { Nav } from "@xyd-js/ui";

import { resolveDropdownItems } from "../utils";
import { FwLink } from "./FwLink";

/**
 * Renders a nav item that carries `dropdownMenu` as a {@link Nav.Dropdown} — the
 * shared render path for header anchors (`FwHeaderItem`) and tabs (`FwSubNav`).
 * Passes `FwLink` so leaf links route through the framework's router-agnostic link
 * (works under both the bun and Vite engines). Hrefs (incl. nested submenus) are
 * resolved by the pure `resolveDropdownItems`.
 */
export function FwNavDropdown({ item }: { item: NavigationItem }) {
    return (
        <Nav.Dropdown
            title={item.title}
            icon={item.icon}
            trigger={item.trigger}
            items={resolveDropdownItems(item.dropdownMenu || [])}
            as={FwLink}
        />
    );
}
