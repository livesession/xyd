import React from "react";

import { SubNav } from "@xyd-js/ui";

import { pageLink, dropdownMenuItems } from "../utils";
import { useActiveMatchedSubNav, useMatchedSubNav } from "../hooks";
import { FwLink } from "./FwLink";
import { FwNavDropdown } from "./FwNavDropdown";

export function FwSubNav() {
    const matchedSubnav = useMatchedSubNav()
    const active = useActiveMatchedSubNav()

    if (!matchedSubnav) {
        return null
    }

    return <SubNav
        title={matchedSubnav?.title || ""}
        value={active?.page || ""}
        onChange={() => {
        }}
    >
        {matchedSubnav?.pages?.map((item, index) => {
            // A tab that declares a nested menu renders as a multi-level dropdown.
            if (dropdownMenuItems(item.dropdownMenu).length) {
                return <FwNavDropdown
                    key={item.title || item.page || item.href || index}
                    item={item}
                />
            }

            let href: string | null = null

            if (typeof item.href === "string") {
                href = pageLink(item.href)
            }

            if (!href && typeof item.page === "string") {
                href = pageLink(item.page)
            }

            return <SubNav.Item
                key={href || (typeof item.page === "string" ? item.page : "") || index}
                value={typeof item.page !== "string" && href ? href : item.page || ""}
                href={href || item.page || ""}
                as={FwLink}
            >
                {item.title}
            </SubNav.Item>
        })}
    </SubNav>
}
