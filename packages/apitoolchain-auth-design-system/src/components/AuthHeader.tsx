import type { ReactNode } from "react";

export interface AuthHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
}

/** The hero above an auth card: a bold title + a muted subtitle. */
export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="mb-6 text-center">
      <h1 className="m-0 text-[34px] font-semibold leading-[40px] tracking-[-0.02em] text-ink">
        {title}
      </h1>
      {subtitle && (
        <p className="mx-auto mt-2.5 max-w-[300px] text-[13px] leading-5 text-subtle">
          {subtitle}
        </p>
      )}
    </div>
  );
}
