import * as React from "react";
import { useLocation } from "./hooks";

// SSR/host-only no-ops (the Bun render tree nests DocsBody directly, not via
// <Outlet/>). Kept for react-router import compatibility.
export const Meta = () => null;
export const Links = () => null;
export const Scripts = () => null;
export const Outlet = ({ children }: any) => children ?? null;

// Loader redirect sentinel — matches the {__redirect} shape the host loader
// harness expects (server/build only).
export const redirect = (url: string, init?: { status?: number }) => ({ __redirect: url, status: init?.status ?? 302 });

export function ScrollRestoration() {
  const loc = useLocation();
  const prev = React.useRef<string | undefined>(undefined);
  React.useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (loc.hash) return; // anchor scroll owned by $Heading/Toc
    if (prev.current && prev.current !== loc.key) window.scrollTo(0, 0); // PUSH → top
    prev.current = loc.key;
  }, [loc.key, loc.hash]);
  return null;
}
