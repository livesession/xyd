import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Rendered above the title (e.g. <Breadcrumb/>). */
  breadcrumb?: ReactNode;
  /** Right-aligned actions (buttons, menus). */
  actions?: ReactNode;
  /** Rendered below the title/description (e.g. <Tabs/>). */
  tabs?: ReactNode;
}

/** The standard page header: breadcrumb, title + description, actions, tabs. */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  tabs,
}: PageHeaderProps) {
  return (
    <header className={tabs ? "mb-6" : "mb-7"}>
      {breadcrumb}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="m-0 text-page font-semibold tracking-[-0.02em] text-ink">
            {title}
          </h1>
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
      {/* Full-bleed baseline: pull the tab strip out to the AppShell gutter so
          its underline touches the sidebar, while the tabs stay aligned with
          the page content (px-12 re-inset to match the content padding). */}
      {tabs && (
        <div className="mt-[22px] -mx-12 border-b border-line px-12">
          {tabs}
        </div>
      )}
    </header>
  );
}
