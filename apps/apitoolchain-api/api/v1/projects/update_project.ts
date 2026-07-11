import { pool } from "../../../dbnode/pool";
import * as projectsQ from "../../../dbnode/projects";
import type { Projects } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid, notFound } from "../__kit/errors";
import { toProject } from "../__kit/mappers";

/** PATCH /projects/{id} — rename a project (must be in the caller's org). */
export const updateProject: Projects["update"] = async (ctx, id, input) => {
  const auth = await requireAuth(ctx);
  const name = input.name.trim();
  if (!name) return invalid("a project name is required");
  const row = await projectsQ.renameProject(pool, {
    id,
    orgId: auth.orgId,
    name,
  });
  if (!row) return notFound(`project ${id} not found`);
  return toProject(row);
};
