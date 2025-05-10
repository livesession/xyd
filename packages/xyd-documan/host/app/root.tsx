import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

// @ts-ignore
import virtualSettings from "virtual:xyd-settings";
// @ts-ignore
const {settings} = virtualSettings

// const settings = globalThis.__xydSettings
const DEFAULT_FAVICON_PATH = "/public/favicon.png";

const faviconPath = settings?.theme?.favicon || DEFAULT_FAVICON_PATH

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                <link rel="icon" type="image/png" sizes="32x32" href={faviconPath}></link>

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
