import { AppShell, Sidebar } from "@apitoolchain/design-system";
import { Outlet, useLocation } from "react-router";
import { RouterLink } from "~/components/RouterLink";

/**
 * The app frame: the design-system AppShell hosting a router-aware Sidebar
 * (active-by-path, links via RouterLink) with the section pages in the Outlet.
 */
export default function AppLayout() {
  const { pathname } = useLocation();
  return (
    <AppShell
      sidebar={<Sidebar activeHref={pathname} linkComponent={RouterLink} />}
    >
      <Outlet />
    </AppShell>
  );
}
