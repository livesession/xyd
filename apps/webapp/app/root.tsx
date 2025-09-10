import React, { lazy } from "react";

import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from "react-router";

import "@livesession/authjs-ui/index.css"
import '@primer/primitives/dist/css/functional/themes/light.css'
import '@primer/primitives/dist/css/primitives.css'

import './index.css'

import { AuthProvider } from "./contexts/AuthContext";

export function HydrateFallback() {
    return <div>Loading fallback...</div>;
}

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
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

export default function Root() {
    return <AuthProvider>
        <Outlet />
    </AuthProvider>
}

