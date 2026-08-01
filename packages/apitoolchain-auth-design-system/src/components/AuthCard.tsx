import type { ReactNode } from "react";

export interface AuthCardProps {
  children: ReactNode;
}

/** The rounded, soft-shadowed panel that holds the auth actions/fields. */
export function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      className="flex flex-col gap-2.5 rounded-panel border border-line-soft bg-surface-1 p-4"
      style={{
        boxShadow:
          "0 4px 24px 0 hsl(0 0% 0% / 1.57%), 0 4px 32px 0 hsl(0 0% 0% / 1.57%), 0 2px 64px 0 hsl(0 0% 0% / 1.18%), 0 16px 32px 0 hsl(0 0% 0% / 1.18%)",
      }}
    >
      {children}
    </div>
  );
}
