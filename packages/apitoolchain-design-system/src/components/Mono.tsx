import type { ReactNode } from "react";

export interface MonoProps {
  children: ReactNode;
  tone?: "ink" | "muted";
}

const TONE: Record<NonNullable<MonoProps["tone"]>, string> = {
  ink: "text-ink",
  muted: "text-muted",
};

/** Inline monospace text (package names, spec ids, endpoints). */
export function Mono({ children, tone = "ink" }: MonoProps) {
  return (
    <span className={`font-mono text-[13px] ${TONE[tone]}`}>{children}</span>
  );
}
