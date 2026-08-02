import type { RLoc, Snap, To, RouterStore, RouterInit } from "./types";

let _k = 0;
// Monotonic key for history entries + scroll restoration. Counter only (no
// Date.now), so it's deterministic and SSR-safe — the server never calls it.
const genKey = () => `k${(_k++).toString(36)}`;

function resolveTo(to: To, base: RLoc): URL {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://x";
  if (typeof to === "string") return new URL(to, origin + base.pathname);
  const pathname = to.pathname ?? base.pathname;
  const search = to.search ?? "";
  const hash = to.hash ?? "";
  return new URL(pathname + search + hash, origin);
}

/**
 * The single reactive router store. Holds ONE frozen `Snap`; `set()` spreads so
 * unchanged field references stay `Object.is`-stable — this is what preserves
 * react-router's active-state timing (a `navigation.state` flip must NOT
 * re-render `useLocation` consumers, since the hooks select per-field).
 */
export function createRouterStore(init: RouterInit): RouterStore {
  let snap: Snap = Object.freeze({
    location: init.location,
    matches: init.matches,
    navigation: { state: "idle" as const },
    loaderData: init.matches.at(-1)?.data,
  });
  const server = snap; // frozen per-request snapshot for getServerSnapshot
  const subs = new Set<() => void>();
  const emit = () => subs.forEach((f) => f());
  const set = (p: Partial<Snap>) => {
    snap = Object.freeze({ ...snap, ...p });
    emit();
  };

  // navigate() drives history itself and commits location atomically; the
  // pushState/replaceState patch (install) must NOT also update location during
  // navigate's own history calls (that would leak the new location into the
  // loading phase). This flag suppresses the patch's auto-set for those calls.
  let internalHistory = false;

  const getSnapshot = () => snap;
  const getServerSnapshot = () => server;
  const subscribe = (f: () => void) => {
    subs.add(f);
    return () => subs.delete(f);
  };

  const pushOrReplace = (replace: boolean | undefined, key: string, href: string) => {
    internalHistory = true;
    try {
      history[replace ? "replaceState" : "pushState"]({ key }, "", href);
    } finally {
      internalHistory = false;
    }
  };

  async function navigate(to: To, opts: { replace?: boolean } = {}) {
    if (typeof window === "undefined") return;
    const url = resolveTo(to, snap.location);
    if (url.origin !== window.location.origin) {
      window.location.assign(url.href);
      return;
    }
    const target: RLoc = { pathname: url.pathname, search: url.search, hash: url.hash, key: genKey() };

    // Pure hash / same-page change → update location only; no loading, no fetch.
    if (url.pathname === snap.location.pathname && url.search === snap.location.search) {
      pushOrReplace(opts.replace, target.key!, url.href);
      set({ location: target });
      return;
    }

    if (!init.loadPageData) {
      window.location.assign(url.href); // no client fetcher (MPA fallback) → hard nav
      return;
    }

    set({ navigation: { state: "loading", location: target } }); // 1) loading, KEEP old snap.location
    pushOrReplace(opts.replace, target.key!, url.href); // 2) URL changes now
    try {
      const { matches } = await init.loadPageData(url); // 3) fetch page data
      set({ location: target, matches, loaderData: matches.at(-1)?.data, navigation: { state: "idle" } }); // 4) atomic commit
    } catch {
      set({ navigation: { state: "idle" } });
      window.location.assign(url.href); // hard-nav fallback → degrades to MPA, never dead-ends
    }
  }

  function install() {
    if (typeof window === "undefined") return () => {};
    // Patch pushState/replaceState so DIRECT history writes (Toc hash writes, any
    // legacy scroll hack) flow into the store + re-dispatch the event
    // ReactContent's $Heading listens for. navigate()'s own calls are suppressed
    // (internalHistory) so they don't double-update location.
    const patch = (t: "pushState" | "replaceState") => {
      const orig = history[t];
      history[t] = function (d: any, u: string, href?: any) {
        const r = orig.call(history, d, u, href);
        if (!internalHistory) {
          window.dispatchEvent(new Event(t));
          const l = window.location;
          set({ location: { pathname: l.pathname, search: l.search, hash: l.hash, key: d?.key } });
        }
        return r;
      } as typeof history.pushState;
      return () => {
        history[t] = orig;
      };
    };
    const un1 = patch("pushState");
    const un2 = patch("replaceState");
    const onPop = () => {
      const url = new URL(window.location.href);
      const loc: RLoc = { pathname: url.pathname, search: url.search, hash: url.hash };
      if (url.pathname === snap.location.pathname && url.search === snap.location.search) {
        set({ location: loc });
        return;
      }
      if (!init.loadPageData) {
        window.location.reload();
        return;
      }
      set({ navigation: { state: "loading" } });
      init
        .loadPageData(url)
        .then(({ matches }) => set({ location: loc, matches, loaderData: matches.at(-1)?.data, navigation: { state: "idle" } }))
        .catch(() => window.location.reload());
    };
    window.addEventListener("popstate", onPop);
    return () => {
      un1();
      un2();
      window.removeEventListener("popstate", onPop);
    };
  }

  return { subscribe, getSnapshot, getServerSnapshot, navigate, install };
}
