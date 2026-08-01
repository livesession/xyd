import type { ReactNode } from "react";

export interface AuthFormFooterProps {
  children: ReactNode;
}

/**
 * The fine print below an auth card (e.g. Terms / Privacy legal text). Centered,
 * muted, small — pass whatever children you need.
 */
export function AuthFormFooter({ children }: AuthFormFooterProps) {
  return (
    <p className="mt-1 px-3 text-center text-[11px] leading-4 text-muted">
      {children}
    </p>
  );
}
