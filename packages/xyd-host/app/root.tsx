import React, { } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, redirect } from "react-router";

import type { Settings, Appearance } from "@xyd-js/core";
import * as contentClass from "@xyd-js/components/content"; // TODO: move to appearance

// @ts-ignore
import virtualSettings from "virtual:xyd-settings";
// @ts-ignore
import { presetUrls } from "virtual:xyd-theme-presets"

import colorSchemeScript from "./scripts/colorSchemeScript.ts?raw";
import bannerHeightScript from "./scripts/bannerHeight.ts?raw";
// import sidebarScrollCss from "@xyd-js/themes/decorators/sidebar-scroll.css?raw";

const { settings } = virtualSettings as { settings: Settings }

export function HydrateFallback() {
    return <div></div>
}

export function loader({ request }: { request: any }) {
    if (process.env.NODE_ENV === "production") {
        return
    }

    const slug = getPathname(request.url || "index") || "index"

    if (settings?.redirects) {
        const shouldRedirect = settings.redirects.find((redirect: any) => redirect.source === slug)
        if (shouldRedirect) {
            return redirect(shouldRedirect.destination)
        }
    }
}

export function Layout({ children }: { children: React.ReactNode }) {
    const colorScheme = clientColorScheme() || settings?.theme?.appearance?.defaultColorScheme || "os"

    const { component: UserAppearance, classes: UserAppearanceClasses } = userAppearance()

    return (
        <html
            data-color-scheme={colorScheme}
            data-color-primary={settings?.theme?.appearance?.colors?.primary ? "true" : undefined}
        >
            <head>
                <PreloadScripts />
                <DefaultMetas />

                <UserFavicon />
                <UserHeadScripts />

                <Meta />
                <Links />
                <PresetStyles />
            </head>

            <body className={UserAppearanceClasses}>
                {children}
                <ScrollRestoration />
                <Scripts />
                <UserStyleTokens />
                {UserAppearance}
                {/* TODO: in the future better solution? */}
            </body>
        </html>
    );
}

function PreloadScripts() {
    return <>
        <ColorSchemeScript />
        {/* TODO: in the future better solution? */}
        <BannerHeightScript />
    </>
}

function clientColorScheme() {
    if (typeof window === "undefined") {
        return
    }

    try {
        var theme = localStorage.getItem('xyd-color-scheme') || 'auto';
        var isDark = false;

        if (theme === 'dark') {
            isDark = true;
        } else if (theme === 'auto') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        return isDark ? "dark" : undefined
    } catch (e) {
        // Fallback to system preference if localStorage fails
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return "dark"
        }
    }

    return undefined
}

export default function App() {
    return <Outlet />;
}


function getPathname(url: string) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\//, '');
}


function DefaultMetas() {
    return <>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </>
}

function ColorSchemeScript() {
    return <script
        dangerouslySetInnerHTML={{
            __html: colorSchemeScript
        }}
    />
}

function BannerHeightScript() {
    return <script
        dangerouslySetInnerHTML={{
            __html: bannerHeightScript
        }}
    />
}

const DEFAULT_FAVICON_PATH = "/public/favicon.png";

function UserFavicon() {
    const faviconPath = settings?.theme?.favicon || DEFAULT_FAVICON_PATH

    if (!faviconPath) {
        return null
    }

    return <link rel="icon" type="image/png" sizes="32x32" href={faviconPath}></link>
}

// TODO: better than <style>?
function UserStyleTokens() {
    const userCss = generateUserCss(settings?.theme?.appearance)

    if (!userCss) {
        return null
    }

    return <style
        data-appearance
        dangerouslySetInnerHTML={{
            __html: userCss
        }}
    />
}

