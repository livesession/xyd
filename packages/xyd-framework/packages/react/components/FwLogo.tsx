import React, { isValidElement } from "react";
import { Link } from "react-router";

import {
    useColorScheme
} from "@xyd-js/components/writer";

import { SurfaceTarget } from "../../../src";
import { useSettings } from "../contexts";
import { useLogoLink } from "../hooks";
import { Surface } from "./Surfaces";

/**
 * The logo. Rendered by every theme (navbar directly, the sidebar via the
 * webeditor "Logo" item, gusto's `sidebar.top` surface) AND the footer.
 *
 * `trailing` opts this instance into hosting the `logo.trailing` surface right
 * after the logo (e.g. a `logoTrailing` segment product-switcher). It is set only
 * at the nav/sidebar logo sites — the footer logo omits it, so nothing leaks there.
 */
export function FwLogo({ trailing }: { trailing?: boolean } = {}) {
    const settings = useSettings()
    const [clientColorScheme] = useColorScheme()

    const colorScheme = clientColorScheme || settings?.theme?.appearance?.colorScheme || "light"
    const logo = settings?.theme?.logo

    if (typeof logo === "string") {
        return <$Logo src={logo} trailing={trailing} />
    }

    if (isValidElement(logo)) {
        return <$Logo trailing={trailing}>
            {logo}
        </$Logo>
    }

    if (typeof logo === "object") {
        return <$Logo src={logo[colorScheme]} trailing={trailing} />
    }

    return null
}

function $Logo({ src, children, trailing }: { src?: string, children?: React.ReactNode, trailing?: boolean }) {
    const logoLink = useLogoLink()

    return <span part="logo">
        <Link to={logoLink}>
            { src ? <img src={src} /> : children }
        </Link>
        {trailing && <Surface target={SurfaceTarget.LogoTrailing} />}
    </span>
}