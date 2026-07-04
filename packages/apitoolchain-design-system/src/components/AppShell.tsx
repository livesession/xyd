import type { ReactNode } from "react";

export interface AppShellProps {
  /** The left navigation rail (usually <Sidebar/>). */
  sidebar: ReactNode;
  /** Optional top bar rendered above the scrollable content. */
  topBar?: ReactNode;
  children: ReactNode;
}

/**
 * The application frame: a fixed sidebar next to a scrollable main content
 * column. Router-agnostic — the sidebar/topBar are injected by the host app.
 */
export function AppShell({ sidebar, topBar, children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden font-sans text-body">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        {topBar}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] px-12 pt-9 pb-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
