import { pool } from "../../../dbnode/pool";
import * as projectsQ from "../../../dbnode/projects";
import type { Projects } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid, notFound } from "../__kit/errors";

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
