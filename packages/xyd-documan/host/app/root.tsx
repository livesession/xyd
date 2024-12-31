import {
    // Links,
    // Meta,
    Outlet,
    Scripts,
} from "react-router";

// TODO: move to theme?
import "@xyd/ui2/index.css";
import "@xyd/components/index.css"
import "@xyd/fable-wiki/atlas.css"
import '@xyd/atlas/index.css';

import './index.css'

// TODO: config from core settings
export const meta = () => {
    return [
        {
            title: "xyd"
        }
    ]
}

export const Layout = ({children}: { children: React.ReactNode }) => {
    return (
        <html>
        {/*<head>*/}
        {/*    <meta charSet="utf-8"/>*/}
        {/*    <meta name="viewport" content="width=device-width, initial-scale=1"/>*/}
        {/*    <Meta/>*/}
        {/*    <Links/>*/}
        {/*</head>*/}
        <head>

        </head>
        <body>
        {children}
        <Scripts/>
        </body>
        </html>
    )
}

export default function App() {
    return <Outlet/>
}

