import type { ReactNode } from "react";

export interface OptionCardProps {
  title: ReactNode;
  description?: ReactNode;
  /** Top media row (icons/logos). */
  media?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const BASE =
  "flex flex-col items-start gap-3 rounded-control border border-transparent bg-surface-muted p-4 text-left transition-colors";

/**
 * A vertical choice card: a media row on top, then a title + description.
 * Clickable (a button) unless `disabled` or no `onClick` (a static card).
 */
export function OptionCard({
  title,
  description,
  media,
  onClick,
  disabled,
}: OptionCardProps) {
  const body = (
    <>
      {media && <span className="flex items-center gap-1.5">{media}</span>}
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">{title}</span>
        {description && (
          <span className="text-xs text-subtle">{description}</span>
        )}
      </span>
    </>
  );
  if (disabled || !onClick) {
    return (
      <div
        className={`${BASE} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${BASE} cursor-pointer hover:bg-hover`}
    >
      {body}
    </button>
  );
}
