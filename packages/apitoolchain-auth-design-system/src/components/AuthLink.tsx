import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type AuthLinkOwnProps<T extends ElementType> = {
  /** Element or component to render as — e.g. a router `Link` (`as={Link}`).
   * Defaults to a plain `<a>`. */
  as?: T;
  children?: ReactNode;
  className?: string;
};

export type AuthLinkProps<T extends ElementType = "a"> = AuthLinkOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof AuthLinkOwnProps<T>>;

/**
 * A text link with the shared auth styling — medium weight, underlined, ink
 * colour. Polymorphic via `as` so the styling lives in one place regardless of
 * the router:
 *
 * ```tsx
 * <AuthLink as={Link} to="/register">Create an account</AuthLink>
 * ```
 */
export function AuthLink<T extends ElementType = "a">({
  as,
  className,
  ...rest
}: AuthLinkProps<T>) {
  const Comp = (as ?? "a") as ElementType;
  return (
    <Comp
      className={[
        "font-medium text-ink underline underline-offset-2 hover:text-body",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
