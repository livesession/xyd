export interface TextareaProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  rows?: number;
  mono?: boolean;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

/** A multi-line text input (e.g. pasting a spec). `mono` for code/specs. */
export function Textarea({
  value,
  defaultValue,
  placeholder,
  id,
  name,
  rows = 8,
  mono,
  onChange,
  disabled,
}: TextareaProps) {
  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full resize-y rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-subtle disabled:bg-surface-muted ${mono ? "font-mono text-[13px] leading-5" : ""}`}
    />
  );
}
