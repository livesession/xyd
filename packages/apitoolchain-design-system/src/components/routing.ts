import { createElement } from "react";
import type { ComponentType, ReactNode } from "react";

/**
 * Props the design system passes to an injected link element. The DS stays
 * router-agnostic (it cannot import `react-router`), so navigation components
 * (Sidebar, Table, Tabs, Breadcrumb, …) accept a `linkComponent` that renders
 * the host app's real `<Link>`. Styling is via `className` (Tailwind) — hover
 * is handled by CSS `hover:` variants, so no JS mouse handlers are needed.
 */
export interface LinkComponentProps {
  href: string;
  className?: string;
  title?: string;
  "aria-current"?: "page";
  onClick?: () => void;
  children?: ReactNode;
}

export type LinkComponent = ComponentType<LinkComponentProps>;

/** A plain anchor — the fallback used when no `linkComponent` is injected. */
export function AnchorLink({ children, ...rest }: LinkComponentProps) {
  return createElement("a", rest, children);
}

/**
 * Is `href` the active nav target for the current path? Prefix-matches by
 * default so a section root (`/registry`) stays active on its detail routes
 * (`/registry/:id`); the root `/` only matches exactly.
 */
export function isActiveHref(
  href: string,
  current: string,
  exact = false,
): boolean {
  if (!current) return false;
  const norm = (s: string) =>
    s.length > 1 && s.endsWith("/") ? s.slice(0, -1) : s;
  const h = norm(href);
  const c = norm(current);
  if (h === "/") return c === "/";
  if (exact) return c === h;
  return c === h || c.startsWith(`${h}/`);
}
