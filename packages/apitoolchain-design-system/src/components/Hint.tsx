import type { ReactNode } from "react";
import { Icon } from "../icons";
import { Tooltip, type TooltipSide } from "./Tooltip";

export interface HintProps {
  /** The explanation shown in the tooltip on hover/focus. */
  children: ReactNode;
  side?: TooltipSide;
  /** Icon size in px. Defaults to 14. */
  size?: number;
  /** Accessible label for the info trigger. Defaults to "More info". */
  label?: string;
}

/**
 * A small info (ⓘ) icon that reveals a tooltip on hover/focus — the smart way to
 * attach an explanation to a label without spelling it out inline. The trigger
 * is a real focusable button, so it's keyboard-reachable.
 */
export function Hint({
  children,
  side = "top",
  size = 14,
  label = "More info",
}: HintProps) {
  return (
    <Tooltip content={children} side={side}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex cursor-default text-muted transition-colors hover:text-ink"
      >
        <Icon icon="info" size={size} />
      </button>
    </Tooltip>
  );
}
