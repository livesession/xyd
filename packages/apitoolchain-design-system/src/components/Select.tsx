import { Icon } from "../icons";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  id?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

/** A native `<select>` styled to match the design system. */
export function Select({
  value,
  defaultValue,
  options,
  id,
  onChange,
  disabled,
}: SelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-control border border-line bg-surface py-[9px] pr-9 pl-3 text-sm text-ink disabled:cursor-not-allowed disabled:bg-surface-muted"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {/* Custom chevron (the native one sits jammed at the right edge). */}
      <Icon
        icon="chevronUpDown"
        size={14}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
