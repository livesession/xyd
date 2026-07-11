import type { ReactNode } from "react";

export interface StatGridProps {
  /** Each child (usually a <StatTile/>, optionally link-wrapped) is one cell. */
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

const COLS: Record<NonNullable<StatGridProps["columns"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

/**
 * A bordered grid of metric cells with hairline dividers. Children (StatTiles)
 * paint their own surface background; the 1px grid gap over a `bg-line` backdrop
 * becomes the dividers — no per-cell border wiring.
 */
export function StatGrid({ children, columns = 4 }: StatGridProps) {
  return (
    <div
      className={`grid gap-px overflow-hidden rounded-box border border-line bg-line ${COLS[columns]}`}
    >
      {children}
    </div>
  );
}
