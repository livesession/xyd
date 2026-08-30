import React from "react";

import type { NavigationItem } from "@xyd-js/core";
import { Icon, isImageSource } from "@xyd-js/components/writer";
import { Nav } from "@xyd-js/ui";

import { resolveDropdownItems, dropdownMenuItems, dropdownMenuOptions, type ResolvedDropdownItem } from "../utils";
import { FwLink } from "./FwLink";

/**
 * Resolve icon-set NAME icons to `<Icon>` elements HERE, in the framework layer.
 * xyd-ui inlines its own copy of the Icon component, whose IconProvider context
 * instance differs from the app's — a name lookup inside the ui bundle always
 * sees an empty icon set and renders nothing. Image-source icons (paths/data
 * URIs) stay strings: the ui `<img>` branch needs no context and the ui layer
 * sizes them (e.g. the icon-only switcher trigger).
 */
export function resolveDropdownIcons(items: ResolvedDropdownItem[], size = 16): ResolvedDropdownItem[] {
    return items.map((it) => ({
        ...it,
        icon: typeof it.icon === "string" && !isImageSource(it.icon)
            ? <Icon name={it.icon} size={size} />
            : it.icon,
        items: it.items ? resolveDropdownIcons(it.items, size) : undefined,
    }));
}

/**
 * Renders a nav item that carries `dropdownMenu` as a {@link Nav.Dropdown} — the
 * shared render path for header anchors (`FwHeaderItem`) and tabs (`FwSubNav`).
 * Passes `FwLink` so leaf links route through the framework's router-agnostic link
 * (works under both the bun and Vite engines). Hrefs (incl. nested submenus) are
 * resolved by the pure `resolveDropdownItems`.
 */
export function FwNavDropdown({ item, active }: { item: NavigationItem; active?: boolean }) {
    return (
        <Nav.Dropdown
            title={item.title}
            icon={item.icon}
            trigger={item.trigger}
            active={active}
            items={resolveDropdownIcons(resolveDropdownItems(dropdownMenuItems(item.dropdownMenu)))}
            itemsPerColumn={dropdownMenuOptions(item.dropdownMenu).itemsPerColumn}
            as={FwLink}
        />
    );
}
