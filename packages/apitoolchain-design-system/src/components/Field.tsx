import type { ReactNode } from "react";
import { Hint } from "./Hint";

export interface FieldProps {
  label: string;
  hint?: string;
  /** An explanation revealed by an info (ⓘ) icon next to the label. */
  labelHint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}

/** A labeled form field wrapper (label + control + optional hint). */
export function Field({
  label,
  hint,
  labelHint,
  htmlFor,
  children,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-body">
          {label}
        </label>
        {labelHint && <Hint>{labelHint}</Hint>}
      </div>
      {children}
      {hint && <span className="text-xs text-subtle">{hint}</span>}
    </div>
  );
}
