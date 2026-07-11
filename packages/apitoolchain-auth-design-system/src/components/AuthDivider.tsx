export interface AuthDividerProps {
  /** Centered label between the rules. Default `or`. */
  label?: string;
}

/** A labelled horizontal rule (e.g. between social + email sign-in). */
export function AuthDivider({ label = "or" }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs text-muted">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
