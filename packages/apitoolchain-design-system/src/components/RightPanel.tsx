import { type ReactNode, useContext } from "react";
import { createPortal } from "react-dom";
import { RightPanelSlot } from "./AppShell";

/**
 * Where the panel sits:
 * - `absolute-right` — a full-height rail on the right edge of the app frame
 *   (portaled into the {@link AppShell} slot), spanning past the page header.
 * - `content-right` — inline, to the right of the page content (below the page
 *   header). Render it beside the main content in a flex row.
 */
export type RightPanelPlacement = "absolute-right" | "content-right";

export interface RightPanelProps {
  placement?: RightPanelPlacement;
  children: ReactNode;
}

/** Contextual right-rail content for the current page. */
export function RightPanel({
  placement = "absolute-right",
  children,
}: RightPanelProps) {
  const node = useContext(RightPanelSlot);
  const body = <div className="flex flex-col gap-6">{children}</div>;

  if (placement === "content-right") {
    // A full-height column: stretches to the row (so the border runs the whole
    // content height and meets the PageHeader's bottom border to form an L).
    return (
      <aside className="w-[280px] shrink-0 border-l border-line-soft">
        <div className="flex flex-col gap-6 pt-6 pl-6">{children}</div>
      </aside>
    );
  }

  // absolute-right: portal into the AppShell rail. Nothing on the server /
  // before the slot mounts (the rail stays hidden until a page fills it).
  if (!node) return null;
  return createPortal(<div className="p-5">{body}</div>, node);
}

export interface RightPanelSectionProps {
  title: string;
  children: ReactNode;
}

/** A labelled group inside a {@link RightPanel} (small uppercase heading). */
export function RightPanelSection({ title, children }: RightPanelSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-subtle">
        {title}
      </div>
      {children}
    </div>
  );
}
