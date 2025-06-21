import React, {} from "react";
import {Links, Meta, Outlet, Scripts, ScrollRestoration} from "react-router";

import {XYDAnalytics} from "@xyd-js/analytics";
// @ts-ignore
import {loadProvider} from 'virtual:xyd-analytics-providers'
// @ts-ignore
import virtualSettings from "virtual:xyd-settings";
// @ts-ignore
const {settings} = virtualSettings

// const settings = globalThis.__xydSettings
const DEFAULT_FAVICON_PATH = "/public/favicon.png";

const faviconPath = settings?.theme?.favicon || DEFAULT_FAVICON_PATH
const head = settings?.theme?.head || []

type HeadTag = 'meta' | 'link' | 'title' | 'script' | 'style'

export function Layout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en" data-color-scheme="os">
        <head>
            <meta charSet="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>

            <link rel="icon" type="image/png" sizes="32x32" href={faviconPath}></link>

            {head.map(([tag, props]: [HeadTag, Record<string, string | boolean>], index: number) => {
                return React.createElement(tag, {key: index, ...props})
            })}

            <Meta/>
            <Links/>
        </head>
        <XYDAnalytics settings={settings} loader={loadProvider}>
            <body>
            {children}
            <ScrollRestoration/>
            <Scripts/>
            </body>
        </XYDAnalytics>
        </html>
    );
}

export default function App() {
    return <Outlet/>;
}
