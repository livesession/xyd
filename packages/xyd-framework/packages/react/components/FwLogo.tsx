import React, { isValidElement } from "react";
import { Link } from "react-router";

import type { Logo } from "@xyd-js/core";
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

    // The logo image is the only content of the link to the home page, so it also
    // carries that link's accessible name — an empty alt would leave it nameless.
    const defaultAlt = settings?.seo?.metatags?.["og:site_name"] || "Home"

    if (typeof logo === "string") {
        return <$Logo src={logo} alt={defaultAlt} trailing={trailing} />
    }

    if (isValidElement(logo)) {
        return <$Logo trailing={trailing}>
            {logo}
        </$Logo>
    }

    if (typeof logo === "object") {
        // `isValidElement` above rules the element form out at runtime but does not
        // narrow it out of the union, hence the cast.
        return <$Logo src={logo[colorScheme]} alt={(logo as Logo).alt || defaultAlt} trailing={trailing} />
    }

    return null
}

function $Logo({ src, alt, children, trailing }: { src?: string, alt?: string, children?: React.ReactNode, trailing?: boolean }) {
    const logoLink = useLogoLink()

    return <span part="logo">
        <Link to={logoLink}>
            { src ? <img src={src} alt={alt} /> : children }
        </Link>
        {trailing && <Surface target={SurfaceTarget.LogoTrailing} />}
    </span>
}