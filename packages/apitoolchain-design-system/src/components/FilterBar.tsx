import type { ReactNode } from "react";

export interface FilterBarProps {
  /** The search input slot — e.g. `<Search/>`. */
  search?: ReactNode;
  /** The filter-controls slot — applied-rule chips + the add-filter `<ButtonFilter/>`. */
  filters?: ReactNode;
  className?: string;
}

/**
 * A filter surface with two EXACT slots: `search` and `filters`. It owns no
 * state — the filter model + SQL compilation live in the consumer (e.g.
 * `@apitoolchain/filters`' `useFilterComposer`). It deliberately does NOT accept
 * arbitrary children: only a Search and the filter controls belong here.
 */
export function FilterBar({ search, filters, className }: FilterBarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {search}
      {filters}
    </div>
  );
}
