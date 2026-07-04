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
    <select
      id={id}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full cursor-pointer rounded-control border border-line bg-surface px-3 py-[9px] text-sm text-ink disabled:cursor-not-allowed disabled:bg-surface-muted"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
