import type { MouseEvent } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";

export interface CardProps {
  title: string;
  description: string;
  /** Optional leading icon; when set the card renders as a heavier "tile". */
  icon?: IconName;
  /** Show the up-right arrow next to the title. Defaults to true. */
  showArrow?: boolean;
  href?: string;
  onClick?: () => void;
}

/**
 * The "Developer quickstart" card. 6px radius, a soft card border/shadow, with
 * a shadow-lift + border darken on hover and a subtle `scale(.985)` press.
 * When given an `icon` it renders as a slightly heavier icon tile (8px radius,
 * 15px/600 title).
 */
export function Card({
  title,
  description,
  icon,
  showArrow = true,
  href,
  onClick,
}: CardProps) {
  const hasIcon = !!icon;

  // With no real destination, keep it an accessible anchor but stop the
  // placeholder navigation (avoids React's javascript: URL warning + page jump).
  const isPlaceholder = !href;
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (isPlaceholder) e.preventDefault();
    onClick?.();
  };

  return (
    <a
      href={href ?? "#"}
      onClick={handleClick}
      className={`relative isolate flex cursor-pointer flex-col justify-center border border-line-card bg-surface text-[color-mix(in_oklab,currentColor_80%,transparent)] no-underline shadow-card transition-transform active:scale-[0.985] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-alpha-02 before:opacity-0 before:transition-opacity before:content-[''] hover:before:opacity-100 ${hasIcon ? "rounded-control p-4" : "rounded-card p-3"}`}
    >
      {hasIcon && (
        <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-control bg-surface-raised text-ink">
          <Icon icon={icon} size={20} />
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <span
          className={`leading-5 tracking-[-0.01em] text-ink ${hasIcon ? "text-[15px] font-semibold" : "text-sm font-normal"}`}
        >
          {title}
        </span>
        {showArrow && (
          <span className="inline-flex shrink-0 text-ink">
            <Icon icon="arrowUpRight" size={18} />
          </span>
        )}
      </div>
      <div className="mt-1 text-xs leading-[18px] text-muted">
        {description}
      </div>
    </a>
  );
}
