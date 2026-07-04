import type { ReactNode } from "react";
import { AnchorLink, type LinkComponent } from "./routing";

/** Preset column widths (kept a fixed set so every width is a static class). */
export type ColumnWidth = "auto" | "wide" | "xs" | "sm" | "md" | "lg";

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Defaults to "auto" (grows to fill). */
  width?: ColumnWidth;
  align?: "left" | "right" | "center";
  render?: (row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** When set, each row becomes a link to `rowHref(row)`. */
  rowHref?: (row: T) => string;
  linkComponent?: LinkComponent;
  onRowClick?: (row: T) => void;
  /** Rendered under the header when there are no rows. */
  empty?: ReactNode;
}

const WIDTH: Record<ColumnWidth, string> = {
  auto: "flex-1 min-w-0",
  wide: "flex-[1.5] min-w-0",
  xs: "w-[90px] shrink-0",
  sm: "w-[112px] shrink-0",
  md: "w-[132px] shrink-0",
  lg: "w-[164px] shrink-0",
};

const ALIGN: Record<NonNullable<Column<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

function cellValue<T>(col: Column<T>, row: T): ReactNode {
  if (col.render) return col.render(row);
  const v = (row as unknown as Record<string, unknown>)[col.key];
  return v == null ? "" : String(v);
}

function RowCells<T>({ row, columns }: { row: T; columns: Column<T>[] }) {
  return (
    <>
      {columns.map((c) => (
        <div
          key={c.key}
          className={`px-4 py-3 text-sm leading-5 text-body ${c.render ? "min-w-0 overflow-hidden" : "truncate"} ${WIDTH[c.width ?? "auto"]} ${ALIGN[c.align ?? "left"]}`}
        >
          {cellValue(c, row)}
        </div>
      ))}
    </>
  );
}

/** A generic, column-driven data table (flex rows). Rows link via `rowHref`. */
export function Table<T>({
  columns,
  rows,
  getRowKey,
  rowHref,
  linkComponent,
  onRowClick,
  empty,
}: TableProps<T>) {
  const Link = linkComponent ?? AnchorLink;
  const rowCls =
    "flex items-center border-t border-line text-body no-underline transition-colors hover:bg-surface-muted";
  return (
    <div className="overflow-hidden rounded-box border border-line">
      <div className="flex items-center bg-surface-muted">
        {columns.map((c) => (
          <div
            key={c.key}
            className={`px-4 py-2.5 text-xs font-semibold tracking-[0.03em] text-subtle uppercase ${WIDTH[c.width ?? "auto"]} ${ALIGN[c.align ?? "left"]}`}
          >
            {c.header}
          </div>
        ))}
      </div>
      {rows.length === 0
        ? (empty ?? null)
        : rows.map((row) => {
            const href = rowHref?.(row);
            if (href) {
              return (
                <Link key={getRowKey(row)} href={href} className={rowCls}>
                  <RowCells row={row} columns={columns} />
                </Link>
              );
            }
            if (onRowClick) {
              return (
                <button
                  key={getRowKey(row)}
                  type="button"
                  onClick={() => onRowClick(row)}
                  className={`w-full cursor-pointer ${rowCls}`}
                >
                  <RowCells row={row} columns={columns} />
                </button>
              );
            }
            return (
              <div
                key={getRowKey(row)}
                className="flex items-center border-t border-line"
              >
                <RowCells row={row} columns={columns} />
              </div>
            );
          })}
    </div>
  );
}
