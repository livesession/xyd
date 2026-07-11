import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** The floating content shown on hover/focus. */
  content: ReactNode;
  /** The trigger — anything. Keyboard tooltips need a focusable trigger. */
  children: ReactNode;
  /** Which side of the trigger the bubble sits on. Defaults to `top`. */
  side?: TooltipSide;
}

/** Fixed-position placement (left/top + transform) for the bubble, per side. */
function place(
  side: TooltipSide,
  r: DOMRect,
): { left: number; top: number; transform: string } {
  switch (side) {
    case "bottom":
      return {
        left: r.left + r.width / 2,
        top: r.bottom + 6,
        transform: "translate(-50%, 0)",
      };
    case "left":
      return {
        left: r.left - 6,
        top: r.top + r.height / 2,
        transform: "translate(-100%, -50%)",
      };
    case "right":
      return {
        left: r.right + 6,
        top: r.top + r.height / 2,
        transform: "translate(0, -50%)",
      };
    default:
      return {
        left: r.left + r.width / 2,
        top: r.top - 6,
        transform: "translate(-50%, -100%)",
      };
  }
}

/**
 * A general tooltip: wrap any trigger and pass `content`. Reveals on hover and
 * on keyboard focus. The bubble is portaled to `<body>` with fixed positioning
 * so an ancestor's overflow (e.g. a modal) can never clip it, and it's
 * `pointer-events-none` so it never eats the trigger's interactions.
 */
export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const show = () =>
    setRect(triggerRef.current?.getBoundingClientRect() ?? null);
  const hide = () => setRect(null);

  // While shown, keep the bubble pinned to the trigger through scroll/resize.
  useEffect(() => {
    if (!rect) return;
    const track = () =>
      setRect(triggerRef.current?.getBoundingClientRect() ?? null);
    window.addEventListener("scroll", track, true);
    window.addEventListener("resize", track);
    return () => {
      window.removeEventListener("scroll", track, true);
      window.removeEventListener("resize", track);
    };
  }, [rect]);

  const pos = rect ? place(side, rect) : null;

  return (
    <>
      <span
        ref={triggerRef}
        aria-describedby={rect ? id : undefined}
        className="inline-flex"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {pos &&
        createPortal(
          <span
            role="tooltip"
            id={id}
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              transform: pos.transform,
              zIndex: 80,
            }}
            className="pointer-events-none w-max max-w-[240px] whitespace-normal rounded-control bg-ink px-2 py-1 text-xs leading-snug text-surface shadow-md"
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
}
