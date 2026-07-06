import type { Context } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as authQ from "../../db/generated/auth_sql";
import * as projectsQ from "../../db/generated/projects_sql";
import { pool } from "../../db/pool";
import { notFound } from "../errors";
import { readContext } from "./get_context";

/** POST /context/select — switch the caller's current project (persisted). */
export const selectProject: Context["selectProject"] = async (ctx, input) => {
  const auth = await requireAuth(ctx);
  const project = await projectsQ.getProject(pool, { id: input.projectId });
  if (!project || project.orgId !== auth.orgId) {
    return notFound(`project ${input.projectId} not found`);
  }
  await authQ.setCurrentProject(pool, {
    userId: auth.userId,
    currentProjectId: input.projectId,
  });
  // requireAuth re-reads user_settings, so this reflects the new current project.
  return readContext(ctx);
};
