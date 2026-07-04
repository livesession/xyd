export interface InputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  id?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

/** A single-line text input. */
export function Input({
  value,
  defaultValue,
  placeholder,
  type = "text",
  id,
  onChange,
  disabled,
}: InputProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full rounded-control border border-line bg-surface px-3 py-[9px] text-sm text-ink outline-none transition-colors focus:border-subtle disabled:bg-surface-muted"
    />
  );
}
