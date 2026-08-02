import * as React from "react";
import { RouterContext } from "./context";
import { useHref, useLocation } from "./hooks";

const sameOrigin = (href: string) =>
  typeof window === "undefined" ? true : new URL(href, window.location.href).origin === window.location.origin;

/**
 * SPA link. Accepts BOTH `to` (FwLink, object or string) and `href` (xyd-ui
 * Sidebar spreads `href`). Calls the user `onClick` first, then intercepts
 * plain same-origin left-clicks for client-side nav; bails on defaultPrevented
 * (Toc), modifiers, non-_self target, download, cross-origin. `prefetch` is
 * dropped from the DOM spread (invalid <a> attribute otherwise).
 */
export const Link = React.forwardRef<HTMLAnchorElement, any>(function Link(
  { to, href, replace, target, download, prefetch, onClick, children, ...rest },
  ref
) {
  const s = React.useContext(RouterContext);
  const dest = to ?? href ?? "";
  const resolved = useHref(dest);

  const click = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return; // Toc.Item relies on this
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (target && target !== "_self") return;
    if (download != null) return;
    if (!sameOrigin(resolved)) return;
    if (!s) return;
    e.preventDefault();
    s.navigate(dest, { replace });
  };

  return (
    <a ref={ref} href={resolved} target={target} download={download} onClick={click} {...rest}>
      {children}
    </a>
  );
});

export const NavLink = React.forwardRef<HTMLAnchorElement, any>(function NavLink(props, ref) {
  const loc = useLocation();
  const resolved = useHref(props.to ?? props.href ?? "");
  const isActive = resolved.split(/[?#]/)[0] === loc.pathname;
  const className = typeof props.className === "function" ? props.className({ isActive }) : props.className;
  return <Link ref={ref} {...props} className={className} aria-current={isActive ? "page" : undefined} />;
});
