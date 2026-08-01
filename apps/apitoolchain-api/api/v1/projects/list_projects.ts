import { pool } from "../../../dbnode/pool";
import * as projectsQ from "../../../dbnode/projects";
import type { Projects } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { toProject } from "../__kit/mappers";

/** GET /projects — projects in the caller's current org. */
export const listProjects: Projects["list"] = async (ctx) => {
  const auth = await requireAuth(ctx);
  const rows = await projectsQ.listProjectsByOrg(pool, { orgId: auth.orgId });
  return rows.map(toProject);
};
