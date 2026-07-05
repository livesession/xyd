import type { ReactNode } from "react";

export interface RadioButtonCardProps {
  /** Whether this option is the selected one. */
  selected?: boolean;
  onSelect?: () => void;
  title: ReactNode;
  /** Secondary line under the title (e.g. a namespace/id). */
  description?: ReactNode;
  /** Optional leading node (icon/logo). */
  leading?: ReactNode;
  disabled?: boolean;
}

/**
 * A single selectable option rendered as a bordered card with a trailing radio
 * dot. Stack several (in a `flex flex-col gap-2`) for a radio group.
 */
export function RadioButtonCard({
  selected = false,
  onSelect,
  title,
  description,
  leading,
  disabled,
}: RadioButtonCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-control border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        selected ? "border-blue bg-hover" : "border-line hover:bg-hover"
      }`}
    >
      {leading}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-ink">{title}</span>
        {description && (
          <span className="truncate text-xs text-subtle">{description}</span>
        )}
      </div>
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-blue" : "border-line"
        }`}
      >
        {selected && <span className="size-2 rounded-full bg-blue" />}
      </span>
    </button>
  );
}
