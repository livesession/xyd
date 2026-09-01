import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

const CSS = `:root{--brand:#CA4245}
*{margin:0;box-sizing:border-box}
body{font-family:ui-sans-serif,system-ui,sans-serif;background:#0b0c0f;color:#e8e9ec;min-height:100vh}
header{display:flex;align-items:center;gap:12px;padding:16px 32px;border-bottom:1px solid #23252b}
header svg{width:28px;height:28px;fill:var(--brand)}
header .name{font-weight:600;font-size:17px}
header nav{margin-left:auto}
header nav a{color:#0b0c0f;background:var(--brand);padding:8px 18px;border-radius:8px;text-decoration:none;font-weight:600}
main{display:grid;place-items:center;min-height:calc(100vh - 62px);text-align:center;padding:24px}
main svg{width:72px;height:72px;fill:var(--brand);margin-bottom:24px}
h1{font-size:40px;letter-spacing:-.02em}
p.tag{color:#9a9ca6;margin-top:12px;font-size:17px}
.jsnote{color:#565963;font-size:12px;margin-top:32px}`;

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style>{CSS}</style>
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
    return <Outlet />;
}
