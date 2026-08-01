export interface AuthInputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  id?: string;
  /** Field name — required for uncontrolled `<Form>` submissions. */
  name?: string;
  required?: boolean;
  autoComplete?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

/**
 * A single-line text input for auth forms — the same look as the design-system
 * {@link Input} but with a full (pill) border-radius to match {@link AuthButton}.
 */
export function AuthInput({
  value,
  defaultValue,
  placeholder,
  type = "text",
  id,
  name,
  required,
  autoComplete,
  onChange,
  disabled,
}: AuthInputProps) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoComplete={autoComplete}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full rounded-pill border border-line bg-surface px-4 py-[9px] text-sm text-ink outline-none transition-colors focus:border-subtle disabled:bg-surface-muted"
    />
  );
}
