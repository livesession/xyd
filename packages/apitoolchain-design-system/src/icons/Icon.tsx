import { ICONS, type IconEntry, type IconName } from "./registry";

export interface IconProps {
  /** Registry key of the glyph to render. */
  icon: IconName;
  /** Square size in px. Defaults to 20. (Set as SVG width/height attrs.) */
  size?: number;
  /** Stroke width for stroke-based glyphs. Defaults to 1.8. */
  strokeWidth?: number;
  className?: string;
}

/**
 * Renders a glyph from the centralized icon registry. Color is inherited via
 * `currentColor` — set a Tailwind text color on a parent to tint the icon.
 * Size is a numeric prop applied as SVG width/height attributes (no inline
 * style), so it stays dynamic without a `style` prop.
 */
export function Icon({
  icon,
  size = 20,
  strokeWidth = 1.8,
  className,
}: IconProps) {
  const entry: IconEntry = ICONS[icon];
  const common = {
    width: size,
    height: size,
    viewBox: entry.vb,
    "aria-hidden": true as const,
    className: className ? `block shrink-0 ${className}` : "block shrink-0",
    dangerouslySetInnerHTML: { __html: entry.body },
  };

  if (entry.stroke) {
    return (
      <svg
        {...common}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  return <svg {...common} fill="currentColor" />;
}
