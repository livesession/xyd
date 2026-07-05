export interface ToggleProps {
  checked?: boolean;
  /** When provided, the toggle is interactive (a `role="switch"` button).
   * Omit it to render a presentational switch (e.g. inside {@link ToggleTile}). */
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

const TRACK =
  "relative inline-block h-3.5 w-6 min-w-6 shrink-0 rounded-full transition-colors";
const KNOB =
  "absolute top-px left-px size-3 rounded-full bg-white transition-transform";

/** A small on/off switch. */
export function Toggle({
  checked = false,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: ToggleProps) {
  const track = `${TRACK} ${checked ? "bg-blue" : "bg-surface-pill"} ${disabled ? "opacity-60" : ""}`;
  const knob = `${KNOB} ${checked ? "translate-x-[10px]" : ""}`;
  if (!onChange) {
    return (
      <span aria-hidden className={track}>
        <span className={knob} />
      </span>
    );
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`${track} cursor-pointer disabled:cursor-not-allowed`}
    >
      <span className={knob} />
    </button>
  );
}
