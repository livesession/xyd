import { AppShell } from "@apitoolchain/design-system";
import { Outlet } from "react-router";
import { requireUser } from "~/auth.server";
import { AppSidebar } from "~/components/AppSidebar";
import { getCurrentContext } from "~/data";
import type { Route } from "./+types/app-layout";

/** Gate everything under the app frame + load the current context for the shell. */
export async function loader() {
  await requireUser();
  return getCurrentContext();
}

/**
 * The app frame: the design-system AppShell hosting the router-aware AppSidebar
 * (real project switcher + account menu) with the section pages in the Outlet.
 */
export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { user, org, project, projects } = loaderData;
  return (
    <AppShell
      sidebar={
        <AppSidebar
          user={user}
          org={org}
          project={project}
          projects={projects}
        />
      }
    >
      <Outlet />
    </AppShell>
  );
}
