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
