import type { ReactNode } from "react";
import { Toggle } from "./Toggle";

export interface ToggleTileProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label: ReactNode;
  /** Optional leading node (icon/logo). */
  leading?: ReactNode;
  disabled?: boolean;
}

/** A selectable row: leading icon + label + a trailing {@link Toggle} switch. */
export function ToggleTile({
  checked = false,
  onChange,
  label,
  leading,
  disabled,
}: ToggleTileProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className="flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-control border border-transparent bg-surface-muted px-3 py-2 text-left transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {leading}
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{label}</span>
      <Toggle checked={checked} />
    </button>
  );
}
