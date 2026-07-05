import {
  type FilterComposerController,
  type FilterSchema,
  parseQuery,
  useFilterComposer,
} from "@apitoolchain/filters";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

/**
 * A FilterComposer whose model is mirrored to the `?q=<SQL>` URL param — the URL
 * is the source of truth for the filter state. Read once from `?q=` on mount
 * (server + client agree, so no hydration mismatch), then every edit rewrites
 * `?q=` (via `replace`, so typing doesn't spam history). The compiled SQL — e.g.
 * `... where namespace in ('livesession')` — IS the shareable URL.
 */
export function useUrlFilters(schema: FilterSchema): FilterComposerController {
  const [searchParams, setSearchParams] = useSearchParams();
  // Parse the initial model once so SSR and the first client render match.
  const initial = useRef(parseQuery(schema, searchParams.get("q")));
  const filter = useFilterComposer(schema, initial.current);

  const model = filter.model;
  // Re-sync only when the model changes (everything derived changes with it).
  // biome-ignore lint/correctness/useExhaustiveDependencies: model is the trigger
  useEffect(() => {
    const isEmpty = filter.rules.length === 0 && !filter.query.trim();
    const q = filter.toQuery();
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (isEmpty) next.delete("q");
        else next.set("q", q);
        return next;
      },
      { replace: true },
    );
  }, [model]);

  return filter;
}
