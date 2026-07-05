import type { ReactNode } from "react";
import { Icon } from "../icons";

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Optional left-aligned summary, e.g. "1–20 of 137". */
  summary?: ReactNode;
}

type PageItem = { kind: "page"; page: number } | { kind: "gap"; key: string };

/** The windowed page list: first, last, current ±1, with "…" for the gaps.
 * Gaps carry a stable key derived from the boundary pages (never an index). */
function pageWindow(page: number, pageCount: number): PageItem[] {
  const wanted = [1, pageCount, page - 1, page, page + 1].filter(
    (n) => n >= 1 && n <= pageCount,
  );
  const pages = [...new Set(wanted)].sort((a, b) => a - b);
  const out: PageItem[] = [];
  let prev = 0;
  for (const n of pages) {
    if (n - prev > 1) out.push({ kind: "gap", key: `gap-${prev}-${n}` });
    out.push({ kind: "page", page: n });
    prev = n;
  }
  return out;
}

// Split idle vs active so the two never apply conflicting color utilities to
// the same button — otherwise the active page's `bg-ink`/`text-white` collide
// with the base `bg-surface`/`text-body` and Tailwind's cascade can win the
// wrong one (white text on a light background → the current page looks blank).
// No color transition: the active page must swap INSTANTLY. With a transition,
// clicking a new page leaves the old button's highlight fading out while the
// new one fades in, which reads as "old then new" for a moment.
const BTN_BASE =
  "inline-flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-control border px-2 text-[13px] leading-none disabled:cursor-not-allowed disabled:opacity-50";
const BTN_IDLE = "border-line bg-surface text-body hover:bg-surface-muted";
const BTN_ACTIVE = "border-ink bg-ink font-medium text-white";

/** A numbered pager with prev/next arrows and an optional item-range summary. */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  summary,
}: PaginationProps) {
  if (pageCount <= 1 && !summary) return null;
  const go = (p: number) => onPageChange(Math.min(Math.max(1, p), pageCount));
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3"
    >
      {summary ? (
        <span className="text-[12px] text-subtle">{summary}</span>
      ) : (
        <span />
      )}
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`${BTN_BASE} ${BTN_IDLE}`}
            onClick={() => go(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <Icon icon="chevronRight" size={14} className="rotate-180" />
          </button>
          {pageWindow(page, pageCount).map((it) =>
            it.kind === "gap" ? (
              <span key={it.key} className="px-1 text-[13px] text-muted">
                …
              </span>
            ) : (
              <button
                key={it.page}
                type="button"
                className={`${BTN_BASE} ${it.page === page ? BTN_ACTIVE : BTN_IDLE}`}
                aria-current={it.page === page ? "page" : undefined}
                onClick={() => go(it.page)}
              >
                {it.page}
              </button>
            ),
          )}
          <button
            type="button"
            className={`${BTN_BASE} ${BTN_IDLE}`}
            onClick={() => go(page + 1)}
            disabled={page >= pageCount}
            aria-label="Next page"
          >
            <Icon icon="chevronRight" size={14} />
          </button>
        </div>
      )}
    </nav>
  );
}
