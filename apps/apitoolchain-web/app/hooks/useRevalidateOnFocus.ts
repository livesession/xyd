import { useEffect } from "react";
import { useRevalidator } from "react-router";

/**
 * Re-run the current route's loaders when the tab regains focus or becomes
 * visible again — event-driven, no polling. Use it for state that settles
 * server-side after an async job (e.g. the initial release PR opened after
 * connecting a repo): switch away and back and the page reflects the new state
 * without a manual refresh.
 *
 * @param enabled Only listen while there's something worth re-checking, so a
 *   fully-settled page doesn't revalidate on every focus.
 */
export function useRevalidateOnFocus(enabled = true) {
  const { revalidate } = useRevalidator();
  useEffect(() => {
    if (!enabled) return;
    const run = () => {
      if (document.visibilityState === "visible") revalidate();
    };
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", run);
    };
  }, [enabled, revalidate]);
}
