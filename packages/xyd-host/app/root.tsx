import React, { } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, redirect } from "react-router";

import type { Settings, Styles } from "@xyd-js/core";

// @ts-ignore
import virtualSettings from "virtual:xyd-settings";

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
    const colorScheme = settings?.theme?.defaultColorScheme || "os"

    return (
        <html
            data-color-scheme={colorScheme}
            data-color-primary={settings?.theme?.styles?.colors?.primary ? "true" : undefined}
        >
            <head>
                <ColorSchemeScript />
                <DefaultMetas />
                <UserFavicon />
                <UserHeadScripts />

                <Meta />
                <Links />
            </head>

            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
                <UserStyleTokens />
                {/* TODO: in the future better solution? */}
            </body>
        </html>
    );
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
            __html: `
    (function() {
        try {
            var theme = localStorage.getItem('xyd-color-scheme') || 'auto';
            var isDark = false;

            if (theme === 'dark') {
                isDark = true;
            } else if (theme === 'auto') {
                isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }

            if (isDark) {
                document.documentElement.setAttribute('data-color-scheme', 'dark');
            }
        } catch (e) {
            // Fallback to system preference if localStorage fails
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-color-scheme', 'dark');
            }
        }
    })();
`
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

function UserStyleTokens() {
    const tokensCSS = generateTokensCSS(settings?.theme?.styles)

    if (!tokensCSS) {
        return null
    }

    return <style
        dangerouslySetInnerHTML={{
            __html: tokensCSS
        }}
    />
}

// Function to generate CSS custom properties from tokens
function generateTokensCSS(styles?: Styles): string {
    const colors = styles?.colors
    const colorTokens: Record<string, string> = {}

    if (colors?.primary) {
        colorTokens["--color-primary"] = colors.primary
        colorTokens["--xyd-sidebar-item-bgcolor--active"] = 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
        colorTokens["--xyd-sidebar-item-color--active"] = 'var(--color-primary)'

        colorTokens["--theme-color-primary"] = 'var(--color-primary)'
        colorTokens["--theme-color-primary-active"] = 'var(--color-primary)'
        colorTokens["--xyd-toc-item-color--active"] = 'var(--color-primary)'
    }

    const tokens = { ...colorTokens, ...(styles?.tokens || {}) }

    if (!Object.keys(tokens).length) {
        return '';
    }

    const entries = Object.entries(tokens);
    const cssProperties = entries
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n');

    return `:root {\n${cssProperties}\n}`;
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