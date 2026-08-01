import type { ReactNode } from "react";

export interface AuthButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  /** `primary` = dark filled (the main action); `secondary` = bordered white. */
  variant?: "primary" | "secondary";
}

/** The full-width primary action on an auth card (e.g. "Continue with email"). */
export function AuthButton({
  children,
  onClick,
  disabled,
  type = "submit",
  variant = "primary",
}: AuthButtonProps) {
  const v =
    variant === "primary"
      ? "border-transparent bg-ink text-white hover:bg-body"
      : "border-line bg-surface text-ink hover:bg-surface-muted";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full cursor-pointer items-center justify-center rounded-pill border px-4 py-2.5 text-sm font-medium transition-[background-color,transform] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${v}`}
    >
      {children}
    </button>
  );
}
