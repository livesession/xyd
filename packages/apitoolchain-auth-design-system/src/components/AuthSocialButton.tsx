import { AnchorLink, type LinkComponent } from "@apitoolchain/design-system";
import type { ReactNode } from "react";

export interface AuthSocialButtonProps {
  children: ReactNode;
  /** A brand mark rendered before the label (e.g. `<AuthGoogleMark />`). */
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  linkComponent?: LinkComponent;
  disabled?: boolean;
  type?: "button" | "submit";
}

/**
 * A full-width, bordered "Continue with …" social/OAuth action that sits above
 * the email option on an auth card. Full (pill) radius to match {@link AuthButton}
 * and {@link AuthInput}.
 */
export function AuthSocialButton({
  children,
  icon,
  onClick,
  href,
  linkComponent,
  disabled,
  type = "button",
}: AuthSocialButtonProps) {
  const cls =
    "flex w-full cursor-pointer items-center justify-center gap-2 rounded-pill border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink no-underline transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60";
  const inner = (
    <>
      {icon}
      {children}
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
