import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import React, { } from 'react';

import { GlobalStateProvider } from './context';
import type { Route } from "./+types/root";
import { SETTINGS } from "./settings";

import gestaltCss from 'gestalt/dist/gestalt.css?url';
import poetryCss from '@xyd-js/theme-poetry/index.css?url';
import openerCss from '@xyd-js/theme-opener/index.css?url';
import cosmoCss from '@xyd-js/theme-cosmo/index.css?url';
import picassoCss from '@xyd-js/theme-picasso/index.css?url';

import indexCss from './index.css?url';

export const links: Route.LinksFunction = () => {
  const links = [
    { rel: "stylesheet", href: gestaltCss },
    { rel: "stylesheet", href: indexCss },
  ]

  switch (SETTINGS?.theme?.name) {
    case "poetry":
      links.push({ rel: "stylesheet", href: poetryCss });
      break;
    case "opener":
      links.push({ rel: "stylesheet", href: openerCss });
      break;
    case "cosmo":
      links.push({ rel: "stylesheet", href: cosmoCss });
      break;
    case "picasso":
      links.push({ rel: "stylesheet", href: picassoCss, "data-xyd-theme-default": "true" });
      break;
  }

  return links;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <Meta />
        <Links />
      </head>
      <body>
        <GlobalStateProvider>
          {children}
          <ScrollRestoration />
          <Scripts />
        </GlobalStateProvider>
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
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
