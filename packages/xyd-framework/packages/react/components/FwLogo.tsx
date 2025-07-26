import React, { isValidElement } from "react";
import { Link } from "react-router";

import {
    useColorScheme
} from "@xyd-js/components/writer";

import { useSettings } from "../contexts";
import { useLogoLink } from "../hooks";

export function FwLogo() {
    const settings = useSettings()
    const [colorScheme] = useColorScheme()
    const logoLink = useLogoLink()

    if (typeof settings?.theme?.logo === "string") {
        return <span part="logo">
            <Link to={logoLink}>
                <img src={settings?.theme?.logo} />
            </Link>
        </span>
    }

    if (isValidElement(settings?.theme?.logo)) {
        return <span part="logo">
            <Link to={logoLink}>
                {settings?.theme?.logo}
            </Link>
        </span>
    }

    if (typeof settings?.theme?.logo === "object" && colorScheme) {
        return <span part="logo">
            <Link to={logoLink}>
                <img src={settings?.theme?.logo[colorScheme as "light" | "dark"]} />
            </Link>
        </span>
    }

    return null
}