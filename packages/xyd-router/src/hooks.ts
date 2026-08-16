import * as React from "react";
import { RouterContext } from "./context";
import { withBase } from "./basename";
import type { To } from "./types";

const use = () => {
  const s = React.useContext(RouterContext);
  if (!s) throw new Error("@xyd-js/router hook used outside <RouterProvider>");
  return s;
};

// Per-field selectors (not the whole snapshot) so a `navigation.state` change
// does NOT re-render `useLocation`/`useMatches` subscribers — this preserves
// react-router's active-state timing.
export const useLocation = () => {
  const s = use();
  return React.useSyncExternalStore(
    s.subscribe,
    () => s.getSnapshot().location,
    () => s.getServerSnapshot().location
  );
};
export const useNavigation = () => {
  const s = use();
  return React.useSyncExternalStore(
    s.subscribe,
    () => s.getSnapshot().navigation,
    () => s.getServerSnapshot().navigation
  );
};
export const useMatches = () => {
  const s = use();
  return React.useSyncExternalStore(
    s.subscribe,
    () => s.getSnapshot().matches,
    () => s.getServerSnapshot().matches
  );
};
export const useLoaderData = () => {
  const s = use();
  return React.useSyncExternalStore(
    s.subscribe,
    () => s.getSnapshot().loaderData,
    () => s.getServerSnapshot().loaderData
  );
};

export const useParams = () => {
  const m = useMatches();
  return m[m.length - 1]?.params ?? {};
};

export const useNavigate = () => {
  const s = use();
  return React.useCallback((to: To, o?: { replace?: boolean }) => s.navigate(to, o), [s]);
};

export function useHref(to: To): string {
  const s = React.useContext(RouterContext);
  const loc = useLocation();
  const raw = typeof to === "string" ? to : (to.pathname ?? loc.pathname) + (to.search ?? "") + (to.hash ?? "");
  // Prefix the basename for the RENDERED href (React Router parity); Link's
  // onClick still navigates with the basename-free `to`, so the store's internal
  // location stays basename-free.
  return withBase(s?.basename || "", raw);
}

export function useSearchParams() {
  const loc = useLocation();
  const s = use();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const set = React.useCallback(
    (next: any, o?: { replace?: boolean }) => {
      const p = typeof next === "function" ? next(new URLSearchParams(loc.search)) : new URLSearchParams(next);
      const q = p.toString();
      s.navigate({ pathname: loc.pathname, search: q ? `?${q}` : "", hash: loc.hash }, { replace: true, ...o });
    },
    [s, loc.pathname, loc.search, loc.hash]
  );
  return [params, set] as const;
}
