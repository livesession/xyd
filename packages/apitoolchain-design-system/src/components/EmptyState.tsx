import type { ReactNode } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  /** Optional CTA (usually a <Button/>). */
  action?: ReactNode;
}

/** A centered "nothing here yet" placeholder with an optional CTA. */
export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-6 py-14 text-center">
      {icon && (
        <span className="mb-1.5 inline-flex h-11 w-11 items-center justify-center rounded-tile bg-surface-raised text-muted">
          <Icon icon={icon} size={22} />
        </span>
      )}
      <div className="text-[15px] font-semibold text-ink">{title}</div>
      {description && (
        <div className="max-w-[380px] text-sm leading-5 text-muted">
          {description}
        </div>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
