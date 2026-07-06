import { HttpResponderError } from "../../../generated/src/generated/helpers/http";
import type { Context } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as authQ from "../../db/generated/auth_sql";
import * as projectsQ from "../../db/generated/projects_sql";
import { pool } from "../../db/pool";
import { toProject, toUser } from "../../mappers";

/** GET /context — the signed-in user, their current org + project, and the
 * org's project list (for the sidebar switcher). */
export const readContext: Context["read"] = async (ctx) => {
  const auth = await requireAuth(ctx);
  const [user, org, projects] = await Promise.all([
    authQ.getUserById(pool, { id: auth.userId }),
    projectsQ.getOrg(pool, { id: auth.orgId }),
    projectsQ.listProjectsByOrg(pool, { orgId: auth.orgId }),
  ]);
  if (!user || !org) throw new HttpResponderError(401, "unauthorized");
  const current = projects.find((p) => p.id === auth.projectId) ?? projects[0];
  return {
    user: toUser(user),
    org: { id: org.id, name: org.name, plan: org.plan },
    project: current
      ? toProject(current)
      : { id: auth.projectId, name: "Default", orgId: auth.orgId },
    projects: projects.map(toProject),
  };
};
