import {
    Links,
    Meta,
    Outlet,
    Scripts,
} from "react-router";

// TODO: config from core settings
export const meta = () => {
    return [
        {
            title: "xyd"
        }
    ]
}

export const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                {/* <link href="https://fonts.googleapis.com/css2?family=Fustat:wght@600&display=swap" rel="stylesheet"></link> */}
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <Scripts />
            </body>
        </html>
    )
}

export default function App() {
    return <Outlet />
}

