import React from "react";
import { useLocation } from "react-router";

import { SubNav, SidebarTabsDropdown } from "@xyd-js/ui";
import { Icon } from "@xyd-js/components/writer";

import { pageLink, trailingSlash } from "../utils";
import { useActiveMatchedSubNav, useMatchedSubNav } from "../hooks";
import { FwLink } from "./FwLink";

export function FwSubNav() {
    const matchedSubnav = useMatchedSubNav()
    const active = useActiveMatchedSubNav()

    if (!matchedSubnav) {
        return null
    }

    // TODO: value
    return <SubNav
        title={matchedSubnav?.title || ""}
        value={active?.page || ""}
        onChange={() => {
        }}
    >
        {matchedSubnav?.pages?.map((item, index) => {
            return <SubNav.Item
                value={item.page || ""}
                href={pageLink(item.page || "")}
                as={FwLink}

            >
                {item.title}
            </SubNav.Item>
        })}
    </SubNav>
}
