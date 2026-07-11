import { pool } from "../../../dbnode/pool";
import * as projectsQ from "../../../dbnode/projects";
import { randomId } from "../../../util";
import type { Projects } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid } from "../__kit/errors";
import { toProject } from "../__kit/mappers";

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
