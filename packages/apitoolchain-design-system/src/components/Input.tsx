import { Icon, type IconName } from "../icons";

export interface InputProps {
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
  /** Optional leading icon rendered inside the control, before the text. */
  leadingIcon?: IconName;
}

/** A single-line text input. */
export function Input({
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
  leadingIcon,
}: InputProps) {
  const field = (
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
      className={`w-full rounded-control border border-line bg-surface py-[9px] text-sm text-ink outline-none transition-colors focus:border-subtle disabled:bg-surface-muted ${
        leadingIcon ? "pr-3 pl-9" : "px-3"
      }`}
    />
  );
  if (!leadingIcon) return field;
  return (
    <div className="relative">
      <Icon
        icon={leadingIcon}
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
      />
      {field}
    </div>
  );
}
