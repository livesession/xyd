import React from "react";
import {NavLinks} from "@xyd-js/components/writer";

import {useNavLinks} from "../contexts";
import {FwLink} from "./FwLink";

export function FwNavLinks() {
    const navlinks = useNavLinks()

    if (navlinks?.prev || navlinks?.next) {
        return <NavLinks
            prev={navlinks.prev}
            next={navlinks.next}
            as={FwLink}
        />
    }

    return null
}
