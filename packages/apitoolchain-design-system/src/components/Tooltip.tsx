import { type ReactNode, useId } from "react";

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** The floating content shown on hover/focus. */
  content: ReactNode;
  /** The trigger — anything. Keyboard tooltips need a focusable trigger. */
  children: ReactNode;
  /** Which side of the trigger the bubble sits on. Defaults to `top`. */
  side?: TooltipSide;
}

const SIDE: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
  left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
  right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
};

/**
 * A general tooltip: wrap any trigger and pass `content`. Reveals on hover and
 * on keyboard focus of the trigger (`group-focus-within`) — pure CSS, no JS. The
 * bubble is `pointer-events-none` so it never eats the trigger's interactions.
 */
export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const id = useId();
  return (
    <span className="group relative inline-flex">
      <span aria-describedby={id} className="inline-flex">
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        className={`pointer-events-none absolute z-50 w-max max-w-[240px] whitespace-normal rounded-control bg-ink px-2 py-1 text-xs leading-snug text-surface opacity-0 shadow-md transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100 ${SIDE[side]}`}
      >
        {content}
      </span>
    </span>
  );
}
