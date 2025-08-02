import React from "react";

import { SubNav } from "@xyd-js/ui";

import { pageLink } from "../utils";
import { useActiveMatchedSubNav, useMatchedSubNav } from "../hooks";
import { FwLink } from "./FwLink";

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
            let href: string | null = null

            if (typeof item.href === "string") {
                href = pageLink(item.href)
            }

            if (!href && typeof item.page === "string") {
                href = pageLink(item.page)
            }

            return <SubNav.Item
                value={item.page || ""}
                href={href || item.page || ""}
                as={FwLink}
            >
                {item.title}
            </SubNav.Item>
        })}
    </SubNav>
}
