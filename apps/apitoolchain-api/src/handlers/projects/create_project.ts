import type { Projects } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as projectsQ from "../../db/generated/projects_sql";
import { pool } from "../../db/pool";
import { toProject } from "../../mappers";
import { randomId } from "../../util";
import { invalid } from "../errors";

/** POST /projects — create a project in the caller's current org. */
export const createProject: Projects["create"] = async (ctx, input) => {
  const auth = await requireAuth(ctx);
  const name = input.name.trim();
  if (!name) return invalid("a project name is required");
  const row = await projectsQ.insertProject(pool, {
    id: randomId("prj"),
    orgId: auth.orgId,
    name,
  });
  if (!row) return invalid("could not create the project");
  return toProject(row);
};
