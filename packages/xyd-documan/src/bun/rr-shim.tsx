import * as React from "react";

/**
 * Minimal `react-router` shim for the Bun dev server (plan S1/S2). The leaf
 * render packages (@xyd-js/framework, themes, FwLink, BaseTheme) import a small
 * slice of react-router; we satisfy it without RR. Per-request location is a
 * module-level mutable — safe because `renderToString` is synchronous.
 *
 * Aliased over `react-router`/`react-router-dom` at runtime by bun/preload.ts.
 */

let LOC = { pathname: "/", search: "", hash: "" };
let MATCHES: any[] = [{ id: "/" }];

export const setLocation = (l: typeof LOC) => {
  LOC = l;
};
export const setMatches = (m: any[]) => {
  MATCHES = m;
};

export const useLocation = () => LOC;
export const useNavigation = () => ({ state: "idle" });
export const useNavigate = () => () => {};
export const useMatches = () => MATCHES; // hooks read only MATCHES.at(-1).id
export const useParams = () => ({});
export const useSearchParams = () => [new URLSearchParams(LOC.search), () => {}] as const;
export const useLoaderData = () => ({});

export const Link = ({ to, children, ...p }: any) =>
  React.createElement("a", { href: typeof to === "string" ? to : "#", ...p }, children);
export const NavLink = Link;
export const Outlet = ({ children }: any) => children ?? null;
export const ScrollRestoration = () => null;
export const Meta = () => null;
export const Links = () => null;
export const Scripts = () => null;
export const redirect = (u: string) => ({ __redirect: u });
