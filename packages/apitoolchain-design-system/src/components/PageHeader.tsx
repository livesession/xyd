import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  /**
   * Rendered inline, right after the title — for a compact status chip/pill
   * (e.g. a repo-sync indicator) that belongs with the title, not the actions.
   */
  leadingActions?: ReactNode;
  /** Rendered above the title (e.g. <Breadcrumb/>). */
  breadcrumb?: ReactNode;
  /** Right-aligned actions (buttons, menus). */
  actions?: ReactNode;
  /** Rendered below the title/description (e.g. <Tabs/>). */
  tabs?: ReactNode;
  /**
   * Full-bleed bottom divider (touches the sidebar). Shown by default; set
   * `false` to opt out. Tabs always carry it as their baseline regardless.
   */
  divider?: boolean;
}

/** The standard page header: breadcrumb, title + description, actions, tabs. */
export function PageHeader({
  title,
  description,
  leadingActions,
  breadcrumb,
  actions,
  tabs,
  divider = true,
}: PageHeaderProps) {
  // Tabs need the baseline as their underline; otherwise honour `divider`.
  const showBorder = !!tabs || divider;
  return (
    <header className={showBorder ? "mb-6" : "mb-7"}>
      {breadcrumb}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 min-w-0 text-page font-semibold tracking-[-0.02em] text-ink">
              {title}
            </h1>
            {leadingActions && (
              <div className="flex shrink-0 items-center gap-2">
                {leadingActions}
              </div>
            )}
          </div>
          {description && (
            <p className="mt-2 mb-0 max-w-[640px] text-sm leading-5 text-muted">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2.5">{actions}</div>
        )}
      </div>
      {/* Full-bleed bottom border: pulled out to the AppShell gutter so it
          touches the sidebar. With tabs it's their baseline (tabs stay aligned
          via px-12); without tabs it's the header divider. */}
      {showBorder && (
        <div
          className={`-mx-12 border-b border-line px-12 ${tabs ? "mt-[22px]" : "mt-6"}`}
        >
          {tabs}
        </div>
      )}
    </header>
  );
}
