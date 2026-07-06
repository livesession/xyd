import type { Projects } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as projectsQ from "../../db/generated/projects_sql";
import { pool } from "../../db/pool";
import { toProject } from "../../mappers";
import { invalid, notFound } from "../errors";

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
