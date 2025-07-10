import React from "react";
import {useLocation} from "react-router";

import {SubNav} from "@xyd-js/ui";

import {pageLink, trailingSlash} from "../utils";
import {useMatchedSubNav} from "../hooks";
import {FwLink} from "./FwLink";

export function FwSubNav() {
    const matchedSubnav = useMatchedSubNav()
    const location = useLocation()
    const pathname = trailingSlash(location.pathname)

    if (!matchedSubnav) {
        return null
    }

    // TODO: in the future routing props from settings like {match: "/docs/api/browser"}
    const active = matchedSubnav?.pages?.findLast(item => {
        return pathname.startsWith(pageLink(item.page || ""))
    })

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
