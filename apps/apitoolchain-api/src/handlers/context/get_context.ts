import type { CurrentContext } from "../../../generated/src/generated/models/all/apitoolchain";
import * as ctxQ from "../../db/generated/context_sql";
import { pool } from "../../db/pool";

/** GET /context — the seeded single-tenant org + project (auth deferred). */
export async function readContext(): Promise<CurrentContext> {
  const row = await ctxQ.getContext(pool);
  if (!row) {
    return {
      org: { id: "org_default", name: "Acme Inc.", plan: "Free plan" },
      project: { id: "prj_default", name: "Default", orgId: "org_default" },
    };
  }
  return {
    org: { id: row.orgId, name: row.orgName, plan: row.orgPlan },
    project: { id: row.projectId, name: row.projectName, orgId: row.orgId },
  };
}
