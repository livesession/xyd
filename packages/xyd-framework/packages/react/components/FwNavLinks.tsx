import React from "react";
import { NavLinks } from "@xyd-js/components/writer";

import { useNavLinks } from "../contexts";
import { FwLink } from "./FwLink";

export interface FwNavLinksProps {
    children?: React.ReactNode
}

export function FwNavLinks({ children }: FwNavLinksProps) {
    const navlinks = useNavLinks()

    if (navlinks?.prev || navlinks?.next) {
        return <NavLinks
            prev={navlinks.prev}
            next={navlinks.next}
            as={FwLink}
        >
            {children}
        </NavLinks>
    }

    return null
}
