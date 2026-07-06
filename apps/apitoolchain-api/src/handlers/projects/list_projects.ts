import type { Projects } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as projectsQ from "../../db/generated/projects_sql";
import { pool } from "../../db/pool";
import { toProject } from "../../mappers";

/** GET /projects — projects in the caller's current org. */
export const listProjects: Projects["list"] = async (ctx) => {
  const auth = await requireAuth(ctx);
  const rows = await projectsQ.listProjectsByOrg(pool, { orgId: auth.orgId });
  return rows.map(toProject);
};
