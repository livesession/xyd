import React from "react";

import { Nav } from "@xyd-js/ui";

import { useLogoTrailingSegment, useActiveLogoTrailingItem } from "../hooks";
import { useComponents } from "../contexts";
import { resolveLogoTrailingSwitcher } from "../utils";
import { FwLink } from "./FwLink";
import { resolveDropdownIcons } from "./FwNavDropdown";

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
    const activeItem = useActiveLogoTrailingItem()
    const components = useComponents() as Record<string, React.ComponentType<any>> | undefined

    if (!segment) {
        return null
    }

    const { triggerLabel, items: rawItems } = resolveLogoTrailingSwitcher(segment, activeItem?.page || "")
    // Icon-set NAME icons must resolve to <Icon> here (framework) — see
    // resolveDropdownIcons; image-path icons stay strings for the ui to size.
    const items = resolveDropdownIcons(rawItems as any)

    // Optional custom PANEL component (`segment.component`: path string or
    // `{ import, props }`), resolved through the user-components registry — same as
    // sidebar `ComponentPage`. When present, it renders as the dropdown panel
    // instead of the default `items` list; it receives the config `props` plus the
    // active item, the segment, and the resolved items.
    const rawComp = (segment as any).component as string | { import: string; props?: Record<string, any> } | undefined
    const compPath = typeof rawComp === "string" ? rawComp : rawComp?.import
    const compProps = rawComp && typeof rawComp === "object" ? rawComp.props : undefined
    const PanelComp = compPath ? components?.[compPath] : undefined
    if (compPath && !PanelComp && typeof console !== "undefined") {
        console.warn(`[xyd] segment component not found: "${compPath}"`)
    }
    const content = PanelComp
        ? <PanelComp {...(compProps || {})} activeItem={activeItem} segment={segment} items={items} />
        : undefined

    return (
        <Nav.Dropdown
            title={triggerLabel}
            icon={activeItem?.icon}
            iconOnly={segment.iconOnly}
            trigger={segment.trigger}
            items={items}
            content={content}
            as={FwLink}
        />
    )
}
