import * as ctxQ from "../../../dbnode/context";
import { pool } from "../../../dbnode/pool";
import type { Context } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { readContext } from "./get_context";

/** PATCH /context — rename the caller's current org / project. */
export const updateContext: Context["update"] = async (ctx, input) => {
  const auth = await requireAuth(ctx);
  if (input.orgName) {
    await ctxQ.updateOrgName(pool, { id: auth.orgId, name: input.orgName });
  }
  if (input.projectName) {
    await ctxQ.updateProjectName(pool, {
      id: auth.projectId,
      name: input.projectName,
    });
  }
  return readContext(ctx);
};
