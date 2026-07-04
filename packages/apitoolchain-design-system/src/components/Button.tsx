import type { ReactNode } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";
import { AnchorLink, type LinkComponent } from "./routing";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "warning";
export type ButtonSize = "sm" | "md";

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon. */
  icon?: IconName;
  /** Trailing icon (e.g. a chevron for a dropdown trigger). */
  iconRight?: IconName;
  onClick?: () => void;
  /** Render as a link (uses `linkComponent` when provided, else a plain <a>). */
  href?: string;
  linkComponent?: LinkComponent;
  disabled?: boolean;
  type?: "button" | "submit";
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-ink text-white hover:bg-body",
  secondary: "border-line bg-surface text-ink hover:bg-surface-muted",
  ghost: "border-transparent bg-transparent text-muted hover:bg-hover",
  warning:
    "border-transparent bg-amber-btn text-white hover:bg-amber-btn-hover",
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
  onClick,
  href,
  linkComponent,
  disabled,
  type = "button",
}: ButtonProps) {
  const cls = `inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-control border font-medium leading-5 no-underline transition-[background-color,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT[variant]} ${SIZE[size]}`;
  const isz = size === "sm" ? 14 : 16;
  const inner = (
    <>
      {icon && <Icon icon={icon} size={isz} />}
      {children}
      {iconRight && <Icon icon={iconRight} size={isz} />}
    </>
  );

  if (href && !disabled) {
    const Link = linkComponent ?? AnchorLink;
    return (
      <Link href={href} className={cls} onClick={onClick}>
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
