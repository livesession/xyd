import type { ReactNode } from "react";

export interface SectionProps {
  title: ReactNode;
  /** Right-aligned control in the section header (e.g. an "Add" button). */
  action?: ReactNode;
  children: ReactNode;
}

/** A titled content block for detail pages — a bold heading + optional action. */
export function Section({ title, action, children }: SectionProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold leading-6 text-ink">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
