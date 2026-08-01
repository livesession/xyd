import type { LinkComponentProps } from "@apitoolchain/design-system";
import { Link } from "react-router";

/**
 * Adapts the design system's router-agnostic `LinkComponent` contract to a real
 * React Router `<Link>`. Injected into DS components (Sidebar, Table, Tabs, …)
 * so they navigate client-side while the DS stays router-free.
 */
export function RouterLink({ href, children, ...rest }: LinkComponentProps) {
  return (
    <Link to={href} {...rest}>
      {children}
    </Link>
  );
}
