import type { ReactNode } from "react";

export interface DescriptionItem {
  label: string;
  value: ReactNode;
}

export interface DescriptionListProps {
  items: DescriptionItem[];
}

/** A responsive grid of label/value "facts" (an overview / detail block). */
export function DescriptionList({ items }: DescriptionListProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-px overflow-hidden rounded-panel border border-line bg-line">
      {items.map((it) => (
        <div key={it.label} className="bg-surface px-[18px] py-4">
          <div className="mb-1 text-xs text-subtle">{it.label}</div>
          <div className="text-sm font-medium break-words text-ink">
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
