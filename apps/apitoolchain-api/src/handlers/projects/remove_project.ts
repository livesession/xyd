import type { Projects } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as projectsQ from "../../db/generated/projects_sql";
import { pool } from "../../db/pool";
import { invalid, notFound } from "../errors";

/** DELETE /projects/{id} — delete a project (not the current or the last one). */
export const removeProject: Projects["remove"] = async (ctx, id) => {
  const auth = await requireAuth(ctx);
  const project = await projectsQ.getProject(pool, { id });
  if (!project || project.orgId !== auth.orgId) {
    return notFound(`project ${id} not found`);
  }
  if (id === auth.projectId) {
    return invalid("switch to another project before deleting this one");
  }
  const count = await projectsQ.countProjectsInOrg(pool, {
    orgId: auth.orgId,
  });
  if ((count?.n ?? 0) <= 1) {
    return invalid("an org must have at least one project");
  }
  await projectsQ.deleteProject(pool, { id, orgId: auth.orgId });
};
