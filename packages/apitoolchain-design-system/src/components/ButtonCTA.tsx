import type { ReactNode } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";
import type { ButtonVariant } from "./Button";
import { AnchorLink, type LinkComponent } from "./routing";

export interface ButtonCTAProps {
  children: ReactNode;
  variant?: ButtonVariant;
  icon?: IconName;
  iconRight?: IconName;
  onClick?: () => void;
  /** Render as a link (uses `linkComponent` when provided, else a plain <a>). */
  href?: string;
  linkComponent?: LinkComponent;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-ink text-white hover:bg-body",
  secondary: "border-line bg-surface text-ink hover:bg-surface-muted",
  ghost: "border-transparent bg-transparent text-muted hover:bg-hover",
  warning:
    "border-transparent bg-amber-btn text-white hover:bg-amber-btn-hover",
  danger: "border-transparent bg-danger text-white hover:opacity-90",
};

/**
 * A call-to-action button: like {@link Button}, but rounded-full with more
 * vertical padding / height and centered content — for the one prominent action
 * on a surface. Defaults to the primary variant.
 */
export function ButtonCTA({
  children,
  variant = "primary",
  icon,
  iconRight,
  onClick,
  href,
  linkComponent,
  disabled,
  type = "button",
  className,
}: ButtonCTAProps) {
  const cls = `inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-pill border px-5 py-2.5 text-sm font-semibold leading-6 no-underline transition-[background-color,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT[variant]} ${className ?? ""}`;
  const inner = (
    <>
      {icon && <Icon icon={icon} size={18} />}
      {children}
      {iconRight && <Icon icon={iconRight} size={18} />}
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
