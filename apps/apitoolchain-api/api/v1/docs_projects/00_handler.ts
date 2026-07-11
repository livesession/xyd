import type { DocsProjects } from "../../openapi/v1/src/generated/models/all/platform-api";
import { createDocsProject } from "./create_docs_project";
import { listDocsProjects } from "./list_docs_projects";

/** `/docs-projects` — list + create (build deferred to a queued job). */
export const docsProjects: DocsProjects = {
  list: listDocsProjects,
  create: createDocsProject,
};
