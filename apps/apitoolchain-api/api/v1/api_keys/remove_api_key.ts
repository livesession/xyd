import * as keyQ from "../../../dbnode/api_keys";
import { pool } from "../../../dbnode/pool";
import type { ApiKeys } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";

/** DELETE /api-keys/{id} — revoke a key (scoped to the caller's project). */
export const removeApiKey: ApiKeys["remove"] = async (ctx, id) => {
  const auth = await requireAuth(ctx);
  await keyQ.deleteApiKey(pool, { id, projectId: auth.projectId });
};
