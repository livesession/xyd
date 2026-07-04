import type { ReactNode } from "react";

export interface FieldProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}

/** A labeled form field wrapper (label + control + optional hint). */
export function Field({ label, hint, htmlFor, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-body">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-subtle">{hint}</span>}
    </div>
  );
}
