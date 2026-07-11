import { Icon } from "../icons";
import { ComboboxMenu, type ComboboxMenuOption } from "./ComboboxMenu";

/** Same shape as {@link ComboboxMenuOption}. */
export type ComboboxOption = ComboboxMenuOption;

export interface ComboboxProps {
  /** Selected values (controlled, multi-select). */
  value: string[];
  onChange: (value: string[]) => void;
  /** Preset, checkable options (e.g. the currently-available dist-tags). */
  options?: ComboboxOption[];
  /** Allow adding values by typing them (not just picking from `options`). */
  allowCustom?: boolean;
  /** Trigger placeholder shown when nothing is selected. */
  placeholder?: string;
  id?: string;
  /** Field name — emits a hidden input with the comma-joined value for `<Form>`. */
  name?: string;
  disabled?: boolean;
}

/**
 * A multi-select combobox: check values from a preset list AND/OR type your own.
 * Selected values render as removable chips in the trigger; the popover (the
 * shared {@link ComboboxMenu}) has a filter input, checkable rows, and — when
 * `allowCustom` — an `Add "<typed>"` row. This component supplies the chip
 * trigger + multi-select semantics (exclusive options clear the rest); the menu
 * itself is the reusable primitive.
 */
export function Combobox({
  value,
  onChange,
  options = [],
  allowCustom = true,
  placeholder = "Select…",
  id,
  name,
  disabled,
}: ComboboxProps) {
  const optFor = (v: string) => options.find((o) => o.value === v);
  const labelFor = (v: string) => optFor(v)?.label ?? v;
  const isExclusive = (v: string) => optFor(v)?.exclusive ?? false;
  const exclusiveValues = new Set(
    options.filter((o) => o.exclusive).map((o) => o.value),
  );
  const dropExclusive = (vals: string[]) =>
    vals.filter((x) => !exclusiveValues.has(x));

  // Presets + any selected custom values not in the presets (so a typed value
  // still shows as a checkable row).
  const menuOptions: ComboboxMenuOption[] = [
    ...options,
    ...value
      .filter((v) => !options.some((o) => o.value === v))
      .map((v) => ({ value: v })),
  ];

  // Toggle if already selected; an exclusive option replaces everything; a
  // normal value (incl. a typed custom one) clears any exclusive selection.
  function select(v: string) {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
      return;
    }
    onChange(isExclusive(v) ? [v] : [...dropExclusive(value), v]);
  }

  return (
    <ComboboxMenu
      options={menuOptions}
      selected={value}
      onSelect={select}
      allowCustom={allowCustom}
      disabled={disabled}
    >
      {({ toggle }) => (
        <>
          {name && <input type="hidden" name={name} value={value.join(",")} />}
          {/* Trigger: chips of the selected values (+ placeholder when empty). */}
          {/* biome-ignore lint/a11y: composite widget — the menu's filter input owns keyboard/focus. */}
          <div
            id={id}
            onClick={toggle}
            className={`flex min-h-[38px] w-full flex-wrap items-center gap-1.5 rounded-control border border-line bg-surface py-1.5 pr-9 pl-2 text-sm ${
              disabled ? "cursor-not-allowed bg-surface-muted" : "cursor-text"
            }`}
          >
            {value.length === 0 && (
              <span className="px-1 text-muted">{placeholder}</span>
            )}
            {value.map((v) => {
              const chipIcon = optFor(v)?.icon;
              return (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 rounded-control bg-surface-pill px-2 py-0.5 text-[13px] text-ink"
                >
                  {chipIcon && (
                    <Icon icon={chipIcon} size={12} className="text-muted" />
                  )}
                  {labelFor(v)}
                  <button
                    type="button"
                    aria-label={`Remove ${labelFor(v)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(value.filter((x) => x !== v));
                    }}
                    className="cursor-pointer border-none bg-transparent p-0 text-muted hover:text-ink"
                  >
                    <Icon icon="close" size={12} />
                  </button>
                </span>
              );
            })}
          </div>
          <Icon
            icon="chevronUpDown"
            size={14}
            className="pointer-events-none absolute top-[11px] right-3 text-muted"
          />
        </>
      )}
    </ComboboxMenu>
  );
}
