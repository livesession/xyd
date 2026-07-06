import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { DevWidget } from "@apitoolchain/dev/widget";
import { runWithToken } from "./data/request-context.server";
import { getSessionToken } from "./sessions.server";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
];

/**
 * Bind the request's session token (from the httpOnly cookie) into the
 * request-scoped store for the whole loader/action chain, so the data layer can
 * forward it to the platform-api as a bearer. Server-only (stripped from the
 * client build along with its imports).
 */
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request }, next) => {
    const token = await getSessionToken(request);
    return runWithToken(token, () => next());
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Dev-only: hide the app before it paints until a data profile is
            picked, so nothing loads "under the hood" before the picker. The
            @apitoolchain/dev plugin's overlay clears the gate once you pick. */}
        {import.meta.env.DEV && (
          <>
            <style
              // biome-ignore lint/security/noDangerouslySetInnerHtml: static dev-only gate CSS.
              dangerouslySetInnerHTML={{
                __html: "html[data-atc-gate] body{visibility:hidden!important}",
              }}
            />
            <script
              // biome-ignore lint/security/noDangerouslySetInnerHtml: static dev-only pre-paint gate.
              dangerouslySetInnerHTML={{
                __html:
                  "try{if(!sessionStorage.getItem('atc-dev-profile-picked'))document.documentElement.setAttribute('data-atc-gate','')}catch(e){}",
              }}
            />
          </>
        )}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {/* Dev-only: the data-profile picker + tools (talks to the
            @apitoolchain/dev vite plugin's /__atc-dev/* endpoints). Gated to
            dev so it's tree-shaken out of prod builds. */}
        {import.meta.env.DEV && <DevWidget />}
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto max-w-[900px] px-6 py-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
