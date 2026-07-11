import type { ReactNode } from "react";

export interface LinkProps {
  children: ReactNode;
  /** Navigate to a URL (renders an `<a>`). */
  href?: string;
  /** Action mode — renders a link-styled `<button>` (e.g. opens a modal). */
  onClick?: () => void;
  /** Open the `href` in a new browser tab (adds `rel="noreferrer"`). Default `true`. */
  external?: boolean;
  /** Monospace + slightly smaller + truncating — for repo paths, ids, URLs. */
  mono?: boolean;
  /**
   * Add nothing of its own — inherit the surrounding text's colour AND size and
   * only reveal an underline on hover. For links embedded in already-styled
   * text (a heading, a muted caption, a footer) that should blend in seamlessly
   * rather than turn blue or shift size.
   */
  subtle?: boolean;
  /**
   * Animate the underline: instead of snapping in on hover, it slides in from
   * the left. Drawn as a `currentColor` gradient, so it tracks the link colour
   * (works with `subtle` too).
   */
  sliding?: boolean;
  className?: string;
}

/**
 * A styled hyperlink: blue, underline-on-hover. With `href` it's an anchor
 * (external by default — the `mono` variant matches the connected-repo link,
 * e.g. `apitoolchain/livesession-openapi`); with `onClick` (no `href`) it's a
 * link-styled button for in-app actions. Pass `subtle` to drop the blue and
 * inherit the parent's colour; pass `sliding` to slide the underline in from
 * the left on hover.
 */
export function Link({
  children,
  href,
  onClick,
  external = true,
  mono,
  subtle,
  sliding,
  className,
}: LinkProps) {
  const color = subtle ? "text-inherit" : "text-blue";
  // Subtle links inherit the parent's font-size (omit the size class — size is
  // inherited by default); otherwise the small link size (mono a touch smaller).
  const size = subtle ? "" : mono ? "text-[13px]" : "text-sm";
  const family = mono ? "min-w-0 truncate font-mono" : "";
  // A left-anchored currentColor gradient whose width grows 0% -> 100% on hover
  // reads as an underline sliding in from the left; otherwise the instant one.
  const underline = sliding
    ? "[background-image:linear-gradient(currentColor,currentColor)] [background-repeat:no-repeat] [background-position:0_100%] [background-size:0%_1px] transition-[background-size] duration-300 ease-out hover:[background-size:100%_1px]"
    : "hover:underline";
  const cls = [color, "no-underline", underline, family, size, className]
    .filter(Boolean)
    .join(" ");
  if (href) {
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className={cls}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer border-none bg-transparent p-0 text-left ${cls}`}
    >
      {children}
    </button>
  );
}
