import type { ReactNode } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";
import { AnchorLink, type LinkComponent } from "./routing";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "warning"
  | "danger"
  | "danger-ghost";
export type ButtonSize = "sm" | "md";

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon. */
  icon?: IconName;
  /** Trailing icon (e.g. a chevron for a dropdown trigger). */
  iconRight?: IconName;
  /** Override the trailing icon size (px). Defaults to the button's icon size. */
  iconRightSize?: number;
  onClick?: () => void;
  /** Render as a link (uses `linkComponent` when provided, else a plain <a>). */
  href?: string;
  linkComponent?: LinkComponent;
  /** Open `href` in a new tab — forces a plain anchor with a safe `rel`. Pair
   * with `iconRight="externalLink"` to signal it leaves the current tab. */
  newTab?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-ink text-white hover:bg-body",
  secondary: "border-line bg-surface text-ink hover:bg-surface-muted",
  ghost: "border-transparent bg-transparent text-muted hover:bg-hover",
  warning:
    "border-transparent bg-amber-btn text-white hover:bg-amber-btn-hover",
  danger: "border-transparent bg-danger text-white hover:opacity-90",
  // Ghost, but tinted danger — a subtle destructive action (red text + icon).
  "danger-ghost":
    "border-transparent bg-transparent text-danger hover:bg-danger-bg",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "gap-1 px-2 py-1 text-[12px]",
  md: "gap-1.5 px-3 py-[5px] text-[13px]",
};

/** A single button/link with the four platform variants. */
export function Button({
  children,
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  iconRightSize,
  onClick,
  href,
  linkComponent,
  newTab,
  disabled,
  type = "button",
}: ButtonProps) {
  const cls = `inline-flex cursor-pointer items-center justify-start whitespace-nowrap rounded-control border font-medium leading-5 no-underline transition-[background-color,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT[variant]} ${SIZE[size]}`;
  const isz = size === "sm" ? 14 : 16;
  const inner = (
    <>
      {icon && <Icon icon={icon} size={isz} />}
      {children}
      {iconRight && <Icon icon={iconRight} size={iconRightSize ?? isz} />}
    </>
  );

  if (href && !disabled) {
    // A new-tab link is a fresh document load, so SPA navigation doesn't apply —
    // always use a plain anchor with the safe rel.
    const Link = newTab ? AnchorLink : (linkComponent ?? AnchorLink);
    const linkProps = newTab
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};
    return (
      <Link href={href} className={cls} onClick={onClick} {...linkProps}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}
