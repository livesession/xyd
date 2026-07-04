import type { Context } from "../../../generated/src/generated/models/all/platform-api";
import * as ctxQ from "../../db/generated/context_sql";
import { pool } from "../../db/pool";
import { readContext } from "./get_context";

/** PATCH /context — rename the org / project, then return the fresh context. */
export const updateContext: Context["update"] = async (_ctx, input) => {
  const row = await ctxQ.getContext(pool);
  if (row) {
    if (input.orgName) {
      await ctxQ.updateOrgName(pool, { id: row.orgId, name: input.orgName });
    }
    if (input.projectName) {
      await ctxQ.updateProjectName(pool, {
        id: row.projectId,
        name: input.projectName,
      });
    }
  }
  return readContext();
};
