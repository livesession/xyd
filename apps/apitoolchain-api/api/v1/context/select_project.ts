import * as authQ from "../../../dbnode/auth";
import { pool } from "../../../dbnode/pool";
import * as projectsQ from "../../../dbnode/projects";
import type { Context } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { notFound } from "../__kit/errors";
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
