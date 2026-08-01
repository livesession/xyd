import type { IconName } from "../icons";
import { Icon } from "../icons";

export interface SearchProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Leading icon (defaults to a magnifier). */
  icon?: IconName;
  /** Extra classes on the container (e.g. a width). */
  className?: string;
}

/**
 * A pill-shaped search input with a leading magnifier. When controlled and
 * non-empty it shows a dark clear (×) pinned to the right edge (the native
 * `type="search"` clear button is hidden for consistent styling).
 */
export function Search({
  value,
  onChange,
  placeholder = "Search…",
  icon = "search",
  className,
}: SearchProps) {
  const showClear = Boolean(onChange) && value != null && value !== "";
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1 text-[13px] transition-colors focus-within:border-blue ${className ?? ""}`}
    >
      <Icon icon={icon} size={14} className="shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent p-0 text-[13px] text-ink outline-none placeholder:text-subtle [&::-webkit-search-cancel-button]:appearance-none"
      />
      {showClear && (
        <button
          type="button"
          onClick={() => onChange?.("")}
          aria-label="Clear search"
          className="-mr-1 inline-flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-pill text-ink transition-colors hover:bg-surface-muted"
        >
          <Icon icon="close" size={12} />
        </button>
      )}
    </div>
  );
}
