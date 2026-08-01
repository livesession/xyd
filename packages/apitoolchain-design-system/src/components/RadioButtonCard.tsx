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
  /** Let the title/description wrap (the card grows taller) instead of
   * truncating on one line. Use for longer descriptions. */
  wrap?: boolean;
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
  wrap,
}: RadioButtonCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`flex ${
        wrap ? "items-start" : "items-center"
      } gap-3 rounded-control border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        selected ? "border-blue bg-hover" : "border-line hover:bg-hover"
      }`}
    >
      {leading}
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={`text-sm font-medium text-ink ${wrap ? "" : "truncate"}`}
        >
          {title}
        </span>
        {description && (
          <span className={`text-xs text-subtle ${wrap ? "" : "truncate"}`}>
            {description}
          </span>
        )}
      </div>
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
          wrap ? "mt-0.5" : ""
        } ${selected ? "border-blue" : "border-line"}`}
      >
        {selected && <span className="size-2 rounded-full bg-blue" />}
      </span>
    </button>
  );
}
