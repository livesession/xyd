import { createContext, type ReactNode, useState } from "react";

export interface AppShellProps {
  /** The left navigation rail (usually <Sidebar/>). */
  sidebar: ReactNode;
  /** Optional top bar rendered above the scrollable content. */
  topBar?: ReactNode;
  children: ReactNode;
}

/**
 * The DOM node of the right-panel slot, exposed so a page can portal contextual
 * content into it via {@link RightPanel}. Null on the server / before mount.
 */
export const RightPanelSlot = createContext<HTMLElement | null>(null);

/**
 * The application frame: a fixed sidebar, a scrollable main content column, and
 * an optional right rail. A page fills the right rail by rendering
 * {@link RightPanel} anywhere in its tree; when none does, the rail is hidden
 * (`empty:hidden`). Router-agnostic — the sidebar/topBar are injected.
 */
export function AppShell({ sidebar, topBar, children }: AppShellProps) {
  const [panelNode, setPanelNode] = useState<HTMLElement | null>(null);
  return (
    <RightPanelSlot.Provider value={panelNode}>
      <div className="flex h-screen w-full overflow-hidden font-sans text-body">
        {sidebar}
        <div className="flex min-w-0 flex-1 flex-col bg-surface">
          {topBar}
          <main className="min-w-0 flex-1 overflow-y-auto">
            {/* Full-height flex column so a page's content-right RightPanel can
                fill the viewport (flex-1 row) down to the bottom. */}
            <div className="mx-auto flex min-h-full max-w-[1600px] flex-col px-12 pt-9 pb-16">
              {children}
            </div>
          </main>
        </div>
        <aside
          ref={setPanelNode}
          className="h-full w-[300px] shrink-0 overflow-y-auto border-l border-line-soft bg-surface empty:hidden"
        />
      </div>
    </RightPanelSlot.Provider>
  );
}

/** A vertical stack of {@link ContentSection}s within {@link AppShell}'s content. */
export function ContentSections({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col">{children}</div>;
}

export interface ContentSectionProps {
  children: ReactNode;
  /**
   * Draw a full-bleed top rule — pulled out to the shell gutter (`-mx-12 … px-12`,
   * like the PageHeader's bottom border) so it runs edge to edge, touching the
   * sidebar on the left and the right rail on the right. Omit it on the first
   * section; add it to each later one to set that band apart.
   */
  divided?: boolean;
}

/**
 * A band of page content inside {@link AppShell}. Stack several in
 * {@link ContentSections}; a `divided` band draws a full-bleed rule above itself
 * so it reads as its own area — e.g. a page's details, then a "Targets" band
 * under a line that touches the sidebar and the right rail.
 */
export function ContentSection({
  children,
  divided = false,
}: ContentSectionProps) {
  return (
    <section
      className={
        divided ? "-mx-12 mt-9 border-t border-line px-12 pt-9" : undefined
      }
    >
      {children}
    </section>
  );
}
