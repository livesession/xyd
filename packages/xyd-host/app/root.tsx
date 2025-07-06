import React, { } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, redirect } from "react-router";

import type { Settings } from "@xyd-js/core";

// // @ts-ignore
import virtualSettings from "virtual:xyd-settings";

const { settings } = virtualSettings as { settings: Settings }

const DEFAULT_FAVICON_PATH = "/public/favicon.png";

const faviconPath = settings?.theme?.favicon || DEFAULT_FAVICON_PATH
const head = settings?.theme?.head || []

type HeadTag = 'meta' | 'link' | 'title' | 'script' | 'style'

export function HydrateFallback() {
    return <div></div>
}

export function loader({ request }: { request: any }) {
    if (process.env.NODE_ENV === "production") { 
        return
    }
    
    const slug = getPathname(request.url || "index") || "index"

    if (settings?.redirects) {
        const shouldRedirect = settings.redirects.find((redirect) => redirect.source === slug)
        if (shouldRedirect) {
            return redirect(shouldRedirect.destination)
        }
    }
}

export function Layout({ children }: { children: React.ReactNode }) {
    const colorScheme = settings?.theme?.defaultColorScheme || "os"

    return (
        <html lang="en" data-color-scheme={colorScheme}>
            <head>
                {/* Inline script to prevent flash of unstyled content */}
                <script
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
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                <link rel="icon" type="image/png" sizes="32x32" href={faviconPath}></link>


                {head.map(([tag, props]: [HeadTag, Record<string, string | boolean>], index: number) => {
                    return React.createElement(tag, { key: index, ...props })
                })}

                <Meta />
                <Links />
            </head>

            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
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
