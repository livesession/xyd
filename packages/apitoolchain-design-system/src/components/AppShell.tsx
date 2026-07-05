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