// TODO: better than <style>?
function userAppearance() {
    const theme = {
        searchWidth: settings?.theme?.appearance?.search?.fullWidth ? "100%" : undefined,
        buttonsRounded: cssVarSize("--xyd-border-radius", settings?.theme?.appearance?.buttons?.rounded, "lg"),
        scrollbarColor: settings?.theme?.appearance?.sidebar?.scrollbarColor || undefined
    }

    const userAppearanceCss = tokensToCss({
        "--xyd-search-width": theme.searchWidth || undefined,
        "--xyd-button-border-radius": theme.buttonsRounded || undefined,
        "--decorator-sidebar-scroll-bgcolor": theme.scrollbarColor || undefined
    })

    if (!userAppearanceCss) {
        return {
            component: null,
            classes: ""
        }
    }

    const classes = []
    if (settings?.theme?.appearance?.search?.fullWidth) {
        classes.push(contentClass.SearchButtonFullWidth)
    }

    return {
        component: <style
            dangerouslySetInnerHTML={{
                __html: userAppearanceCss
            }}
        />,
        classes: classes.join(" ")
    }
}

function generateUserCss(appearance?: Appearance): string {
    if (!appearance) return '';

    const { colors, cssTokens } = appearance;

    const lightTokens = {
        ...(colors?.primary ? generateColorTokens(colors.primary) : {}),
        ...(cssTokens ? cssTokens : {}),
        // ...(sidebar?.scrollbarColor ? { "--xyd-toc-scroll-bgcolor": sidebar.scrollbarColor } : {})
    };
    const darkTokens = {
        ...(colors?.light ? generateColorTokens(colors.light) : {}),
        ...(cssTokens ? cssTokens : {}),
        // ...(sidebar?.scrollbarColor ? { "--xyd-toc-scroll-bgcolor": sidebar.scrollbarColor } : {})
    };

    const lightCss = tokensToCss(lightTokens);
    const darkCss = generateDarkCss(darkTokens);

    return [lightCss, darkCss].filter(Boolean).join('\n\n');
}

// TODO: typesafe css variables?
function generateColorTokens(primary: string): Record<string, string> {
    return {
        "--color-primary": primary,
        "--xyd-sidebar-item-bgcolor--active": 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
        "--xyd-sidebar-item-color--active": 'var(--color-primary)',
        "--xyd-toc-item-color--active": 'var(--color-primary)',
        "--theme-color-primary": 'var(--color-primary)',
        "--theme-color-primary-active": 'var(--color-primary)',
        "--color-primary--active": 'color-mix(in srgb, var(--color-primary) 85%, transparent)',
    };
}

function tokensToCss(tokens: Record<string, string | boolean | undefined>, wrapInRoot = true): string {
    if (!Object.keys(tokens).length) {
        return '';
    }

    const props = Object.entries(tokens)
        .filter(([key, value]) => value !== undefined)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n');

    return wrapInRoot ? `:root {\n${props}\n}` : props;
}

function generateDarkCss(tokens: Record<string, string>): string {
    if (!Object.keys(tokens).length) {
        return '';
    }

    const raw = tokensToCss(tokens, false);
    return [
        `[data-color-scheme="dark"] {\n${raw}\n}`,
        `@media (prefers-color-scheme: dark) {`,
        `    :root:not([data-color-scheme="light"]):not([data-color-scheme="dark"]) {\n        ${raw.replace(/\n/g, '\n        ')}\n    }`,
        `}`
    ].join('\n');
}

function UserHeadScripts() {
    const head = settings?.theme?.head || []

    if (!head || !head.length) {
        return null
    }

    return head.map(([tag, props]: [string, Record<string, string | boolean>], index: number) => {
        return React.createElement(tag as any, { key: index, ...props })
    })
}

function PresetStyles() {
    const appearance = settings?.theme?.appearance
    const appearancePresets = appearance?.presets || []

    return Object.entries(presetUrls).map(([name, url]) => {
        if (appearancePresets.includes(name)) {
            return <link rel="stylesheet" href={url as string} key={name} />
        }

        return null
    })
}

const cssVarSize = (
    cssTokenPrefix: string,
    size?: "lg" | "md" | "sm" | boolean,
    defaultSize?: "lg" | "md" | "sm"
) => {
    if (!size) {
        return undefined
    }

    if (typeof size === "boolean") {
        return cssVarSize(cssTokenPrefix, defaultSize)
    }

    const sizes = {
        lg: "large",
        md: "medium",
        sm: "small"
    }

    const found = sizes[size]

    if (!found) {
        if (defaultSize) {
            return cssVarSize(cssTokenPrefix, defaultSize)
        }

        return undefined
    }

    return `var(${cssTokenPrefix}-${found})`
}