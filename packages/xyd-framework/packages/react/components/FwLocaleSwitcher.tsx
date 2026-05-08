import React, { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

import {
    useAvailableLocales,
    useCurrentLocale,
    useDefaultLocale,
} from "../contexts/framework";

const COOKIE_NAME = "xyd-locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Compute the destination path when switching from one locale to another.
 *
 * - Strips the current locale prefix from the path (if non-default).
 * - Prepends the target locale prefix (if non-default).
 *
 * Examples (defaultLocale = "en"):
 *   /docs/intro     →  pl  →  /pl/docs/intro
 *   /pl/docs/intro  →  de  →  /de/docs/intro
 *   /pl/docs/intro  →  en  →  /docs/intro
 */
export function computeLocaleHref(
    pathname: string,
    fromLocale: string,
    toLocale: string,
    defaultLocale: string
): string {
    let p = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    if (fromLocale && fromLocale !== defaultLocale) {
        if (p === fromLocale || p.startsWith(`${fromLocale}/`)) {
            p = p.slice(fromLocale.length);
            if (p.startsWith("/")) p = p.slice(1);
        }
    }
    if (toLocale === defaultLocale) {
        return "/" + p;
    }
    return p ? `/${toLocale}/${p}` : `/${toLocale}`;
}

export interface FwLocaleSwitcherProps {
    /** Optional className passed to the wrapping `<select>` element. */
    className?: string;
}

/**
 * Built-in locale switcher. Renders a native `<select>` listing every
 * locale declared in `navigation.languages[]`. On change:
 *
 * 1. Computes the destination path under the new locale.
 * 2. Persists the choice in the `xyd-locale` cookie (1 year).
 * 3. Navigates via React Router.
 *
 * Themes can override or replace this by registering their own component
 * on the `nav.right` surface (or any surface they prefer).
 */
export function FwLocaleSwitcher(props: FwLocaleSwitcherProps = {}) {
    const locales = useAvailableLocales();
    const current = useCurrentLocale();
    const defaultLocale = useDefaultLocale();
    const navigate = useNavigate();
    const location = useLocation();

    const onChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const next = e.target.value;
            if (!current || !defaultLocale || next === current) return;
            const href = computeLocaleHref(
                location.pathname,
                current,
                next,
                defaultLocale
            );
            if (typeof document !== "undefined") {
                document.cookie =
                    `${COOKIE_NAME}=${encodeURIComponent(next)};` +
                    ` Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
            }
            navigate(href);
        },
        [current, defaultLocale, location.pathname, navigate]
    );

    if (!locales.length || !current) return null;

    return (
        <select
            className={props.className}
            value={current}
            onChange={onChange}
            data-fw-locale-switcher
            aria-label="Select language"
        >
            {locales.map((l) => (
                <option key={l.code} value={l.code}>
                    {l.name || l.code}
                </option>
            ))}
        </select>
    );
}
