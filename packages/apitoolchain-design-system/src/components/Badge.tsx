import type { ReactNode } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "accent";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: IconName;
  /** Show a leading status dot (instead of an icon). */
  dot?: boolean;
}

const TEXT_BG: Record<BadgeTone, string> = {
  neutral: "text-muted bg-surface-pill",
  info: "text-info bg-info-bg",
  success: "text-success bg-success-bg",
  warning: "text-warn bg-warn-bg",
  error: "text-danger bg-danger-bg",
  accent: "text-accent bg-accent-bg",
};

const DOT_BG: Record<BadgeTone, string> = {
  neutral: "bg-muted",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warn",
  error: "bg-danger",
  accent: "bg-accent",
};

/** A small toned label pill. */
export function Badge({ children, tone = "neutral", icon, dot }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-[9px] py-[2px] text-xs font-medium leading-[18px] tracking-[0.01em] ${TEXT_BG[tone]}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 shrink-0 rounded-pill ${DOT_BG[tone]}`} />
      )}
      {icon && <Icon icon={icon} size={13} />}
      {children}
    </span>
  );
}

const STATUS: Record<string, { tone: BadgeTone; label: string }> = {
  ready: { tone: "success", label: "Ready" },
  building: { tone: "info", label: "Building" },
  built: { tone: "neutral", label: "Built" },
  error: { tone: "error", label: "Error" },
  draft: { tone: "neutral", label: "Draft" },
  published: { tone: "success", label: "Published" },
};

export interface StatusPillProps {
  /** A BuildStatus-like value (ready | building | error | draft | published). */
  status: string;
}

/** A dot badge for a generation/build status. */
export function StatusPill({ status }: StatusPillProps) {
  const s = STATUS[status] ?? { tone: "neutral" as BadgeTone, label: status };
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}
