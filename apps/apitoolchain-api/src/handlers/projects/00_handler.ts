import type { Projects } from "../../../generated/src/generated/models/all/platform-api";
import { createProject } from "./create_project";
import { listProjects } from "./list_projects";
import { removeProject } from "./remove_project";
import { updateProject } from "./update_project";

/** `/projects` — CRUD over the current org's projects. */
export const projects: Projects = {
  list: listProjects,
  create: createProject,
  update: updateProject,
  remove: removeProject,
};
