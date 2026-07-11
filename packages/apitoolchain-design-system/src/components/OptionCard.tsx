import type { ReactNode } from "react";

export interface OptionCardProps {
  title: ReactNode;
  description?: ReactNode;
  /** Top media row (icons/logos). */
  media?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Renders a selected state (accent border) — for card-based single choices. */
  selected?: boolean;
}

// Border-color + bg are set per-state below (not here) so the selected style
// isn't overridden by a competing base utility of the same property.
const BASE =
  "flex flex-col items-start gap-3 rounded-control border p-4 text-left transition-colors";

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
  selected,
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
        className={`${BASE} border-transparent bg-surface-muted ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        }`}
      >
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`${BASE} cursor-pointer ${
        selected
          ? "border-blue bg-hover"
          : "border-transparent bg-surface-muted hover:bg-hover"
      }`}
    >
      {body}
    </button>
  );
}
