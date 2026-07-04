import type { ReactNode } from "react";

export interface PanelProps {
  children: ReactNode;
}

/** A bordered, rounded content container. */
export function Panel({ children }: PanelProps) {
  return (
    <div className="rounded-box border border-line bg-surface px-7 py-6">
      {children}
    </div>
  );
}
