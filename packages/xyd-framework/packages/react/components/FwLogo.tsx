import React, { isValidElement } from "react";
import { Link } from "react-router";

import {
    useColorScheme
} from "@xyd-js/components/writer";

import { useSettings } from "../contexts";
import { useLogoLink } from "../hooks";

export function FwLogo() {
    const settings = useSettings()
    const [clientColorScheme] = useColorScheme()
    
    const colorScheme = clientColorScheme || settings?.theme?.appearance?.colorScheme || "light"
    const logo = settings?.theme?.logo

    if (typeof logo === "string") {
        return <$Logo src={logo} />
    }

    if (isValidElement(logo)) {
        return <$Logo>
            {logo}
        </$Logo>
    }

    if (typeof logo === "object") {
        return <$Logo src={logo[colorScheme]} />
    }

    return null
}

function $Logo({ src, children }: { src?: string, children?: React.ReactNode }) {
    const logoLink = useLogoLink()

    return <span part="logo">
        <Link to={logoLink}>
            { src ? <img src={src} /> : children }
        </Link>
    </span>
}