import { Sidebar } from "@apitoolchain/design-system";
import { useState } from "react";
import { useFetcher, useLocation } from "react-router";
import type { Organization, Project, User } from "~/data";
import { NewProjectModal } from "./NewProjectModal";
import { RouterLink } from "./RouterLink";

/**
 * The router-aware sidebar: active-by-path, real project switcher + account
 * menu. Mutations (select/create project, logout) submit to resource routes via
 * a fetcher, which revalidates the app-layout context.
 */
export function AppSidebar({
  user,
  org,
  project,
  projects,
}: {
  user: User;
  org: Organization;
  project: Project;
  projects: Project[];
}) {
  const { pathname } = useLocation();
  const fetcher = useFetcher();
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  return (
    <>
      <Sidebar
        activeHref={pathname}
        linkComponent={RouterLink}
        projects={projects}
        currentProjectId={project.id}
        onSelectProject={(id) =>
          fetcher.submit(
            { intent: "select", projectId: id },
            { method: "post", action: "/projects" },
          )
        }
        onCreateProject={() => setNewProjectOpen(true)}
        user={{
          name: user.name,
          email: user.email,
          orgName: org.name,
          plan: org.plan,
        }}
        onLogout={() =>
          fetcher.submit({}, { method: "post", action: "/logout" })
        }
      />
      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
      />
    </>
  );
}
