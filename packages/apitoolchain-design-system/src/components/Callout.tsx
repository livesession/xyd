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
  /** When set, a close (×) button appears — revealed on hover/focus — that calls
   * this. For dismissible, transient callouts (e.g. a "Saved" banner). */
  onClose?: () => void;
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
  onClose,
}: CalloutProps) {
  const t = TONE[tone];
  const glyph = icon === false || icon === null ? null : (icon ?? t.icon);
  return (
    <div
      className={`group/callout flex gap-2.5 rounded-control px-3 py-2.5 text-[13px] ${t.box}`}
    >
      {glyph && <Icon icon={glyph} size={16} className="mt-px shrink-0" />}
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium">{title}</div>}
        <div className={title ? "mt-0.5" : undefined}>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          // Hidden until the callout is hovered (or the button is focused for
          // keyboard users); `opacity` keeps its space reserved so nothing jumps.
          className="-mt-0.5 -mr-1 shrink-0 cursor-pointer self-start rounded-control border-none bg-transparent p-1 text-current opacity-0 transition-opacity hover:bg-hover focus-visible:opacity-100 group-hover/callout:opacity-100"
        >
          <Icon icon="close" size={14} />
        </button>
      )}
    </div>
  );
}
