import type { ReactNode } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";

export type CalloutTone = "info" | "success" | "warning" | "error";

export interface CalloutProps {
  /** Colour + default icon. Defaults to `error`. */
  tone?: CalloutTone;
  /** Override the leading icon; pass `false` (or `null`) to hide it. */
  icon?: IconName | false | null;
  /** Optional bold heading above the body. */
  title?: ReactNode;
  children: ReactNode;
}

// Reuse Badge's tone → token pairs so callouts and badges read the same.
const TONE: Record<CalloutTone, { box: string; icon: IconName }> = {
  info: { box: "text-info bg-info-bg", icon: "alert" },
  success: { box: "text-success bg-success-bg", icon: "check" },
  warning: { box: "text-warn bg-warn-bg", icon: "alert" },
  error: { box: "text-danger bg-danger-bg", icon: "alert" },
};

/** A toned, icon-led message box (error/warning/success/info). */
export function Callout({
  tone = "error",
  icon,
  title,
  children,
}: CalloutProps) {
  const t = TONE[tone];
  const glyph = icon === false || icon === null ? null : (icon ?? t.icon);
  return (
    <div
      className={`flex gap-2.5 rounded-control px-3 py-2.5 text-[13px] ${t.box}`}
    >
      {glyph && <Icon icon={glyph} size={16} className="mt-px shrink-0" />}
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium">{title}</div>}
        <div className={title ? "mt-0.5" : undefined}>{children}</div>
      </div>
    </div>
  );
}
